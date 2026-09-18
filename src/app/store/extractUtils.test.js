import { groupTransactionsByType } from "./extractUtils";

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

