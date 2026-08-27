import { api } from "../../../../configs/api/api";
import JwtService from "../../../../auth/services/jwtService";
import jwtServiceConfig from "../../../../auth/services/jwtService/jwtServiceConfig";

function normalizeNumber(value) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function toDateOnly(value) {
  const normalizedValue = String(value || "").trim();
  return normalizedValue ? normalizedValue.slice(0, 10) : "";
}

function normalizeCommaIds(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || "").trim())
      .filter(Boolean)
      .join(",");
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .join(",");
  }

  return "";
}

function normalizeIdsArray(ids) {
  if (!Array.isArray(ids)) {
    return [];
  }

  return ids
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item) && item > 0);
}

function hasRemittanceStatus(statusRemessa) {
  return (
    statusRemessa !== null &&
    statusRemessa !== undefined &&
    statusRemessa !== ""
  );
}

export function getPaymentStatus(statusRemessa, descricaoStatusRemessa) {
  const normalizedDescription = String(descricaoStatusRemessa || "")
    .trim()
    .toLowerCase();

  if (normalizedDescription.includes("naoefet")) {
    return "Rejeitado";
  }

  if (Number(statusRemessa) === 4) {
    return "Pendente";
  }

  if (normalizedDescription.includes("efet")) {
    return "Pago";
  }

  if (normalizedDescription.includes("aguard")) {
    return "Aguardando Pagamento";
  }

  if (Number(statusRemessa) === 5) {
    return "Pago";
  }

  if (Number(statusRemessa) === 1) {
    return "Aguardando Pagamento";
  }

  if (!hasRemittanceStatus(statusRemessa) && !normalizedDescription) {
    return "A pagar";
  }

  return "Rejeitado";
}

function shouldMarkPaymentAsPendingWithoutStatus(payment) {
  const hasPositiveValue = normalizeNumber(payment?.totalPaymentValue) > 0;
  const hasMissingStatus = !hasRemittanceStatus(payment?.statusRemessa);
  const hasMissingReason =
    payment?.motivoStatusRemessa == null &&
    payment?.descricaoMotivoStatusRemessa == null &&
    !String(payment?.pendingReason || "").trim();

  return hasPositiveValue && hasMissingStatus && hasMissingReason;
}

function markPreviousAttemptsAsPending(monthlyPayments) {
  const paymentAttemptDates = monthlyPayments
    .map(
      (payment) => payment.dataTentativaPagamento || payment.paymentDate
    )
    .filter(Boolean);
  const latestPaymentAttemptDate = paymentAttemptDates.reduce(
    (latestDate, currentDate) =>
      currentDate > latestDate ? currentDate : latestDate,
    paymentAttemptDates[0] || ""
  );

  return monthlyPayments.map((payment) => {
    const paymentAttemptDate =
      payment.dataTentativaPagamento || payment.paymentDate;
    const hasLaterPaymentAttemptWithStatus = monthlyPayments.some(
      (laterPayment) => {
        const laterPaymentAttemptDate =
          laterPayment.dataTentativaPagamento || laterPayment.paymentDate;
        const hasStatus = hasRemittanceStatus(laterPayment.statusRemessa);

        return (
          paymentAttemptDate &&
          laterPaymentAttemptDate > paymentAttemptDate &&
          hasStatus
        );
      }
    );
    const isLatestPendingAttempt =
      paymentAttemptDate === latestPaymentAttemptDate;

    if (shouldMarkPaymentAsPendingWithoutStatus(payment)) {
      return {
        ...payment,
        paymentStatus: "Pendência de Pagamento",
      };
    }

    if (
      Number(payment.statusRemessa) !== 4 ||
      (!hasLaterPaymentAttemptWithStatus && !isLatestPendingAttempt)
    ) {
      return payment;
    }

    return {
      ...payment,
      paymentStatus: "Pendência de Pagamento",
    };
  });
}

export function buildMonthlyPaymentRowKey(payment, index) {
  const groupedIds = normalizeCommaIds(payment?.ordemPagamentoAgrupadoIds);

  if (groupedIds) {
    return groupedIds;
  }

  return [
    toDateOnly(payment?.paymentDate),
    toDateOnly(payment?.dataTentativaPagamento),
    toDateOnly(payment?.dataEfetivaPagamento),
    normalizeNumber(payment?.totalPaymentValue).toFixed(2),
    String(payment?.statusRemessa ?? "null"),
    String(payment?.motivoStatusRemessa ?? "null"),
    String(payment?.descricaoMotivoStatusRemessa ?? "null"),
    index,
  ].join(":");
}

export function buildMonthlyPaymentRows(monthlyResponse) {
  const monthlyOrders = Array.isArray(monthlyResponse?.ordens)
    ? monthlyResponse.ordens
    : [];

  const monthlyPayments = monthlyOrders.map((order) => ({
    paymentDate: toDateOnly(order?.data || order?.dataTentativaPagamento),
    dataTentativaPagamento: toDateOnly(
      order?.dataTentativaPagamento || order?.data
    ),
    dataEfetivaPagamento: toDateOnly(
      order?.dataEfetivaPagamento || order?.dataPagamento
    ),
    paymentDayType: "",
    validPhotosCount: 0,
    rejectedPhotosCount: 0,
    statusRemessa:
      order?.statusRemessa === null || order?.statusRemessa === undefined
        ? null
        : Number(order?.statusRemessa),
    motivoStatusRemessa: order?.motivoStatusRemessa ?? null,
    descricaoMotivoStatusRemessa: order?.descricaoMotivoStatusRemessa ?? null,
    paymentStatus: getPaymentStatus(
      order?.statusRemessa,
      order?.descricaoStatusRemessa
    ),
    pendingReason:
      order?.descricaoMotivoStatusRemessa || order?.motivoStatusRemessa || null,
    totalPaymentValue: normalizeNumber(order?.valorTotal),
    coveredDaysCount: 0,
    ordemPagamentoAgrupadoIds: normalizeCommaIds(order?.ordemPagamentoAgrupadoIds),
  }));

  return markPreviousAttemptsAsPending(monthlyPayments);
}

