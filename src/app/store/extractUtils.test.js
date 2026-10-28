import { groupTransactionsByType, markMonthlyPendingPayments, resolveWeeklyFetch } from "./extractUtils";

describe("groupTransactionsByType", () => {
  it("returns empty object if input is empty or not an array", () => {
    expect(groupTransactionsByType([])).toEqual({});
    expect(groupTransactionsByType(null)).toEqual({});
    expect(groupTransactionsByType(undefined)).toEqual({});
  });

  it("groups transactions by tipo_transacao and sums values and counts", () => {
    const mockTransactions = [
      { tipo_transacao: "Integral", valor_pagamento: 4.3 },
      { tipo_transacao: "Integral", valor_pagamento: 4.3 },
      { tipo_transacao: "Gratuidade", valor_pagamento: 0 },
      { tipo_transacao: "Integração", valor_pagamento: 2.15 },
      { tipo_transacao: "Botoeira", valor_pagamento: 0 },
    ];

    const result = groupTransactionsByType(mockTransactions);

    expect(result).toEqual({
      Integral: { count: 2, transactionValue: 8.6 },
      Integração: { count: 1, transactionValue: 2.15 },
      Gratuidade: { count: 1, transactionValue: 0 },
      Botoeira: { count: 1, transactionValue: 0 },
    });
  });

  it("handles fallback property names like transactionType and valor", () => {
    const mockTransactions = [
      { transactionType: "Integral", transactionValue: 5 },
      { tipoTransacao: "Outros", valor: 10 },
    ];

    const result = groupTransactionsByType(mockTransactions);

    expect(result).toEqual({
      Integral: { count: 1, transactionValue: 5 },
      Outros: { count: 1, transactionValue: 10 },
    });
  });
});

describe("markMonthlyPendingPayments (#1164)", () => {
  it("marks a past-dated row without remittance status as Pendência de Pagamento", () => {
    const [row] = markMonthlyPendingPayments([
      {
        data: "2000-10-02T00:00:00.000Z",
        dataTentativaPagamento: "2000-10-02",
        valorTotal: 258.8,
        statusRemessa: null,
      },
    ]);

    expect(row.paymentStatus).toBe("Pendência de Pagamento");
  });

  it("keeps a future-dated row without remittance status without a pending mark", () => {
    const [row] = markMonthlyPendingPayments([
      {
        data: "2999-10-02T00:00:00.000Z",
        dataTentativaPagamento: "2999-10-02",
        valorTotal: 258.8,
        statusRemessa: null,
      },
    ]);

    expect(row.paymentStatus).toBeUndefined();
  });
});

describe("resolveWeeklyFetch", () => {
  it("uses the grouped order id when it is present, regardless of payment status", () => {
    expect(
      resolveWeeklyFetch({ idOrdem: "123", paymentStatus: "Pendência de Pagamento", clickedDate: "2026-10-23" })
    ).toEqual({ mode: "agrupado", params: { idOrdem: "123" } });

    expect(
      resolveWeeklyFetch({ idOrdem: "123", paymentStatus: undefined, clickedDate: "2026-10-23" })
    ).toEqual({ mode: "agrupado", params: { idOrdem: "123" } });
  });

  it("falls back to the orphan week fetch when there is no idOrdem but the row is pending payment", () => {
    expect(
      resolveWeeklyFetch({ idOrdem: null, paymentStatus: "Pendência de Pagamento", clickedDate: "2026-10-23" })
    ).toEqual({ mode: "semAgrupamento", params: { dataTentativaPagamento: "2026-10-23" } });

    expect(
      resolveWeeklyFetch({ idOrdem: undefined, paymentStatus: "Pendência de Pagamento", clickedDate: "2026-10-23" })
    ).toEqual({ mode: "semAgrupamento", params: { dataTentativaPagamento: "2026-10-23" } });
  });

  it("gives up (no fetch) when there is no idOrdem and the row is not pending payment", () => {
    expect(
      resolveWeeklyFetch({ idOrdem: null, paymentStatus: undefined, clickedDate: "2026-10-23" })
    ).toEqual({ mode: "none", params: {} });
  });

  it("gives up when pending but there is no clicked date to anchor the window", () => {
    expect(
      resolveWeeklyFetch({ idOrdem: null, paymentStatus: "Pendência de Pagamento", clickedDate: null })
    ).toEqual({ mode: "none", params: {} });
  });
});
