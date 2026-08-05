import {
  DEFAULT_AGENTES_DASHBOARD_DATE_TYPE,
  normalizeDashboardDateType,
  normalizeDashboardView,
} from "./services/agentesDashboardTypes";
import { resolveAgentesSelectedMonth } from "./agentesMonthSelection";

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function createAgentesDashboardQuery(query = {}) {
  const paymentDate = normalizeString(query.paymentDate);

  return {
    month: normalizeString(query.month),
    dateType: normalizeDashboardDateType(
      query.dateType || DEFAULT_AGENTES_DASHBOARD_DATE_TYPE
    ),
    paymentDate,
    workDate: paymentDate ? normalizeString(query.workDate) : "",
  };
}

export function resolveAgentesDashboardQuery(currentQuery, response) {
  const normalizedCurrentQuery = createAgentesDashboardQuery(currentQuery);
  const currentView = normalizeDashboardView(response?.currentView);
  const responseDateType = normalizeDashboardDateType(
    response?.dateType || normalizedCurrentQuery.dateType
  );
  const resolvedMonth = resolveAgentesSelectedMonth(
    normalizedCurrentQuery.month,
    response?.availableMonths
  );
  const resolvedPaymentDate = normalizeString(
    response?.selectedWorkDayPhotos?.paymentDate ||
      response?.selectedPaymentWeek?.paymentDate ||
      normalizedCurrentQuery.paymentDate
  );
  const resolvedWorkDate = normalizeString(
    response?.selectedWorkDayPhotos?.date || normalizedCurrentQuery.workDate
  );

  if (currentView === "monthly") {
    return {
      month: resolvedMonth,
      dateType: responseDateType,
      paymentDate: "",
      workDate: "",
    };
  }

  if (currentView === "weekly") {
    return {
      month: resolvedMonth,
      dateType: responseDateType,
      paymentDate: resolvedPaymentDate,
      workDate: "",
    };
  }

  return {
    month: resolvedMonth,
    dateType: responseDateType,
    paymentDate: resolvedPaymentDate,
    workDate: resolvedPaymentDate ? resolvedWorkDate : "",
  };
}

export function areAgentesDashboardQueriesEqual(leftQuery, rightQuery) {
  const normalizedLeftQuery = createAgentesDashboardQuery(leftQuery);
  const normalizedRightQuery = createAgentesDashboardQuery(rightQuery);

  return (
    normalizedLeftQuery.month === normalizedRightQuery.month &&
    normalizedLeftQuery.dateType === normalizedRightQuery.dateType &&
    normalizedLeftQuery.paymentDate === normalizedRightQuery.paymentDate &&
    normalizedLeftQuery.workDate === normalizedRightQuery.workDate
  );
}
