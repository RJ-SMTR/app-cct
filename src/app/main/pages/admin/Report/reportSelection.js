export const REPORT_AUDIENCE_OPTIONS = [
  { value: "permissionario", label: "Permissionário" },
  { value: "guardador", label: "Guardador" },
];

const REPORTS_WITH_AUDIENCE_SELECTOR = new Set(["consolidado"]);

export function shouldShowAudienceSelector(selectedReport) {
  return REPORTS_WITH_AUDIENCE_SELECTOR.has(selectedReport);
}
