import {
  AGENT_REPORT_ERROR_STATUS_VALUE,
  AGENT_REPORT_SELECT_ALL_VALUE,
  buildAgentAutocompleteOptions,
  buildAgentConsolidatedReportParams,
  buildAssociationAutocompleteOptions,
  flattenAgentConsolidatedReportBlocks,
  getAgentConsolidatedReportTotal,
  normalizeAgentStatusSelection,
  normalizeAgentConsolidatedReportBlocks,
} from "./agentConsolidatedReportUtils";

describe("agentConsolidatedReportUtils", () => {
  const julyStartDate = new Date(2026, 6, 1);
  const julyEndDate = new Date(2026, 6, 31);

  it("serializes agentes filters according to the consolidated contract", () => {
    const params = buildAgentConsolidatedReportParams({
      dateRange: [julyStartDate, julyEndDate],
      agentNames: ["Maria", "Joao"],
      associations: ["Associacao X", "Associacao Y"],
      status: ["Pago", "A pagar", "Em processamento"],
      valorMin: "1.234,56",
      valorMax: "9.876,54",
    });

    expect(params).toEqual({
      dataInicio: "2026-07-01",
      dataFim: "2026-07-31",
      favorecidoNome: "Maria,Joao",
      consorcioNome: "Associacao X,Associacao Y",
      valorMin: "1234.56",
      valorMax: "9876.54",
      pago: true,
      aPagar: true,
      emProcessamento: true,
    });
  });

  it("serializes the erros filter using pago=false and keeps error detail flags", () => {
    const params = buildAgentConsolidatedReportParams({
      dateRange: [julyStartDate, julyEndDate],
      status: [AGENT_REPORT_ERROR_STATUS_VALUE],
      erroStatus: ["Rejeitado", "Estorno"],
    });

    expect(params).toEqual({
      dataInicio: "2026-07-01",
      dataFim: "2026-07-31",
      pago: false,
      rejeitado: true,
      estorno: true,
    });
  });

  it("serializes all error reasons with only pago=false when Todos is selected", () => {
    const params = buildAgentConsolidatedReportParams({
      dateRange: [julyStartDate, julyEndDate],
      status: [AGENT_REPORT_ERROR_STATUS_VALUE],
      erroStatus: [AGENT_REPORT_SELECT_ALL_VALUE],
    });

    expect(params).toEqual({
      dataInicio: "2026-07-01",
      dataFim: "2026-07-31",
      pago: false,
    });
  });

  it("preserves the special Todos value for nomes and associacoes", () => {
    const params = buildAgentConsolidatedReportParams({
      dateRange: [julyStartDate, julyEndDate],
      agentNames: [AGENT_REPORT_SELECT_ALL_VALUE],
      associations: [AGENT_REPORT_SELECT_ALL_VALUE],
    });

    expect(params).toEqual({
      dataInicio: "2026-07-01",
      dataFim: "2026-07-31",
      favorecidoNome: "Todos",
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

  it("builds unique autocomplete options from agentes data", () => {
    const agentUsers = [
      {
        fullName: "Maria da Silva",
        associacoes: [{ label: "Associacao X" }, { label: "Associacao Y" }],
      },
      {
        fullName: "Joao Pereira",
        associacoes: [{ label: "Associacao X" }],
      },
    ];

    expect(buildAgentAutocompleteOptions(agentUsers)).toEqual([
      { label: "Todos", value: "Todos" },
      { label: "Joao Pereira", value: "Joao Pereira" },
      { label: "Maria da Silva", value: "Maria da Silva" },
    ]);

    expect(buildAssociationAutocompleteOptions(agentUsers)).toEqual([
      { label: "Todos", value: "Todos" },
      { label: "Associacao X", value: "Associacao X" },
      { label: "Associacao Y", value: "Associacao Y" },
    ]);
  });

  it("keeps the erros selection exclusive with paid-status options", () => {
    expect(
      normalizeAgentStatusSelection([
        { label: "Pago", value: "Pago" },
        { label: "Erros", value: "Erros" },
        { label: "Em processamento", value: "Em processamento" },
        { label: "A pagar", value: "A pagar" },
      ])
    ).toEqual([
      { label: "Erros", value: "Erros" },
    ]);
  });
});
