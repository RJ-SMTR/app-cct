jest.mock("../../../../configs/api/api", () => ({
  api: {
    request: jest.fn(),
  },
}));

jest.mock("../../../../auth/services/jwtService", () => ({
  __esModule: true,
  default: {
    isAuthTokenValid: jest.fn(),
  },
}));

jest.mock("../../../../auth/services/jwtService/jwtServiceConfig", () => ({
  __esModule: true,
  default: {},
}));

import {
  buildDuplicateOffsetReason,
  buildDuplicateRefundNote,
  buildMonthlyPaymentRowKey,
  buildMonthlyPaymentRows,
  buildPagamentoIndevido,
  getPaymentStatus,
  markDuplicateOffsetPayments,
} from "./agentesService";

describe("buildPagamentoIndevido", () => {
  const response = {
    totais: {
      quantidade: 1,
      devendo: 1,
      valorIndevido: "877.80",
      valorDebitado: "238.00",
      saldoDevedor: "639.80",
    },
    lancamentos: [
      {
        data: "2026-10-16",
        valorDevido: "160.00",
        valorPago: "120.00",
        diferenca: "-40.00",
        statusRemessa: 3,
      },
    ],
    datasDuplicidade: ["2026-10-13"],
  };

  it("monta a linha Data, Valor devido, Valor pago, Diferença e Status, com a observação do estorno", () => {
    const result = buildPagamentoIndevido(response);

    expect(result).toMatchObject({ totalSaldoDevedor: 639.8, hasBalance: true });
    expect(result.items).toEqual([
      {
        id: "2026-10-16-0",
        date: "2026-10-16",
        amountDue: 160,
        amountPaid: 120,
        difference: -40,
        differenceNote: "estorno pagamento em duplicidade em 13/10",
        status: "Pago",
      },
    ]);
  });

  it("lista as datas da duplicidade separadas por vírgula e 'e'", () => {
    expect(buildDuplicateRefundNote(["2026-09-03", "2026-09-09", "2026-09-23"])).toBe(
      "estorno pagamento em duplicidade em 03/09, 09/09 e 23/09"
    );
    expect(buildDuplicateRefundNote(["2026-09-03", "2026-09-23"])).toBe(
      "estorno pagamento em duplicidade em 03/09 e 23/09"
    );
    expect(buildDuplicateRefundNote([])).toBe("estorno pagamento em duplicidade");
  });

  it("diferença zero ou positiva não leva observação de estorno", () => {
    const result = buildPagamentoIndevido({
      totais: { saldoDevedor: "10.00" },
      lancamentos: [{ data: "2026-10-16", valorDevido: "10.00", valorPago: "10.00", diferenca: "0.00", statusRemessa: 3 }],
    });

    expect(result.items[0].differenceNote).toBe("");
  });

  it("mapeia o status da remessa", () => {
    const status = (statusRemessa) =>
      buildPagamentoIndevido({
        totais: { saldoDevedor: "1.00" },
        lancamentos: [{ data: "2026-10-16", valorDevido: "2", valorPago: "1", diferenca: "-1", statusRemessa }],
      }).items[0].status;

    expect(status(3)).toBe("Pago");
    expect(status(5)).toBe("Pago");
    expect(status(4)).toBe("Rejeitado");
    expect(status(2)).toBe("Aguardando Pagamento");
    expect(status(0)).toBe("A pagar");
  });

  it("não mostra o quadro quando o guardador não tem saldo devedor", () => {
    expect(
      buildPagamentoIndevido({ totais: { valorIndevido: "56.00", valorDebitado: "56.00", saldoDevedor: "0.00" }, lancamentos: [] })
        .hasBalance
    ).toBe(false);
  });

  it("resposta vazia ou sem lançamentos não quebra e não mostra o quadro", () => {
    expect(buildPagamentoIndevido(undefined)).toMatchObject({ hasBalance: false, items: [] });
    expect(buildPagamentoIndevido({ totais: {}, lancamentos: null })).toMatchObject({ totalSaldoDevedor: 0, items: [] });
  });
});

