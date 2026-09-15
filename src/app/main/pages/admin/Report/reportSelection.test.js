import {
  REPORT_AUDIENCE_OPTIONS,
  shouldShowAudienceSelector,
} from "./reportSelection";

describe("reportSelection", () => {
  it("defines permissionario and guardador as audience options", () => {
    expect(REPORT_AUDIENCE_OPTIONS).toEqual([
      { value: "permissionario", label: "Permissionário" },
      { value: "guardador", label: "Guardador" },
    ]);
  });

  it("shows audience selector for consolidado", () => {
    expect(shouldShowAudienceSelector("consolidado")).toBe(true);
  });

  it("shows audience selector for Movimentação Financeira", () => {
    expect(shouldShowAudienceSelector("Movimentação Financeira")).toBe(true);
  });

  it("does not show audience selector for analitico, sintetico or empty string", () => {
    expect(shouldShowAudienceSelector("analitico")).toBe(false);
    expect(shouldShowAudienceSelector("sintetico")).toBe(false);
    expect(shouldShowAudienceSelector("")).toBe(false);
  });
});

