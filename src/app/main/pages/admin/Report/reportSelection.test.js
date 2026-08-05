import {
  REPORT_AUDIENCE_OPTIONS,
  shouldShowAudienceSelector,
} from "./reportSelection";

describe("reportSelection", () => {
  it("hides the audience selector until a report is selected", () => {
    expect(shouldShowAudienceSelector("")).toBe(false);
    expect(shouldShowAudienceSelector(null)).toBe(false);
  });

  it("shows the audience selector only for the consolidated report", () => {
    expect(shouldShowAudienceSelector("consolidado")).toBe(true);
    expect(shouldShowAudienceSelector("Movimentação Financeira")).toBe(false);
    expect(shouldShowAudienceSelector("analitico")).toBe(false);
  });

  it("exposes Guardador as the audience label for the guardador report flow", () => {
    expect(REPORT_AUDIENCE_OPTIONS).toEqual(
      expect.arrayContaining([
        { value: "permissionario", label: "Permissionário" },
        { value: "guardador", label: "Guardador" },
      ])
    );
  });
});
