export const MIN_VANZEIROS_SELECTABLE_MONTH = "2024-04";

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

export const MIN_VANZEIROS_SELECTABLE_MONTH_DATE = buildMonthDate(
  MIN_VANZEIROS_SELECTABLE_MONTH
);

export function clampVanzeirosMonthDate(dateValue) {
  if (!(dateValue instanceof Date) || Number.isNaN(dateValue.getTime())) {
    return MIN_VANZEIROS_SELECTABLE_MONTH_DATE;
  }

  const normalizedDateValue = normalizeMonthDate(dateValue);

  if (
    normalizedDateValue.getTime() <
    MIN_VANZEIROS_SELECTABLE_MONTH_DATE.getTime()
  ) {
    return MIN_VANZEIROS_SELECTABLE_MONTH_DATE;
  }

  return normalizedDateValue;
}
