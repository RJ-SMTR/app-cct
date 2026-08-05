import {
  buildAgentConsolidatedReportParams,
  normalizeAgentStatusSelection,
  shouldShowAgentNameFilter,
  shouldShowAssociationFilter,
} from "./agentConsolidatedReportUtils";

describe("agentConsolidatedReportUtils", () => {
  it('keeps "Erros" alongside other selected statuses', () => {
    const selectedOptions = normalizeAgentStatusSelection([
      { label: "Erros", value: "Erros" },
      { label: "Pago", value: "Pago" },
      { label: "A pagar", value: "A pagar" },
    ]);

    expect(selectedOptions.map((option) => option.value)).toEqual([
      "Erros",
      "Pago",
      "A pagar",
    ]);
  });

  it("hides the association filter when a guardador filter is already selected", () => {
    expect(shouldShowAssociationFilter([])).toBe(true);
    expect(
      shouldShowAssociationFilter([{ label: "Maria da Silva", value: "Maria da Silva" }])
    ).toBe(false);
  });

  it("hides the guardador filter when an association filter is already selected", () => {
    expect(shouldShowAgentNameFilter([])).toBe(true);
    expect(
      shouldShowAgentNameFilter([{ label: "Internorte", value: "Internorte" }])
    ).toBe(false);
  });

  it("builds combined params when errors are selected with other statuses", () => {
    const params = buildAgentConsolidatedReportParams({
      dateRange: [new Date("2026-07-01T12:00:00"), new Date("2026-07-31T12:00:00")],
      status: ["Erros", "Pago", "A pagar", "Em processamento"],
      erroStatus: ["Rejeitado", "Estorno"],
    });

    expect(params).toMatchObject({
      dataInicio: "2026-07-01",
      dataFim: "2026-07-31",
      pago: true,
      aPagar: true,
      emProcessamento: true,
      rejeitado: true,
      estorno: true,
    });
  });

  it('treats "Todos" in error reasons as all specific error reasons', () => {
    const params = buildAgentConsolidatedReportParams({
      dateRange: [new Date("2026-07-01T12:00:00"), new Date("2026-07-31T12:00:00")],
      status: ["Erros"],
      erroStatus: ["Todos"],
    });

    expect(params).toMatchObject({
      rejeitado: true,
      estorno: true,
    });
    expect(params.pago).toBeUndefined();
  });
});
