// reportSlice imports the api client through the `app/` webpack alias, which jest does not resolve.
jest.mock('app/configs/api/api', () => ({ api: {} }), { virtual: true });
jest.mock('../auth/services/jwtService', () => ({
  __esModule: true,
  default: {},
}));

import { handleAgentFinancialData } from './reportSlice';

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

    it('sends no userIds when Todos is selected', () => {
      const requestData = handleAgentFinancialData({ dateRange, agentNames: ['Todos'] });

      expect(requestData.userIds).toBeUndefined();
    });
  });
});
