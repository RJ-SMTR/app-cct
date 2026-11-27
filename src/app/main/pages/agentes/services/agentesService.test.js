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
  buildDifferenceExplanation,
  buildMonthlyPaymentRowKey,
  buildMonthlyPaymentRows,
  withPaidAndOffsetAmounts,
  buildPagamentoIndevido,
  getPaymentStatus,
  markDuplicateOffsetPayments,
  shouldShowIndevidoColumns,
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
        differenceNote: "Descontamos R$ 40,00 do que foi pago a mais antes.",
        differenceDetail: "Dia pago a mais: 13/10.",
        status: "Pago",
      },
    ]);
  });

  it("explica o desconto em linguagem simples, com os dias pagos a mais", () => {
    const explanation = buildDifferenceExplanation(-100, 167.4, ["2026-09-03", "2026-09-09", "2026-09-23"]);

    expect(explanation.note.replace(/ /g, " ")).toBe("Descontamos R$ 100,00 do que foi pago a mais antes.");
    expect(explanation.detail).toBe("Dias pagos a mais: 03/09, 09/09 e 23/09.");
    expect(buildDifferenceExplanation(-100, 167.4, ["2026-09-23"]).detail).toBe("Dia pago a mais: 23/09.");
  });

  it("quando nada foi pago no dia, avisa isso antes do desconto", () => {
    const { note } = buildDifferenceExplanation(-238, 0, []);

    expect(note.replace(/ /g, " ")).toBe("Não pagamos nada neste dia. Descontamos R$ 238,00 do que foi pago a mais antes.");
  });

  it("sem as datas da duplicidade não escreve a segunda linha; sem desconto não escreve nada", () => {
    expect(buildDifferenceExplanation(-40, 120, []).detail).toBe("");
    expect(buildDifferenceExplanation(0, 10, ["2026-09-23"])).toEqual({ note: "", detail: "" });
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

  it("quitado: guarda o mês do último abatimento para o quadro aparecer só nele", () => {
    const result = buildPagamentoIndevido({
      totais: { valorIndevido: "130.20", valorDebitado: "130.20", saldoDevedor: "0.00" },
      lancamentos: [
        { data: "2026-10-30", valorDevido: "86.80", valorPago: "0.00", diferenca: "-86.80", statusRemessa: 3 },
        { data: "2026-09-16", valorDevido: "65.80", valorPago: "0.00", diferenca: "-65.80", statusRemessa: 3 },
      ],
    });
    expect(result.hasBalance).toBe(false);
    expect(result.settledMonth).toBe("2026-10");
  });

  it("com saldo devedor não há mês de quitação", () => {
    expect(
      buildPagamentoIndevido({
        totais: { saldoDevedor: "64.40" },
        lancamentos: [{ data: "2026-10-16", valorDevido: "65.80", valorPago: "0.00", diferenca: "-65.80", statusRemessa: 3 }],
      }).settledMonth
    ).toBeNull();
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

  it('monta o motivo com o mês (MM/AAAA) do pagamento em duplicidade, sem repetir o mês', () => {
    expect(buildDuplicateOffsetReason(['2026-09-03', '2026-09-09', '2026-09-23'])).toBe('Valor pago em duplicidade em 09/2026');
    expect(buildDuplicateOffsetReason(['2026-08-12', '2026-09-03'])).toBe('Valor pago em duplicidade em 08/2026 e 09/2026');
    expect(buildDuplicateOffsetReason([])).toBe('Valor pago em duplicidade');
  });

  it('marca o pagamento pago do dia em que houve abatimento', () => {
    const marked = markDuplicateOffsetPayments([pagamento('2026-10-16', 3)], indevido);

    expect(marked[0].duplicateOffset).toEqual({
      status: 'Abatimento por duplicidade',
      reason: 'Valor pago em duplicidade em 09/2026',
    });
  });

  it('o motivo da visão mensal segue "Valor pago em duplicidade em MM/AAAA" em todos os dias', () => {
    const dois = buildPagamentoIndevido({
      totais: { quantidade: 1, devendo: 1, valorIndevido: '500.00', valorDebitado: '200.00', saldoDevedor: '300.00' },
      lancamentos: [
        { data: '2026-11-10', valorDevido: '201.60', valorPago: '101.60', diferenca: '-100.00', statusRemessa: 3 },
        { data: '2026-11-06', valorDevido: '267.40', valorPago: '167.40', diferenca: '-100.00', statusRemessa: 3 },
      ],
      datasDuplicidade: ['2026-09-23'],
    });
    const marked = markDuplicateOffsetPayments([pagamento('2026-11-10', 3), pagamento('2026-11-06', 3)], dois);

    expect(marked[0].duplicateOffset.reason).toBe('Valor pago em duplicidade em 09/2026');
    expect(marked[1].duplicateOffset.reason).toBe(marked[0].duplicateOffset.reason);
  });

  it('o descritivo lista as datas das ordens duplicadas (e não as datas dos pagamentos repetidos)', () => {
    const quadro = buildPagamentoIndevido({
      totais: { saldoDevedor: '100.00' },
      lancamentos: [{ data: '2026-11-03', valorDevido: '158.20', valorPago: '58.20', diferenca: '-100.00', statusRemessa: 3 }],
      datasDuplicidade: ['2026-09-09', '2026-09-23'],
      duplicidades: [
        { dataOrdem: '2026-09-08', valor: '50.00', pagoEm: '2026-09-08', repetidoEm: ['2026-09-09'] },
        { dataOrdem: '2026-09-22', valor: '50.00', pagoEm: '2026-09-22', repetidoEm: ['2026-09-23'] },
      ],
    });

    expect(quadro.items[0].differenceDetail).toBe('Dias pagos a mais: 08/09 e 22/09.');
  });

  it('marca o dia não efetivado cujo valor enviado ao banco foi zerado pelo abatimento', () => {
    const zerado = buildPagamentoIndevido({
      totais: { quantidade: 1, devendo: 0, valorIndevido: '130.20', valorDebitado: '130.20', saldoDevedor: '0.00' },
      lancamentos: [{ data: '2026-10-30', valorDevido: '86.80', valorPago: '0.00', diferenca: '-86.80', statusRemessa: 4 }],
      datasDuplicidade: ['2026-09-03'],
    });
    const marked = markDuplicateOffsetPayments([pagamento('2026-10-30', 4), pagamento('2026-10-29', 4)], zerado);

    expect(marked[0].duplicateOffset.status).toBe('Abatimento por duplicidade');
    expect(marked[1].duplicateOffset).toBeUndefined();
  });

  it('no quadro, lançamento zerado pelo abatimento aparece como Pago e não como Rejeitado', () => {
    const itens = buildPagamentoIndevido({
      totais: { saldoDevedor: '58.20' },
      lancamentos: [
        { data: '2026-10-30', valorDevido: '68.60', valorPago: '0.00', diferenca: '-68.60', statusRemessa: 4 },
        { data: '2026-10-29', valorDevido: '68.60', valorPago: '10.00', diferenca: '-58.60', statusRemessa: 4 },
      ],
    }).items;

    expect(itens[0].status).toBe('Pago');
    expect(itens[1].status).toBe('Rejeitado');
  });

  it('não efetivado com abatimento parcial (valor enviado maior que zero) continua como veio', () => {
    const parcial = buildPagamentoIndevido({
      totais: { quantidade: 1, devendo: 1, valorIndevido: '130.20', valorDebitado: '40.00', saldoDevedor: '90.20' },
      lancamentos: [{ data: '2026-10-30', valorDevido: '86.80', valorPago: '46.80', diferenca: '-40.00', statusRemessa: 4 }],
    });

    expect(markDuplicateOffsetPayments([pagamento('2026-10-30', 4)], parcial)[0].duplicateOffset).toBeUndefined();
  });

  it('não marca pagamento de outro dia nem o que não está pago', () => {
    const payments = [pagamento('2026-10-20', 3), pagamento('2026-10-16', 2), pagamento('2026-10-16', null), pagamento('2026-10-16', 1)];

    markDuplicateOffsetPayments(payments, indevido).forEach((p) => expect(p.duplicateOffset).toBeUndefined());
  });

  it('ordem exibida em outro dia (feriado) acha o abatimento pela data original', () => {
    const rows = buildMonthlyPaymentRows({
      ordens: [
        {
          data: '2026-11-20T00:00:00.000Z',
          dataTentativaPagamento: '2026-11-20T00:00:00.000Z',
          dataEfetivaPagamento: '2026-11-23T00:00:00.000Z',
          dataRemanejada: '2026-11-23',
          statusRemessa: 3,
          valorTotal: 105,
        },
      ],
    });
    const abatimento = buildPagamentoIndevido({
      totais: { quantidade: 1, devendo: 1, valorIndevido: '200.00', valorDebitado: '100.00', saldoDevedor: '100.00' },
      lancamentos: [{ data: '2026-11-23', valorDevido: '105.00', valorPago: '5.00', diferenca: '-100.00', statusRemessa: 3 }],
    });

    const [linha] = markDuplicateOffsetPayments(rows, abatimento);

    expect(linha.paymentDate).toBe('2026-11-20');
    expect(linha.dataEfetivaPagamento).toBe('2026-11-23');
    expect(linha.dataRemanejada).toBe('2026-11-23');
    expect(linha.duplicateOffset).toBeDefined();
  });

  it('sem abatimento (ou sem indevido) devolve os pagamentos como vieram', () => {
    const payments = [pagamento('2026-10-16', 3)];

    expect(markDuplicateOffsetPayments(payments, null)).toBe(payments);
    expect(markDuplicateOffsetPayments(payments, { items: [{ date: '2026-10-16', difference: 0 }] })).toBe(payments);
  });
});

describe('Valor pago e abatimento na visão mensal', () => {
  const linha = (dia, status, valor, extra = {}) => ({
    paymentDate: dia,
    dataTentativaPagamento: dia,
    dataEfetivaPagamento: dia,
    statusRemessa: status,
    totalPaymentValue: valor,
    ...extra,
  });
  const indevido = (lancamentos) =>
    buildPagamentoIndevido({
      totais: { quantidade: 1, devendo: 1, valorIndevido: '200.00', valorDebitado: '100.00', saldoDevedor: '100.00' },
      lancamentos,
    });
  const lancamento = (data, devido, pago, status) => ({
    data,
    valorDevido: String(devido),
    valorPago: String(pago),
    diferenca: String(pago - devido),
    statusRemessa: status,
  });
  const valores = ({ paidAmount, offsetAmount, awaitingBank }) => [paidAmount, offsetAmount, awaitingBank];

  it('mostra o pago e o abatido, achando a ordem exibida em outro dia pela data original', () => {
    const [r] = withPaidAndOffsetAmounts(
      [linha('2026-11-20', 3, 105, { dataRemanejada: '2026-11-23' })],
      indevido([lancamento('2026-11-23', 105, 5, 3)])
    );

    expect(valores(r)).toEqual([5, 100, false]);
  });

  it('aguardando o banco: mostra o valor enviado, sinalizado', () => {
    const [r] = withPaidAndOffsetAmounts([linha('2026-11-17', 2, 112)], indevido([lancamento('2026-11-17', 112, 12, 2)]));

    expect(valores(r)).toEqual([12, 100, true]);
  });

  it('sem abatimento: pago mostra o valor cheio; não pago ou rejeitado não mostra', () => {
    const rows = withPaidAndOffsetAmounts(
      [linha('2026-11-17', 3, 112), linha('2026-11-13', null, 0), linha('2026-11-10', 4, 50)],
      indevido([lancamento('2026-11-10', 50, 10, 4)])
    );

    expect(rows.map(valores)).toEqual([
      [112, null, false],
      [null, null, false],
      [null, null, false],
    ]);
  });

  it('abatimento total (valor enviado zerado): pago zero', () => {
    const [r] = withPaidAndOffsetAmounts(
      [linha('2026-10-30', 4, 86.8, { duplicateOffset: {} })],
      indevido([lancamento('2026-10-30', 86.8, 0, 4)])
    );

    expect(r.paidAmount).toBe(0);
    expect(r.offsetAmount).toBeCloseTo(86.8);
  });

  it('duas ordens na mesma data não repetem os valores do pagamento', () => {
    const rows = withPaidAndOffsetAmounts(
      [linha('2026-11-17', 3, 60), linha('2026-11-17', 3, 52)],
      indevido([lancamento('2026-11-17', 112, 12, 3)])
    );

    expect(rows.map(valores)).toEqual([
      [12, 100, false],
      [null, null, false],
    ]);
  });
});

describe("shouldShowIndevidoColumns", () => {
  it("mostra Abatimento Indevido e Valor Pago só para quem ainda deve pagamento indevido", () => {
    expect(shouldShowIndevidoColumns({ hasBalance: true, items: [] })).toBe(true);
  });

  it("esconde as colunas para quem não deve, inclusive no mês em que quitou", () => {
    expect(shouldShowIndevidoColumns({ hasBalance: false, items: [] })).toBe(false);
    expect(shouldShowIndevidoColumns({ hasBalance: false, settledMonth: "2026-11", items: [{ id: 1 }] })).toBe(false);
  });

  it("esconde as colunas enquanto o indevido não carregou ou falhou", () => {
    expect(shouldShowIndevidoColumns(null)).toBe(false);
    expect(shouldShowIndevidoColumns(undefined)).toBe(false);
  });
});
