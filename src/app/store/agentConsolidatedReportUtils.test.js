import {
  buildAgentConsolidatedDisplayRows,
  AGENT_FINANCIAL_MOVEMENT_DATE_FORMAT,
  AGENT_FINANCIAL_MOVEMENT_DATE_SEPARATOR,
  AGENT_REPORT_ERROR_STATUS_VALUE,
  AGENT_REPORT_SELECT_ALL_VALUE,
  buildAgentAutocompleteOptions,
  buildAgentConsolidatedReportParams,
  buildAssociationAutocompleteOptions,
  flattenAgentConsolidatedReportBlocks,
  getAgentConsolidatedReportTotal,
  getAgentEffectivePaymentDateLabel,
  getAssociationDisplayName,
  isKnownAssociationName,
  normalizeAgentStatusSelection,
  normalizeAgentConsolidatedReportBlocks,
  shouldShowAgentEffectivePaymentDateColumn,
  getSelectedBothAssociationsNames,
  normalizeSelectAllAutocompleteValue,
  AGENT_ASSOCIATION_GUARDADORES_LABEL,
  AGENT_ASSOCIATION_OWN_PAYMENT_LABEL,
  buildAgentAssociationTotalLines,
  hasAgentAssociationFilter,
} from "./agentConsolidatedReportUtils";

