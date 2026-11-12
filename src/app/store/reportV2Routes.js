export function toApiV2Url(baseURL, path) {
  return `${baseURL.replace(/\/v1\/?$/, '/v2/')}${path.replace(/^\/+/, '')}`;
}

export function buildAgentConsolidadoV2Params(params = {}) {
  const { consorcioNome, ...v2Params } = params;
  return consorcioNome && consorcioNome !== 'Todos' ? { ...v2Params, consorcioNome } : v2Params;
}

// The v2 Consolidado returns every row at once; the screen expects one page at a time.
export function paginateConsolidadoV2(response, page, pageSize) {
  const rows = Array.isArray(response?.data) ? response.data : [];
  if (!page || !pageSize) {
    return response;
  }
  const start = (page - 1) * pageSize;
  return { ...response, data: rows.slice(start, start + pageSize) };
}

const AGENT_STATUS_FLAGS = ['pago', 'aPagar', 'emProcessamento', 'pendenciaPaga', 'rejeitado', 'estorno'];

// The Guardador screen shows one block per status, and the v2 route answers one total per
// favorecido, so each selected status gets its own request.
export function splitAgentParamsByStatus(params = {}) {
  const selected = AGENT_STATUS_FLAGS.filter((flag) => params[flag]);
  const base = Object.fromEntries(Object.entries(params).filter(([key]) => !AGENT_STATUS_FLAGS.includes(key)));

  if (selected.length === 0) {
    return [{ status: 'todos', params: base }];
  }
  return selected.map((status) => ({ status, params: { ...base, [status]: true } }));
}

export function toAgentConsolidadoBlock(status, response) {
  const rows = Array.isArray(response?.data) ? response.data : [];
  return {
    status,
    count: response?.count,
    valor: response?.valor,
    data: rows.map((row) => ({ nome: row.nomefavorecido, valor: row.valor })),
  };
}

// Status text of the API (StatusPagamento) to the status flag each Guardador block uses.
const STATUS_TO_AGENT_FLAG = {
  Pago: 'pago',
  'A Pagar': 'aPagar',
  'Aguardando Pagamento': 'emProcessamento',
  'Pendencia Paga': 'pendenciaPaga',
  Rejeitado: 'rejeitado',
  Estorno: 'estorno',
};

// ADR 0023 da api-cct (T11): with porStatus=true the API answers one block per status from a single query.
// Returns null when the API still answers the old single-total shape, so the caller falls back to one
// request per status (the deploy order of the two repos does not matter).
export function toAgentConsolidadoBlocksPorStatus(response) {
  if (!Array.isArray(response)) {
    return null;
  }
  return response.map((block) => toAgentConsolidadoBlock(STATUS_TO_AGENT_FLAG[block.status] ?? block.status, block));
}
