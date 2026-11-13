// reportSlice imports the api client through the `app/` webpack alias, which jest does not resolve.
jest.mock('app/configs/api/api', () => ({ api: {} }), { virtual: true });
jest.mock('../auth/services/jwtService', () => ({
  __esModule: true,
  default: {},
}));

import reportReducer, { handleAgentFinancialData, mergeReportList, setReportList } from './reportSlice';

const dateRange = [new Date(2026, 8, 1), new Date(2026, 8, 30)];

describe('handleAgentFinancialData status flags', () => {
  it.each([
    ['Pendência Paga'],
    ['Pendencia Paga'],
    ['Pendência paga'],
  ])('sends pendenciaPaga for the "%s" option', (status) => {
    const requestData = handleAgentFinancialData({ dateRange, status: [status] });

    expect(requestData.pendenciaPaga).toBe(true);
    expect(requestData.pago).toBeUndefined();
    expect(requestData.aPagar).toBeUndefined();
  });

  it('keeps sending only the selected flags', () => {
    const requestData = handleAgentFinancialData({
      dateRange,
      status: ['Pago', 'A Pagar'],
    });

    expect(requestData.pago).toBe(true);
    expect(requestData.aPagar).toBe(true);
    expect(requestData.pendenciaPaga).toBeUndefined();
  });
  describe('guardador selector', () => {
    it('sends the selected user ids as userIds', () => {
      const requestData = handleAgentFinancialData({ dateRange, agentNames: [2, 5] });

      expect(requestData.userIds).toBe('2,5');
    });

    // "Todos os guardadores" + an association filter is a union in the API (regra de Rayanne, 2026-11-13).
    it('sends todosGuardadores and no userIds when Todos is selected', () => {
      const requestData = handleAgentFinancialData({ dateRange, agentNames: ['Todos'] });

      expect(requestData.userIds).toBeUndefined();
      expect(requestData.todosGuardadores).toBe(true);
    });

    it('sends no todosGuardadores for specific guardadores', () => {
      const requestData = handleAgentFinancialData({ dateRange, agentNames: [2, 5] });

      expect(requestData.todosGuardadores).toBeUndefined();
    });
  });

  describe('associação selector', () => {
    it('sends the selected association names as consorcioNome', () => {
      const requestData = handleAgentFinancialData({
        dateRange,
        associations: ['SINGAERJ', 'ANGLAE'],
      });

      expect(requestData.consorcioNome).toBe('SINGAERJ,ANGLAE');
      expect(requestData.todosConsorcios).toBeUndefined();
    });

    it('sends todosConsorcios instead of consorcioNome when Todos is selected', () => {
      const requestData = handleAgentFinancialData({ dateRange, associations: ['Todos'] });

      expect(requestData.todosConsorcios).toBe(true);
      expect(requestData.consorcioNome).toBeUndefined();
    });
  });
});

// ADR 0023 da api-cct: a página seguinte da Movimentação Financeira não traz o resumo; a tela mantém os totais da
// primeira página.
describe('mergeReportList keeps the first page totals', () => {
  it('keeps valorTotal and count when the next page brings only rows', () => {
    const primeiraPagina = reportReducer(undefined, setReportList({ count: 120, valorTotal: 999.5, valorPago: 900, data: [{ id: 1 }] }));

    const segundaPagina = reportReducer(primeiraPagina, mergeReportList({ currentPage: 2, pageSize: 50, data: [{ id: 2 }], nextCursor: null }));

    expect(segundaPagina.reportList).toEqual(
      expect.objectContaining({ count: 120, valorTotal: 999.5, valorPago: 900, currentPage: 2, data: [{ id: 2 }] }),
    );
  });
});
