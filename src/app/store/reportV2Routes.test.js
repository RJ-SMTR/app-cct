import {
  buildAgentConsolidadoV2Params,
  paginateConsolidadoV2,
  splitAgentParamsByStatus,
  toAgentConsolidadoBlock,
  toApiV2Url,
  toAgentConsolidadoBlocksPorStatus,
} from './reportV2Routes';

describe('toApiV2Url', () => {
  it('swaps the version of the configured base URL', () => {
    expect(toApiV2Url('http://localhost:3000/api/v1/', 'cnab/relatorio-novo-remessa/consolidado')).toBe(
      'http://localhost:3000/api/v2/cnab/relatorio-novo-remessa/consolidado',
    );
  });
});

describe('buildAgentConsolidadoV2Params', () => {
  it('drops the "Todos" association, which is not a filter', () => {
    expect(buildAgentConsolidadoV2Params({ dataInicio: 'x', consorcioNome: 'Todos' })).toEqual({ dataInicio: 'x' });
  });

  it('keeps a specific association and guardador', () => {
    expect(buildAgentConsolidadoV2Params({ userIds: '1', consorcioNome: 'SINGAERJ' })).toEqual({ userIds: '1', consorcioNome: 'SINGAERJ' });
  });
});

describe('paginateConsolidadoV2', () => {
  const response = { count: 3, valor: 6, data: [{ valor: 1 }, { valor: 2 }, { valor: 3 }] };

  it('returns only the requested page and keeps the totals', () => {
    expect(paginateConsolidadoV2(response, 2, 2)).toEqual({ count: 3, valor: 6, data: [{ valor: 3 }] });
  });
});

describe('splitAgentParamsByStatus', () => {
  it('creates one request per selected status', () => {
    expect(splitAgentParamsByStatus({ dataInicio: 'x', pago: true, estorno: true })).toEqual([
      { status: 'pago', params: { dataInicio: 'x', pago: true } },
      { status: 'estorno', params: { dataInicio: 'x', estorno: true } },
    ]);
  });

  it('makes a single request when no status is selected', () => {
    expect(splitAgentParamsByStatus({ dataInicio: 'x' })).toEqual([{ status: 'todos', params: { dataInicio: 'x' } }]);
  });
});

describe('toAgentConsolidadoBlock', () => {
  it('maps the v2 row to the shape the screen uses', () => {
    expect(toAgentConsolidadoBlock('pago', { count: 1, valor: 9, data: [{ nomefavorecido: 'A', valor: 9 }] })).toEqual({
      status: 'pago',
      count: 1,
      valor: 9,
      data: [{ nome: 'A', valor: 9 }],
    });
  });
});

// ADR 0023 da api-cct (T11): todos os status selecionados em uma requisição só (porStatus=true).
describe('toAgentConsolidadoBlocksPorStatus', () => {
  it('maps each status block of the porStatus answer to the flag the screen uses', () => {
    const resposta = [
      { status: 'Pago', count: 1, valor: 9, data: [{ nomefavorecido: 'A', valor: 9 }] },
      { status: 'Aguardando Pagamento', count: 0, valor: 0, data: [] },
      { status: 'Estorno', count: 1, valor: 2, data: [{ nomefavorecido: 'B', valor: 2 }] },
    ];

    expect(toAgentConsolidadoBlocksPorStatus(resposta)).toEqual([
      { status: 'pago', count: 1, valor: 9, data: [{ nome: 'A', valor: 9 }] },
      { status: 'emProcessamento', count: 0, valor: 0, data: [] },
      { status: 'estorno', count: 1, valor: 2, data: [{ nome: 'B', valor: 2 }] },
    ]);
  });

  it('returns null when the API answered the old single-total shape (deploy order)', () => {
    expect(toAgentConsolidadoBlocksPorStatus({ count: 1, valor: 9, data: [] })).toBeNull();
  });
});