function buildWeeklyRows(weeklyResponse) {
  if (!Array.isArray(weeklyResponse)) {
    return [];
  }

  return weeklyResponse.map((row) => ({
    date: toDateOnly(row?.dataCaptura),
    periodLabel: "Integral",
    validPhotosCount: 0,
    rejectedPhotosCount: 0,
    paymentStatus: "-",
    pendingReason: null,
    totalPaymentValue: normalizeNumber(row?.valor),
    ids: normalizeIdsArray(row?.ids),
  }));
}

function buildDailyPhotos(dailyResponse) {
  if (!Array.isArray(dailyResponse)) {
    return [];
  }

  return dailyResponse.map((row, index) => ({
    id: String(index + 1),
    capturedAt: row?.datetime_transacao || "",
    description: row?.tipo_transacao || "Repasse do guardador",
    status: "-",
    amount: normalizeNumber(row?.valor_pagamento),
    rejectionReason: null,
  }));
}

function buildRequestConfig(url, token, params) {
  return {
    method: "get",
    url,
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params,
  };
}

function getPaymentDayTypeLabel(dateValue) {
  const day = new Date(`${toDateOnly(dateValue)}T12:00:00`).getDay();

  if (day === 2) {
    return "terça-feira";
  }

  if (day === 5) {
    return "sexta-feira";
  }

  return "outro";
}

async function getMonthlyData(token, userId, month) {
  const response = await api.request(
    buildRequestConfig(jwtServiceConfig.agentesOdpMensal, token, {
      userId,
      yearMonth: month,
    })
  );

  return response.data;
}

async function getWeeklyData(token, userId, ordemPagamentoAgrupadoIds, endDate) {
  const response = await api.request(
    buildRequestConfig(jwtServiceConfig.agentesOdpSemanal, token, {
      userId,
      ordemPagamentoAgrupadoIds,
      endDate,
    })
  );

  return Array.isArray(response.data) ? response.data : [];
}

async function getDailyData(token, userId, ordemPagamentoIds) {
  const response = await api.request(
    buildRequestConfig(
      `${jwtServiceConfig.agentesOdpDiario}/?userId=${userId}`,
      token,
      {
        ordemPagamentoIds,
      }
    )
  );

  return Array.isArray(response.data) ? response.data : [];
}

function buildDashboardResponse({
  userId,
  month,
  monthlyPayments,
  selectedPaymentWeek,
  selectedWorkDayPhotos,
  totalMonthlyValue,
  currentView,
}) {
  return {
    userId,
    month,
    currentView,
    availableMonths: [],
    associacoes: [],
    validPhotosCount: 0,
    rejectedPhotosCount: 0,
    consolidatedPaymentValue: totalMonthlyValue,
    rejectionReasons: [],
    monthlySummary: null,
    monthlyPayments,
    selectedPaymentWeek,
    selectedWorkDayPhotos,
  };
}

export async function getAgentesDashboard(
  userId,
  month,
  paymentDate,
  workDate,
  associationId
) {
  const token = window.localStorage.getItem("jwt_access_token");

  if (!JwtService.isAuthTokenValid(token)) {
    throw new Error("Sessão inválida. Faça login novamente.");
  }

  const queryUserId = Number(userId);

  const monthlyData = await getMonthlyData(token, queryUserId, month);
  const monthlyPayments = buildMonthlyPaymentRows(monthlyData);
  const totalMonthlyValue = normalizeNumber(monthlyData?.valorTotal);

  let selectedPaymentWeek = null;
  let selectedWorkDayPhotos = null;

  if (paymentDate) {
    const selectedMonthlyRow = monthlyPayments.find(
      (payment) => payment.paymentDate === toDateOnly(paymentDate)
    );

    const ordemPagamentoAgrupadoIds = normalizeCommaIds(
      selectedMonthlyRow?.ordemPagamentoAgrupadoIds
    );

    if (ordemPagamentoAgrupadoIds) {
      const weeklyData = await getWeeklyData(
        token,
        queryUserId,
        ordemPagamentoAgrupadoIds,
        toDateOnly(paymentDate)
      );
      const weeklyDays = buildWeeklyRows(weeklyData);

      selectedPaymentWeek = {
        paymentDate: toDateOnly(paymentDate),
        paymentDayType: getPaymentDayTypeLabel(paymentDate),
        totalPaymentValue: weeklyDays.reduce(
          (sum, day) => sum + normalizeNumber(day.totalPaymentValue),
          0
        ),
        days: weeklyDays,
      };

      if (workDate) {
        const selectedWorkDay = weeklyDays.find(
          (day) => day.date === toDateOnly(workDate)
        );
        const ordemPagamentoIds = normalizeCommaIds(selectedWorkDay?.ids);

        if (ordemPagamentoIds) {
          const dailyData = await getDailyData(
            token,
            queryUserId,
            ordemPagamentoIds
          );
          selectedWorkDayPhotos = {
            paymentDate: toDateOnly(paymentDate),
            date: toDateOnly(workDate),
            periodLabel: selectedWorkDay?.periodLabel || "Integral",
            photos: buildDailyPhotos(dailyData),
          };
        }
      }
    }
  }

  return buildDashboardResponse({
    userId: queryUserId,
    month,
    monthlyPayments,
    selectedPaymentWeek,
    selectedWorkDayPhotos,
    totalMonthlyValue,
    currentView: workDate ? "daily" : paymentDate ? "weekly" : "monthly",
  });
}