describe("agentConsolidatedReportUtils", () => {
  const julyStartDate = new Date(2026, 6, 1);
  const julyEndDate = new Date(2026, 6, 31);

  it("uses the concise guardador financial movement date range format", () => {
    expect(AGENT_FINANCIAL_MOVEMENT_DATE_FORMAT).toBe("dd/MM/yy");
    expect(AGENT_FINANCIAL_MOVEMENT_DATE_SEPARATOR).toBe(" - ");
  });

  it("serializes agentes filters according to the consolidated contract", () => {
    const params = buildAgentConsolidatedReportParams({
      dateRange: [julyStartDate, julyEndDate],
      agentNames: [2, 5],
      associations: ["Associacao X", "Associacao Y"],
      status: ["Pago", "A pagar", "Em processamento"],
      valorMin: "1.234,56",
      valorMax: "9.876,54",
    });

    expect(params).toEqual({
      dataInicio: "2026-07-01",
      dataFim: "2026-07-31",
      userIds: "2,5",
      consorcioNome: "Associacao X,Associacao Y",
      valorMin: "1234.56",
      valorMax: "9876.54",
      pago: true,
      aPagar: true,
      emProcessamento: true,
    });
  });

  it("serializes the pendenciaPaga filter when Pendencia Paga status is selected", () => {
    const params = buildAgentConsolidatedReportParams({
      dateRange: [julyStartDate, julyEndDate],
      status: ["Pendencia Paga"],
    });

    expect(params).toEqual({
      dataInicio: "2026-07-01",
      dataFim: "2026-07-31",
      pendenciaPaga: true,
    });
  });

  it("serializes the abatimentoDuplicidade filter when Abatimento por duplicidade is selected", () => {
    const params = buildAgentConsolidatedReportParams({
      dateRange: [julyStartDate, julyEndDate],
      status: ["Abatimento por duplicidade"],
    });

    expect(params).toEqual({
      dataInicio: "2026-07-01",
      dataFim: "2026-07-31",
      abatimentoDuplicidade: true,
    });
  });

  it("combines Pago and Erros without a specific reason as pago, rejeitado and estorno", () => {
    const params = buildAgentConsolidatedReportParams({
      dateRange: [julyStartDate, julyEndDate],
      status: ["Pago", AGENT_REPORT_ERROR_STATUS_VALUE],
    });

    expect(params).toEqual({
      dataInicio: "2026-07-01",
      dataFim: "2026-07-31",
      pago: true,
      rejeitado: true,
      estorno: true,
    });
  });

  it("serializes the erros filter with the specific error reasons, without pago", () => {
    const params = buildAgentConsolidatedReportParams({
      dateRange: [julyStartDate, julyEndDate],
      status: [AGENT_REPORT_ERROR_STATUS_VALUE],
      erroStatus: ["Rejeitado", "Estorno"],
    });

    expect(params).toEqual({
      dataInicio: "2026-07-01",
      dataFim: "2026-07-31",
      rejeitado: true,
      estorno: true,
    });
  });

  it("serializes all error reasons as rejeitado and estorno when Todos is selected", () => {
    const params = buildAgentConsolidatedReportParams({
      dateRange: [julyStartDate, julyEndDate],
      status: [AGENT_REPORT_ERROR_STATUS_VALUE],
      erroStatus: [AGENT_REPORT_SELECT_ALL_VALUE],
    });

    expect(params).toEqual({
      dataInicio: "2026-07-01",
      dataFim: "2026-07-31",
      rejeitado: true,
      estorno: true,
    });
  });

  it("serializes Erros alone with no reason selected as both rejeitado and estorno", () => {
    const params = buildAgentConsolidatedReportParams({
      dateRange: [julyStartDate, julyEndDate],
      status: [AGENT_REPORT_ERROR_STATUS_VALUE],
    });

    expect(params).toEqual({
      dataInicio: "2026-07-01",
      dataFim: "2026-07-31",
      rejeitado: true,
      estorno: true,
    });
  });

  it("combines A pagar and Erros without a specific reason as aPagar, rejeitado and estorno", () => {
    const params = buildAgentConsolidatedReportParams({
      dateRange: [julyStartDate, julyEndDate],
      status: ["A pagar", AGENT_REPORT_ERROR_STATUS_VALUE],
    });

    expect(params).toEqual({
      dataInicio: "2026-07-01",
      dataFim: "2026-07-31",
      aPagar: true,
      rejeitado: true,
      estorno: true,
    });
  });

  it("sends todosGuardadores (no userIds) for Todos guardadores and preserves Todos for associacoes", () => {
    const params = buildAgentConsolidatedReportParams({
      dateRange: [julyStartDate, julyEndDate],
      agentNames: [AGENT_REPORT_SELECT_ALL_VALUE],
      associations: [AGENT_REPORT_SELECT_ALL_VALUE],
    });

    expect(params).toEqual({
      dataInicio: "2026-07-01",
      dataFim: "2026-07-31",
      todosGuardadores: true,
      consorcioNome: "Todos",
    });
  });

  it("normalizes grouped response blocks and preserves the todos total", () => {
    const normalizedBlocks = normalizeAgentConsolidatedReportBlocks([
      {
        count: 2,
        valor: 150.5,
        status: "todos",
        data: [
          { nome: "ASSOCIACAO X", valor: 100.25 },
          { nome: "JOAO SILVA", valor: 50.25 },
        ],
      },
      {
        count: 1,
        valor: 100.25,
        status: "pago",
        data: [{ nome: "ASSOCIACAO X", valor: 100.25 }],
      },
    ]);

    expect(normalizedBlocks).toEqual([
      {
        count: 2,
        rawStatus: "todos",
        statusLabel: "Todos",
        valor: 150.5,
        data: [
          { nome: "ASSOCIACAO X", valor: 100.25 },
          { nome: "JOAO SILVA", valor: 50.25 },
        ],
      },
      {
        count: 1,
        rawStatus: "pago",
        statusLabel: "Pago",
        valor: 100.25,
        data: [{ nome: "ASSOCIACAO X", valor: 100.25 }],
      },
    ]);

    expect(flattenAgentConsolidatedReportBlocks(normalizedBlocks)).toEqual([
      { status: "Todos", nome: "ASSOCIACAO X", valor: 100.25 },
      { status: "Todos", nome: "JOAO SILVA", valor: 50.25 },
      { status: "Pago", nome: "ASSOCIACAO X", valor: 100.25 },
    ]);

    expect(getAgentConsolidatedReportTotal(normalizedBlocks)).toBe(150.5);
  });

  it("builds the guardador options with the user id as value and unique association options", () => {
    const agentUsers = [
      {
        id: 5,
        fullName: "Maria da Silva",
        associacoes: [{ label: "Associacao X" }, { label: "Associacao Y" }],
      },
      {
        id: 2,
        fullName: "Joao Pereira",
        associacoes: [{ label: "Associacao X" }],
      },
      // same name, different user: both stay selectable because the value is the id
      { id: 9, fullName: "Joao Pereira", associacoes: [] },
      // no id: it could not be sent to the API
      { fullName: "Sem Id", associacoes: [] },
    ];

    expect(buildAgentAutocompleteOptions(agentUsers)).toEqual([
      { label: "Todos", value: "Todos" },
      { label: "Joao Pereira", value: 2 },
      { label: "Joao Pereira", value: 9 },
      { label: "Maria da Silva", value: 5 },
    ]);

    expect(buildAssociationAutocompleteOptions(agentUsers)).toEqual([
      { label: "Todos", value: "Todos" },
      { label: "Associacao X", value: "Associacao X" },
      { label: "Associacao Y", value: "Associacao Y" },
    ]);
  });

  describe("effective payment date", () => {
    it("shows the column whenever Pendência Paga is selected, including mixed filters", () => {
      expect(shouldShowAgentEffectivePaymentDateColumn(["Pendência Paga"])).toBe(true);
      expect(
        shouldShowAgentEffectivePaymentDateColumn([
          "Pendência de Pagamento",
          "Pendência Paga",
        ])
      ).toBe(true);
      expect(shouldShowAgentEffectivePaymentDateColumn(["Pendência de Pagamento"])).toBe(false);
      expect(shouldShowAgentEffectivePaymentDateColumn([])).toBe(false);
      expect(shouldShowAgentEffectivePaymentDateColumn()).toBe(false);
    });

    it("never shows the effective payment date of a Pago row", () => {
      expect(
        getAgentEffectivePaymentDateLabel({ status: "Pago", dataPagamento: "21/08/2026" })
      ).toBe("-");
    });

    it("shows the effective payment date of a Pendencia Paga row", () => {
      expect(
        getAgentEffectivePaymentDateLabel({ status: "Pendencia Paga", dataPagamento: "03/09/2026" })
      ).toBe("03/09/2026");
    });

    it("shows a dash when a Pendencia Paga row has no payment date or for any other status", () => {
      expect(getAgentEffectivePaymentDateLabel({ status: "Pendencia Paga" })).toBe("-");
      expect(
        getAgentEffectivePaymentDateLabel({ status: "A Pagar", dataPagamento: "21/08/2026" })
      ).toBe("-");
      expect(getAgentEffectivePaymentDateLabel(undefined)).toBe("-");
    });
  });

  describe("association display", () => {
    const singaerj =
      "SINDICATO DOS GUARDADORES DE AUTOMOVEIS NO ESTADO DO RIO DE JANEIRO E REGIAO - SINGAERJ";
    const anglae =
      "ASSOCIACAO NACIONAL DOS GUARDADORES E LAVADORES DE AUTOMOVEIS CONGENERES E AFINS";

    it("shortens SINGAERJ and ANGLAE and keeps any other name untouched", () => {
      expect(getAssociationDisplayName(singaerj)).toBe("SINGAERJ");
      expect(getAssociationDisplayName(anglae)).toBe("ANGLAE");
      expect(
        getAssociationDisplayName("Associação Nacional dos Guardadores e Lavadores de Automóveis Congêneres e Afins")
      ).toBe("ANGLAE");
      expect(getAssociationDisplayName("Associacao X")).toBe("Associacao X");
      expect(getAssociationDisplayName(undefined)).toBeUndefined();
    });

    it("shortens each association when a guardador belongs to more than one", () => {
      expect(getAssociationDisplayName(`${anglae} / ${singaerj}`)).toBe("ANGLAE / SINGAERJ");
      expect(getAssociationDisplayName(`${singaerj} / ${anglae}`)).toBe("SINGAERJ / ANGLAE");
      expect(getAssociationDisplayName(`Associacao X / ${singaerj}`)).toBe("Associacao X / SINGAERJ");
    });

    it("recognizes a row's own name as one of the two known associations", () => {
      expect(isKnownAssociationName(singaerj)).toBe(true);
      expect(isKnownAssociationName(anglae)).toBe(true);
      expect(isKnownAssociationName("JOAO DA SILVA")).toBe(false);
      expect(isKnownAssociationName(undefined)).toBe(false);
    });

    it("shows the short label in the association options but keeps the full name as value", () => {
      const options = buildAssociationAutocompleteOptions([
        { fullName: "Maria", associacoes: [{ label: singaerj }, { label: anglae }] },
      ]);

      expect(options).toEqual([
        { label: "Todos", value: "Todos" },
        { label: "ANGLAE/SINGAERJ (ambas)", value: `AMBAS::${anglae} / ${singaerj}` },
        { label: "ANGLAE", value: anglae },
        { label: "SINGAERJ", value: singaerj },
      ]);
    });

    describe("ANGLAE/SINGAERJ (ambas)", () => {
      const bothValue = `AMBAS::${anglae} / ${singaerj}`;

      it("is offered only when both associations exist", () => {
        const options = buildAssociationAutocompleteOptions([
          { fullName: "Maria", associacoes: [{ label: singaerj }] },
        ]);

        expect(options.map((option) => option.label)).toEqual(["Todos", "SINGAERJ"]);
      });

      it("sends both names with exigirTodasAssociacoes in the consolidated report", () => {
        const params = buildAgentConsolidatedReportParams({ associations: [bothValue] });

        expect(params.consorcioNome).toBe(`${anglae},${singaerj}`);
        expect(params.exigirTodasAssociacoes).toBe(true);
        expect(getSelectedBothAssociationsNames([{ value: bothValue }])).toEqual([anglae, singaerj]);
      });

      it("combines with ANGLAE or SINGAERJ; only Todos replaces the selection", () => {
        const both = { label: "ANGLAE/SINGAERJ (ambas)", value: bothValue };
        const single = { label: "SINGAERJ", value: singaerj };

        expect(normalizeSelectAllAutocompleteValue([single, both])).toEqual([single, both]);
        expect(normalizeSelectAllAutocompleteValue([both, single])).toEqual([both, single]);
        expect(
          normalizeSelectAllAutocompleteValue([both, { label: "Todos", value: "Todos" }])
        ).toEqual([{ label: "Todos", value: "Todos" }]);
      });

      it("combined with a single association sends only the single names, without exigirTodasAssociacoes", () => {
        const comAnglae = buildAgentConsolidatedReportParams({
          associations: [bothValue, anglae],
        });
        expect(comAnglae.consorcioNome).toBe(anglae);
        expect(comAnglae.exigirTodasAssociacoes).toBeUndefined();

        const comSingaerj = buildAgentConsolidatedReportParams({ associations: [singaerj, bothValue] });
        expect(comSingaerj.consorcioNome).toBe(singaerj);
        expect(comSingaerj.exigirTodasAssociacoes).toBeUndefined();

        expect(getSelectedBothAssociationsNames([bothValue, anglae])).toBeNull();
      });
    });
  });

  it("keeps every status selected, including Erros combined with others", () => {
    expect(
      normalizeAgentStatusSelection([
        { label: "Pago", value: "Pago" },
        { label: "Erros", value: "Erros" },
        { label: "Em processamento", value: "Em processamento" },
        { label: "A pagar", value: "A pagar" },
      ])
    ).toEqual([
      { label: "Pago", value: "Pago" },
      { label: "Erros", value: "Erros" },
      { label: "Em processamento", value: "Em processamento" },
      { label: "A pagar", value: "A pagar" },
    ]);
  });
});

