import { api } from 'app/configs/api/api';
import JwtService from '../../../../auth/services/jwtService';
import jwtServiceConfig from '../../../../auth/services/jwtService/jwtServiceConfig';

export const DEFAULT_AGENTES_DASHBOARD_MONTH = '2026-05';

function normalizeNumber(value) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function normalizePayment(payment, fallbackDate = '') {
  return {
    id: payment?.id || '',
    date: payment?.date || fallbackDate,
    description: payment?.description || '-',
    status: payment?.status || '-',
    amount: normalizeNumber(payment?.amount),
    rejectionReason: payment?.rejectionReason || null,
  };
}

function normalizeDashboardResponse(data, requestedMonth) {
  const dailyPayments = Array.isArray(data?.dailyPayments)
    ? data.dailyPayments.map((day) => ({
      date: day?.date || '',
      validPhotosCount: normalizeNumber(day?.validPhotosCount),
      rejectedPhotosCount: normalizeNumber(day?.rejectedPhotosCount),
      paymentStatus: day?.paymentStatus || '-',
      totalPaymentValue: normalizeNumber(day?.totalPaymentValue),
      payments: Array.isArray(day?.payments)
        ? day.payments.map((payment) => normalizePayment(payment, day?.date || ''))
        : [],
    }))
    : [];

  return {
    month: data?.month || requestedMonth,
    availableMonths: Array.isArray(data?.availableMonths) ? [...data.availableMonths].sort() : [],
    validPhotosCount: normalizeNumber(data?.validPhotosCount),
    rejectedPhotosCount: normalizeNumber(data?.rejectedPhotosCount),
    consolidatedPaymentValue: normalizeNumber(data?.consolidatedPaymentValue),
    rejectionReasons: Array.isArray(data?.rejectionReasons)
      ? data.rejectionReasons.map((item) => ({
        reason: item?.reason || '-',
        count: normalizeNumber(item?.count),
      }))
      : [],
    dailyPayments,
    selectedDayPayments: Array.isArray(data?.selectedDayPayments)
      ? data.selectedDayPayments.map((payment) => normalizePayment(payment))
      : [],
  };
}

function buildDashboardRequestConfig(userId, month, date, token) {
  return {
    method: 'get',
    url: jwtServiceConfig.agentesDashboard,
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params: {
      userId,
      month,
      ...(date ? { date } : {}),
    },
  };
}

export async function getAgentesDashboard(userId, month, date) {
  const token = window.localStorage.getItem('jwt_access_token');

  if (!JwtService.isAuthTokenValid(token)) {
    throw new Error('Sessão inválida. Faça login novamente.');
  }

  const response = await api.request(buildDashboardRequestConfig(userId, month, date, token));

  return {
    ...normalizeDashboardResponse(response.data, month),
    userId,
  };
}