describe("agentesService payment normalization", () => {
  it("keeps rows without a remittance attempt as A pagar", () => {
    const monthlyRows = buildMonthlyPaymentRows({
      ordens: [
        {
          data: "2026-08-28T00:00:00.000Z",
          valorTotal: 0,
          statusRemessa: null,
          descricaoStatusRemessa: null,
          dataTentativaPagamento: "2026-08-28T00:00:00.000Z",
        },
      ],
    });

    expect(monthlyRows).toHaveLength(1);
    expect(monthlyRows[0].statusRemessa).toBeNull();
    expect(monthlyRows[0].paymentStatus).toBe("A pagar");
  });

  it("keeps a future-dated row with value and no remittance status as A pagar (#1164)", () => {
    const monthlyRows = buildMonthlyPaymentRows({
      ordens: [
        {
          data: "2999-08-28T00:00:00.000Z",
          valorTotal: 142.35,
          statusRemessa: null,
          descricaoStatusRemessa: null,
          motivoStatusRemessa: null,
          descricaoMotivoStatusRemessa: null,
          dataTentativaPagamento: "2999-08-28T00:00:00.000Z",
        },
      ],
    });

    expect(monthlyRows).toHaveLength(1);
    expect(monthlyRows[0].statusRemessa).toBeNull();
    expect(monthlyRows[0].paymentStatus).toBe("A pagar");
  });

  it("marks a past-dated row without remittance status as Pendência de Pagamento (#1164)", () => {
    const monthlyRows = buildMonthlyPaymentRows({
      ordens: [
        {
          data: "2000-10-02T00:00:00.000Z",
          valorTotal: 258.8,
          statusRemessa: null,
          descricaoStatusRemessa: null,
          motivoStatusRemessa: null,
          descricaoMotivoStatusRemessa: null,
          dataTentativaPagamento: "2000-10-02T00:00:00.000Z",
          dadosBancariosFaltando: true,
        },
      ],
    });

    expect(monthlyRows[0].paymentStatus).toBe("Pendência de Pagamento");
    expect(monthlyRows[0].dadosBancariosFaltando).toBe(true);
  });

  it("keeps a future-dated row without remittance status as A pagar (#1164)", () => {
    const monthlyRows = buildMonthlyPaymentRows({
      ordens: [
        {
          data: "2999-10-02T00:00:00.000Z",
          valorTotal: 258.8,
          statusRemessa: null,
          descricaoStatusRemessa: null,
          motivoStatusRemessa: null,
          descricaoMotivoStatusRemessa: null,
          dataTentativaPagamento: "2999-10-02T00:00:00.000Z",
        },
      ],
    });

    expect(monthlyRows[0].paymentStatus).toBe("A pagar");
  });

  it("treats NaoEfetivado as Rejeitado instead of Pago", () => {
    expect(getPaymentStatus(4, "NaoEfetivado")).toBe("Rejeitado");
  });

  it("distinguishes repeated grouped order rows, including identical records", () => {
    const order = {
      ordemPagamentoAgrupadoIds: "491928",
      data: "2026-08-18",
      dataEfetivaPagamento: "2026-09-03",
      valorTotal: 271.6,
      statusRemessa: 5,
    };
    const rows = buildMonthlyPaymentRows({ ordens: [order, order, order] });
    expect(new Set(rows.map(buildMonthlyPaymentRowKey)).size).toBe(3);
  });

  it("builds distinct row keys for same-date monthly rows", () => {
    const monthlyRows = buildMonthlyPaymentRows({
      ordens: [
        {
          ordemGuardadorId: 1,
          nomeGuardador: "TELMA CLOTILDE",
          ordemPagamentoAgrupadoIds: "491928",
          data: "2026-08-25T00:00:00.000Z",
          valorTotal: 1.4,
          statusRemessa: 4,
          descricaoStatusRemessa: "NaoEfetivado",
          dataTentativaPagamento: "2026-08-25T00:00:00.000Z",
        },
        {
          ordemGuardadorId: 2,
          nomeGuardador: "ANTERO GOMES COELHO NETO",
          ordemPagamentoAgrupadoIds: null,
          data: "2026-08-25T00:00:00.000Z",
          valorTotal: 0,
          statusRemessa: null,
          descricaoStatusRemessa: null,
          dataTentativaPagamento: "2026-08-25T00:00:00.000Z",
        },
      ],
    });

    expect(buildMonthlyPaymentRowKey(monthlyRows[0], 0)).not.toBe(
      buildMonthlyPaymentRowKey(monthlyRows[1], 1)
    );
  });
});

describe('Abatimento por duplicidade', () => {
  const indevido = buildPagamentoIndevido({
    totais: { quantidade: 1, devendo: 1, valorIndevido: '877.80', valorDebitado: '238.00', saldoDevedor: '639.80' },
    lancamentos: [{ data: '2026-10-16', valorDevido: '238.00', valorPago: '0.00', diferenca: '-238.00', statusRemessa: 3 }],
    datasDuplicidade: ['2026-09-03', '2026-09-09', '2026-09-23'],
  });
  const pagamento = (data, statusRemessa) => ({ paymentDate: data, dataTentativaPagamento: data, statusRemessa, totalPaymentValue: 238 });

  it('monta o motivo com o mês (MM/AAAA) da duplicidade, sem repetir o mês', () => {
    expect(buildDuplicateOffsetReason(['2026-09-03', '2026-09-09', '2026-09-23'])).toBe(
      'Abatimento referente a pagamento realizado em duplicidade no mês de 09/2026'
    );
    expect(buildDuplicateOffsetReason(['2026-08-12', '2026-09-03'])).toBe(
      'Abatimento referente a pagamento realizado em duplicidade nos meses de 08/2026 e 09/2026'
    );
    expect(buildDuplicateOffsetReason([])).toBe('Abatimento referente a pagamento realizado em duplicidade');
  });

  it('marca o pagamento pago do dia em que houve abatimento', () => {
    const marked = markDuplicateOffsetPayments([pagamento('2026-10-16', 3)], indevido);

    expect(marked[0].duplicateOffset).toEqual({
      status: 'Abatimento por duplicidade',
      reason: 'Abatimento referente a pagamento realizado em duplicidade no mês de 09/2026',
    });
  });

  it('não marca pagamento de outro dia nem o que não está pago', () => {
    const payments = [pagamento('2026-10-20', 3), pagamento('2026-10-16', 2), pagamento('2026-10-16', null), pagamento('2026-10-16', 4)];

    markDuplicateOffsetPayments(payments, indevido).forEach((p) => expect(p.duplicateOffset).toBeUndefined());
  });

  it('sem abatimento (ou sem indevido) devolve os pagamentos como vieram', () => {
    const payments = [pagamento('2026-10-16', 3)];

    expect(markDuplicateOffsetPayments(payments, null)).toBe(payments);
    expect(markDuplicateOffsetPayments(payments, { items: [{ date: '2026-10-16', difference: 0 }] })).toBe(payments);
  });
});
