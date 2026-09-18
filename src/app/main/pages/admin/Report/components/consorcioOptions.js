const BASE_REPORT_CONSORCIOS = [
  { label: "Todos", value: "Todos" },
  { label: "Internorte", value: "Internorte" },
  { label: "Intersul", value: "Intersul" },
  { label: "MobiRio", value: "MobiRio" },
  { label: "MOBI-Rio BUM", value: "MOBI-Rio BUM" },
  { label: "Santa Cruz", value: "Santa Cruz" },
  { label: "STPC", value: "STPC" },
  { label: "STPL", value: "STPL" },
  { label: "TEC", value: "TEC" },
  { label: "Transcarioca", value: "Transcarioca" },
  { label: "TUSE", value: "TUSE" },
  { label: "VLT", value: "VLT" },
];

const DISABLED_WITH_NAME_SELECTION = new Set(["STPC", "STPL", "TEC"]);

const RELEASE_CONSORCIO_FILTERS = [
  { label: "Todos", match: null },
  {
    label: "COMPANHIA MUNICIPAL DE TRANSPORTES COLETIVOS CMTC RIO",
    match: "CMTC",
  },
  {
    label: "CONSORCIO SANTA CRUZ TRANSPORTES",
    match: "Internorte",
  },
  {
    label: "CONSORCIO INTERSUL TRANSPORTES",
    match: "Intersul",
  },
  {
    label: "CONSORCIO TRANSCARIOCA DE TRANSPORTES",
    match: "Transcarioca",
  },
  {
    label: "CONSORCIO SANTA CRUZ TRANSPORTES",
    match: "Santa Cruz",
  },
  { label: "CONCESSIONARIA DO VLT CARIOCA S.A.", match: "VLT" },
  { label: "TUSE", match: "TUSE" },
  { label: "TEC", match: "TEC" },
];

export const buildReportConsorcioOptions = ({ selectedField, includeGtu } = {}) => {
  const disableRestrictedOptions = selectedField === "name";
  const options = [...BASE_REPORT_CONSORCIOS];

  if (includeGtu) {
    options.splice(1, 0, { label: "GTU", value: "GTU" });
  }

  return options.map((option) => ({
    ...option,
    disabled:
      disableRestrictedOptions &&
      DISABLED_WITH_NAME_SELECTION.has(option.value),
  }));
};

export const buildReleaseConsorcioFilters = () =>
  RELEASE_CONSORCIO_FILTERS.map(({ label, match }) => ({
    label,
    filterFn: match
      ? (row) => row.consorcio.includes(match)
      : () => true,
  }));
