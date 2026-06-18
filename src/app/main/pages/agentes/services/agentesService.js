import { api } from "app/configs/api/api";
import JwtService from "../../../../auth/services/jwtService";
import jwtServiceConfig from "../../../../auth/services/jwtService/jwtServiceConfig";

export const DEFAULT_AGENTES_DASHBOARD_MONTH = "2026-05";

function normalizeNumber(value) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function normalizePhoto(photo) {
  return {
    id: photo?.id || "",
    capturedAt: photo?.capturedAt || "",
    description: photo?.description || "-",
    status: photo?.status || "-",
    amount: normalizeNumber(photo?.amount),
    rejectionReason: photo?.rejectionReason || null,
  };
}

function normalizeSelectedPaymentWeek(selectedPaymentWeek) {
  if (!selectedPaymentWeek) {
    return null;
  }

  return {
    paymentDate: selectedPaymentWeek?.paymentDate || "",
    paymentDayType: selectedPaymentWeek?.paymentDayType || "",
    totalPaymentValue: normalizeNumber(selectedPaymentWeek?.totalPaymentValue),
    days: Array.isArray(selectedPaymentWeek?.days)
      ? selectedPaymentWeek.days.map((day) => ({
          date: day?.date || "",
          periodLabel: day?.periodLabel || "-",
          validPhotosCount: normalizeNumber(day?.validPhotosCount),
          rejectedPhotosCount: normalizeNumber(day?.rejectedPhotosCount),
          paymentStatus: day?.paymentStatus || "-",
          pendingReason: day?.pendingReason || null,
          totalPaymentValue: normalizeNumber(day?.totalPaymentValue),
        }))
      : [],
  };
}

function normalizeSelectedWorkDayPhotos(selectedWorkDayPhotos) {
  if (!selectedWorkDayPhotos) {
    return null;
  }

  return {
    paymentDate: selectedWorkDayPhotos?.paymentDate || "",
    date: selectedWorkDayPhotos?.date || "",
    periodLabel: selectedWorkDayPhotos?.periodLabel || "-",
    photos: Array.isArray(selectedWorkDayPhotos?.photos)
      ? selectedWorkDayPhotos.photos.map((photo) => normalizePhoto(photo))
      : [],
  };
}

function normalizeDashboardResponse(data, requestedMonth) {
  const monthlyPayments = Array.isArray(data?.monthlyPayments)
    ? data.monthlyPayments.map((payment) => ({
        paymentDate: payment?.paymentDate || "",
        paymentDayType: payment?.paymentDayType || "",
        validPhotosCount: normalizeNumber(payment?.validPhotosCount),
        rejectedPhotosCount: normalizeNumber(payment?.rejectedPhotosCount),
        paymentStatus: payment?.paymentStatus || "-",
        pendingReason: payment?.pendingReason || null,
        totalPaymentValue: normalizeNumber(payment?.totalPaymentValue),
        coveredDaysCount: normalizeNumber(payment?.coveredDaysCount),
      }))
    : [];

  return {
    month: data?.month || requestedMonth,
    currentView: data?.currentView || "monthly",
    availableMonths: Array.isArray(data?.availableMonths)
      ? [...data.availableMonths].sort()
      : [],
    validPhotosCount: normalizeNumber(data?.validPhotosCount),
    rejectedPhotosCount: normalizeNumber(data?.rejectedPhotosCount),
    consolidatedPaymentValue: normalizeNumber(data?.consolidatedPaymentValue),
    rejectionReasons: Array.isArray(data?.rejectionReasons)
      ? data.rejectionReasons.map((item) => ({
          reason: item?.reason || "-",
          count: normalizeNumber(item?.count),
        }))
      : [],
    monthlySummary: data?.monthlySummary || null,
    monthlyPayments,
    selectedPaymentWeek: normalizeSelectedPaymentWeek(
      data?.selectedPaymentWeek
    ),
    selectedWorkDayPhotos: normalizeSelectedWorkDayPhotos(
      data?.selectedWorkDayPhotos
    ),
  };
}

function buildDashboardRequestConfig(
  userId,
  month,
  paymentDate,
  workDate,
  token
) {
  return {
    method: "get",
    url: jwtServiceConfig.agentesDashboard,
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params: {
      userId,
      month,
      ...(paymentDate ? { paymentDate } : {}),
      ...(workDate ? { workDate } : {}),
    },
  };
}

export async function getAgentesDashboard(
  userId,
  month,
  paymentDate,
  workDate
) {
  const token = window.localStorage.getItem("jwt_access_token");

  if (!JwtService.isAuthTokenValid(token)) {
    throw new Error("Sessão inválida. Faça login novamente.");
  }

  const response = await api.request(
    buildDashboardRequestConfig(userId, month, paymentDate, workDate, token)
  );

  return {
    ...normalizeDashboardResponse(response.data, month),
    userId,
  };
}
