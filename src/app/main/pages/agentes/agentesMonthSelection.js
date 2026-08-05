export const MIN_AGENTES_SELECTABLE_MONTH = "2026-07";

export function buildMonthDate(month) {
  if (!month) {
    return new Date();
  }

  return new Date(`${month}-01T12:00:00`);
}

function normalizeMonthDate(dateValue) {
  return new Date(
    dateValue.getFullYear(),
    dateValue.getMonth(),
    1,
    12,
    0,
    0,
    0
  );
}

export const MIN_AGENTES_SELECTABLE_MONTH_DATE = buildMonthDate(
  MIN_AGENTES_SELECTABLE_MONTH
);

export function getInitialAgentesMonthDate() {
  return clampAgentesMonthDate(buildMonthDate());
}

export function clampAgentesMonthDate(dateValue) {
  if (!(dateValue instanceof Date) || Number.isNaN(dateValue.getTime())) {
    return MIN_AGENTES_SELECTABLE_MONTH_DATE;
  }

  const normalizedDateValue = normalizeMonthDate(dateValue);

  if (
    normalizedDateValue.getTime() <
    MIN_AGENTES_SELECTABLE_MONTH_DATE.getTime()
  ) {
    return MIN_AGENTES_SELECTABLE_MONTH_DATE;
  }

  return normalizedDateValue;
}

export function getLatestAllowedAgentesMonth(availableMonths) {
  if (!Array.isArray(availableMonths) || availableMonths.length === 0) {
    return null;
  }

  const sortedMonths = [...availableMonths].sort();

  for (let index = sortedMonths.length - 1; index >= 0; index -= 1) {
    if (sortedMonths[index] >= MIN_AGENTES_SELECTABLE_MONTH) {
      return sortedMonths[index];
    }
  }

  return null;
}

export function getSelectableAgentesMonths(availableMonths) {
  if (!Array.isArray(availableMonths) || availableMonths.length === 0) {
    return [];
  }

  return [...new Set(availableMonths)]
    .filter(
      (month) => typeof month === "string" && month >= MIN_AGENTES_SELECTABLE_MONTH
    )
    .sort()
    .reverse();
}

export function resolveAgentesSelectedMonth(currentMonth, availableMonths) {
  const normalizedCurrentMonth =
    typeof currentMonth === "string" ? currentMonth.trim() : "";
  const selectableMonths = getSelectableAgentesMonths(availableMonths);

  if (
    normalizedCurrentMonth &&
    selectableMonths.includes(normalizedCurrentMonth)
  ) {
    return normalizedCurrentMonth;
  }

  return selectableMonths[0] || normalizedCurrentMonth;
}