describe("association total lines", () => {
  const ANGLAE = "ASSOCIACAO NACIONAL DOS GUARDADORES E LAVADORES DE AUTOMOVEIS CONGENERES E AFINS";
  const SINGAERJ = "SINDICATO DOS GUARDADORES DE AUTOMOVEIS NO ESTADO DO RIO DE JANEIRO E REGIAO - SINGAERJ";
  const totals = [
    { nome: ANGLAE, valorAssociacao: 100, valorGuardadores: 1000 },
    { nome: SINGAERJ, valorAssociacao: 200, valorGuardadores: 2000 },
  ];

  it("needs an association filter", () => {
    expect(hasAgentAssociationFilter({ consorcioNome: ANGLAE })).toBe(true);
    expect(hasAgentAssociationFilter({ todosConsorcios: true })).toBe(true);
    expect(hasAgentAssociationFilter({ todosGuardadores: true })).toBe(false);
    expect(hasAgentAssociationFilter()).toBe(false);
  });

  it("only the association selected: the association's own payment, with the short name", () => {
    expect(buildAgentAssociationTotalLines([totals[0]], { consorcioNome: ANGLAE })).toEqual([
      { nome: "ANGLAE", label: AGENT_ASSOCIATION_OWN_PAYMENT_LABEL, valor: 100 },
    ]);
  });

  it("Todos os guardadores + association: the guardadores linked to it", () => {
    expect(buildAgentAssociationTotalLines([totals[1]], { consorcioNome: SINGAERJ, todosGuardadores: true })).toEqual([
      { nome: "SINGAERJ", label: AGENT_ASSOCIATION_GUARDADORES_LABEL, valor: 2000 },
    ]);
  });

  it("Todos os guardadores + Todas as associações: one line per association", () => {
    expect(buildAgentAssociationTotalLines(totals, { todosConsorcios: true, todosGuardadores: true })).toEqual([
      { nome: "ANGLAE", label: AGENT_ASSOCIATION_GUARDADORES_LABEL, valor: 1000 },
      { nome: "SINGAERJ", label: AGENT_ASSOCIATION_GUARDADORES_LABEL, valor: 2000 },
    ]);
  });

  it("specific guardadores or ANGLAE/SINGAERJ (ambas) use the guardadores value", () => {
    expect(buildAgentAssociationTotalLines([totals[0]], { consorcioNome: ANGLAE, userIds: "7" })[0].valor).toBe(1000);
    expect(
      buildAgentAssociationTotalLines(totals, { consorcioNome: `${ANGLAE},${SINGAERJ}`, exigirTodasAssociacoes: true }).map((l) => l.valor)
    ).toEqual([1000, 2000]);
  });

  it("is empty without totals", () => {
    expect(buildAgentAssociationTotalLines(undefined, { consorcioNome: ANGLAE })).toEqual([]);
    expect(buildAgentAssociationTotalLines([], { consorcioNome: ANGLAE })).toEqual([]);
  });
});

