import {
  buildAgentConsolidadoV2Params,
  paginateConsolidadoV2,
  shouldUseConsolidadoV2,
  shouldUseFinancialMovementV2,
  splitAgentParamsByStatus,
  toAgentConsolidadoBlock,
  toApiV2Url,
} from './reportV2Routes';

describe('toApiV2Url', () => {
  it('swaps the version of the configured base URL', () => {
    expect(toApiV2Url('http://localhost:3000/api/v1/', 'cnab/relatorio-novo-remessa/consolidado')).toBe(
      'http://localhost:3000/api/v2/cnab/relatorio-novo-remessa/consolidado',
    );
  });
});

describe('shouldUseConsolidadoV2', () => {
  it.each([
    [{ todosVanzeiros: true }],
    [{ todosConsorcios: true }],
    [{ consorcioNome: 'STPC' }],
    [{ userIds: '1' }],
    [{ todosVanzeiros: true, todosConsorcios: true }],
    [{ todosVanzeiros: true, pendentes: true }],
    [{ todosVanzeiros: true, desativados: true }],
    [{ consorcioNome: 'STPC', eleicao: true }],
    [{ todosConsorcios: true, stucGratuidade: true }],
  ])('uses v2 for %j', (params) => {
    expect(shouldUseConsolidadoV2(params)).toBe(true);
  });

  it.each([
    [{}],
    [{ userIds: '1', consorcioNome: 'STPC' }],
    [{ todosVanzeiros: true, consorcioNome: 'STPC' }],
    [{ todosVanzeiros: true, stucGratuidade: true, desativados: true }],
    [{ todosVanzeiros: true, stucGratuidade: true, pendentes: true }],
    [{ todosVanzeiros: true, todosConsorcios: true, eleicao: true }],
  ])('keeps v1 for %j', (params) => {
    expect(shouldUseConsolidadoV2(params)).toBe(false);
  });
});

describe('shouldUseFinancialMovementV2', () => {
  it('keeps v1 only for STUC with desativados', () => {
    expect(shouldUseFinancialMovementV2({ desativados: true })).toBe(true);
    expect(shouldUseFinancialMovementV2({ eleicao: true, userIds: '1' })).toBe(true);
    expect(shouldUseFinancialMovementV2({ stucGratuidade: true, desativados: true })).toBe(false);
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
