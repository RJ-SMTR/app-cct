import {
  MIN_VANZEIROS_SELECTABLE_MONTH,
  MIN_VANZEIROS_SELECTABLE_MONTH_DATE,
  buildMonthDate,
  clampVanzeirosMonthDate,
} from "./vanzeirosMonthSelection";

describe("vanzeirosMonthSelection", () => {
  it("clamps months before abril de 2024 to abril de 2024", () => {
    expect(clampVanzeirosMonthDate(buildMonthDate("2024-03"))).toEqual(
      MIN_VANZEIROS_SELECTABLE_MONTH_DATE
    );
  });

  it("keeps months from abril de 2024 onward", () => {
    expect(clampVanzeirosMonthDate(buildMonthDate("2024-04"))).toEqual(
      buildMonthDate("2024-04")
    );
    expect(clampVanzeirosMonthDate(buildMonthDate("2024-05"))).toEqual(
      buildMonthDate("2024-05")
    );
  });

  it("exposes abril de 2024 as the minimum selectable month", () => {
    expect(MIN_VANZEIROS_SELECTABLE_MONTH).toBe("2024-04");
  });
});