describe("buildAgentConsolidatedDisplayRows", () => {
  const pago = {
    rawStatus: "pago",
    statusLabel: "Pago",
    data: [
      { nome: "ALEXANDRE JOSÉ PINHEIRO", valor: 2685.2 },
      { nome: "ADEMAIR BASILIO", valor: 3962 },
    ],
  };
  const abatimento = {
    rawStatus: "abatimentoDuplicidade",
    statusLabel: "Abatimento por duplicidade",
    data: [{ nome: "ALEXANDRE JOSÉ PINHEIRO", valor: 137.2 }],
  };

  it("keeps one row per status, so a name in Pago and Abatimento shows twice with its status", () => {
    expect(buildAgentConsolidatedDisplayRows([pago, abatimento])).toEqual([
      { nome: "ADEMAIR BASILIO", status: "Pago", valor: 3962 },
      { nome: "ALEXANDRE JOSÉ PINHEIRO", status: "Pago", valor: 2685.2 },
      { nome: "ALEXANDRE JOSÉ PINHEIRO", status: "Abatimento por duplicidade", valor: 137.2 },
    ]);
  });

  it("the same name follows the order of the status blocks", () => {
    const rows = buildAgentConsolidatedDisplayRows([abatimento, pago]);
    expect(rows.filter((row) => row.nome === "ALEXANDRE JOSÉ PINHEIRO").map((row) => row.status)).toEqual([
      "Abatimento por duplicidade",
      "Pago",
    ]);
  });

  it("the 'todos' block has no status", () => {
    const todos = { rawStatus: "todos", statusLabel: "Todos", data: [{ nome: "B", valor: 2 }, { nome: "A", valor: 1 }] };
    expect(buildAgentConsolidatedDisplayRows([todos, pago])).toEqual([
      { nome: "A", status: null, valor: 1 },
      { nome: "B", status: null, valor: 2 },
    ]);
  });

  it("is empty without blocks", () => {
    expect(buildAgentConsolidatedDisplayRows()).toEqual([]);
  });
});
