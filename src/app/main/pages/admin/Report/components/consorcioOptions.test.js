import {
  buildReleaseConsorcioFilters,
  buildReportConsorcioOptions,
} from "./consorcioOptions";

describe("consorcioOptions", () => {
  it("includes TUSE in the shared report consortium options", () => {
    const options = buildReportConsorcioOptions();

    expect(options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "TUSE", value: "TUSE" }),
      ]),
    );
  });

  it("keeps restricted consortiums disabled only when favorecido selection is active", () => {
    const optionsWithNameSelected = buildReportConsorcioOptions({
      selectedField: "name",
    });
    const unrestrictedOptions = buildReportConsorcioOptions();

    expect(
      optionsWithNameSelected.find((option) => option.value === "STPC"),
    ).toEqual(expect.objectContaining({ disabled: true }));
    expect(
      unrestrictedOptions.find((option) => option.value === "STPC"),
    ).toEqual(expect.objectContaining({ disabled: false }));
  });

  it("includes a TUSE release filter that matches rows from that consortium", () => {
    const filters = buildReleaseConsorcioFilters();
    const tuseFilter = filters.find((filter) => filter.label === "TUSE");

    expect(tuseFilter).toBeDefined();
    expect(tuseFilter.filterFn({ consorcio: "Consorcio TUSE Transportes" })).toBe(
      true,
    );
    expect(tuseFilter.filterFn({ consorcio: "Consorcio Internorte" })).toBe(
      false,
    );
  });
});
