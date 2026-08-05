import {
  getInitialAgentesMonthDate,
  MIN_AGENTES_SELECTABLE_MONTH,
  MIN_AGENTES_SELECTABLE_MONTH_DATE,
  buildMonthDate,
  clampAgentesMonthDate,
  getSelectableAgentesMonths,
  getLatestAllowedAgentesMonth,
  resolveAgentesSelectedMonth,
} from "./agentesMonthSelection";

describe("agentesMonthSelection", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("clamps months before julho de 2026 to julho de 2026", () => {
    expect(clampAgentesMonthDate(buildMonthDate("2026-06"))).toEqual(
      MIN_AGENTES_SELECTABLE_MONTH_DATE
    );
  });

  it("keeps months from julho de 2026 onward", () => {
    expect(clampAgentesMonthDate(buildMonthDate("2026-07"))).toEqual(
      buildMonthDate("2026-07")
    );
    expect(clampAgentesMonthDate(buildMonthDate("2026-08"))).toEqual(
      buildMonthDate("2026-08")
    );
  });

  it("finds the latest available month that is still allowed", () => {
    expect(
      getLatestAllowedAgentesMonth(["2026-05", "2026-06", "2026-08"])
    ).toBe("2026-08");
  });

  it("returns null when all available months are before the minimum", () => {
    expect(getLatestAllowedAgentesMonth(["2026-05", "2026-06"])).toBeNull();
  });

  it("keeps selectable months unique and sorted from latest to earliest", () => {
    expect(
      getSelectableAgentesMonths([
        "2026-08",
        "2026-06",
        "2026-08",
        "2026-07",
      ])
    ).toEqual(["2026-08", "2026-07"]);
  });

  it("keeps the current month when it is still available", () => {
    expect(
      resolveAgentesSelectedMonth("2026-08", ["2026-09", "2026-08"])
    ).toBe("2026-08");
  });

  it("falls back to the latest available month when the current one is invalid", () => {
    expect(
      resolveAgentesSelectedMonth("2026-09", ["2026-08", "2026-07"])
    ).toBe("2026-08");
  });

  it("exposes julho de 2026 as the minimum selectable month", () => {
    expect(MIN_AGENTES_SELECTABLE_MONTH).toBe("2026-07");
  });

  it("uses the current month as the initial agentes dashboard month", () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-08-03T12:00:00"));

    expect(getInitialAgentesMonthDate()).toEqual(buildMonthDate("2026-08"));
  });
});
