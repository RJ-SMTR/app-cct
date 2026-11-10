export function toApiV2Url(baseURL, path) {
  return `${baseURL.replace(/\/v1\/?$/, '/v2/')}${path.replace(/^\/+/, '')}`;
}

// The v2 Consolidado has no combined view and rejects several filters the screen offers. Those
// searches stay on v1 instead of failing or silently returning a different report.
export function shouldUseConsolidadoV2(params = {}) {
  if (params.userIds || params.pendentes || params.desativados) {
    return false;
  }
  if (params.eleicao && params.consorcioNome) {
    return false;
  }
  if (params.stucGratuidade && (params.consorcioNome || params.todosConsorcios)) {
    return false;
  }

  const porConsorcio = Boolean(params.consorcioNome || params.todosConsorcios);
  const porFavorecido = Boolean(params.todosVanzeiros);
  return porConsorcio !== porFavorecido;
}

// The v2 Financial Movement silently ignores these filters, so they stay on v1: "desativados",
// any favorecido/consorcio filter on Eleicao, and consorcio filters on STUC-Gratuidade.
export function shouldUseFinancialMovementV2(params = {}) {
  if (params.desativados) {
    return false;
  }
  const temConsorcio = Boolean(params.consorcioNome || params.todosConsorcios);
  if (params.eleicao && (params.userIds || temConsorcio)) {
    return false;
  }
  return !(params.stucGratuidade && temConsorcio);
}

// Guardador has no consorcio on v2, so an association filter would be silently ignored there.
export function shouldUseAgentFinancialMovementV2(params = {}) {
  return !params.consorcioNome;
}

export function buildAgentConsolidadoV2Params(params = {}) {
  if (params.userIds || (params.consorcioNome && params.consorcioNome !== 'Todos')) {
    return null;
  }
  const { consorcioNome, ...v2Params } = params;
  return v2Params;
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
