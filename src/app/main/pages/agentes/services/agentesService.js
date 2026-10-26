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

// Data passada sem status de remessa venceu e não foi enviada: "Pendência de Pagamento", sem badge de erro (#1164).
function markUnsentPastPayments(monthlyPayments) {
  const today = new Date().toISOString().slice(0, 10);

  return monthlyPayments.map((payment) => {
    const paymentDate = payment.dataTentativaPagamento || payment.paymentDate;
    const isPast = Boolean(paymentDate) && paymentDate < today;
    const isUnsent = !hasRemittanceStatus(payment.statusRemessa);

    if (isPast && isUnsent && payment.totalPaymentValue > 0) {
      return { ...payment, paymentStatus: "Pendência de Pagamento" };
    }

    return payment;
  });
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
    return `group:${groupedIds}:${index}`;
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
    dadosBancariosFaltando: Boolean(order?.dadosBancariosFaltando),
  }));

  return markUnsentPastPayments(markPreviousAttemptsAsPending(monthlyPayments));
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

function getPagamentoIndevidoStatus(statusRemessa) {
  const status = Number(statusRemessa);

  if (status === 3 || status === 5) {
    return "Pago";
  }

  if (status === 4) {
    return "Rejeitado";
  }

  if (status === 1 || status === 2) {
    return "Aguardando Pagamento";
  }

  return "A pagar";
}

function formatDayMonth(dateOnly) {
  const [, month, day] = String(dateOnly || "").split("-");
  return day && month ? `${day}/${month}` : "";
}

/** "estorno pagamento em duplicidade em 03/09, 09/09 e 23/09": as datas dos pagamentos em duplicidade, quando se sabe. */
export function buildDuplicateRefundNote(duplicateDates) {
  const days = (Array.isArray(duplicateDates) ? duplicateDates : [])
    .map(formatDayMonth)
    .filter(Boolean);

  if (days.length === 0) {
    return "estorno pagamento em duplicidade";
  }

  const list =
    days.length === 1
      ? days[0]
      : `${days.slice(0, -1).join(", ")} e ${days[days.length - 1]}`;

  return `estorno pagamento em duplicidade em ${list}`;
}

/**
 * Valor indevido a pagar do guardador (tabela pagamento_indevido). Cada linha é um pagamento em que o guardador recebeu menos
 * que o devido (abatimento do indevido): data, valor devido, valor pago, diferença e status. `hasBalance` só é verdadeiro
 * quando ainda há saldo devedor, que é quando o quadro aparece.
 */
export function buildPagamentoIndevido(response) {
  const totals = response?.totais || {};
  const entries = Array.isArray(response?.lancamentos) ? response.lancamentos : [];
  const duplicateDates = (Array.isArray(response?.datasDuplicidade) ? response.datasDuplicidade : [])
    .map(toDateOnly)
    .filter(Boolean);
  const note = buildDuplicateRefundNote(duplicateDates);

  return {
    duplicateDates,
    totalIndevido: normalizeNumber(totals.valorIndevido),
    totalAbatido: normalizeNumber(totals.valorDebitado),
    totalSaldoDevedor: normalizeNumber(totals.saldoDevedor),
    hasBalance: normalizeNumber(totals.saldoDevedor) > 0,
    items: entries.map((entry, index) => {
      const difference = normalizeNumber(entry.diferenca);

      return {
        id: `${toDateOnly(entry.data)}-${index}`,
        date: toDateOnly(entry.data),
        amountDue: normalizeNumber(entry.valorDevido),
        amountPaid: normalizeNumber(entry.valorPago),
        difference,
        differenceNote: difference < 0 ? note : "",
        status: getPagamentoIndevidoStatus(entry.statusRemessa),
      };
    }),
  };
}

export const DUPLICATE_OFFSET_STATUS = "Abatimento por duplicidade";

function formatMonthYear(dateOnly) {
  const [year, month] = String(dateOnly || "").split("-");
  return year && month ? `${month}/${year}` : "";
}

/**
 * Motivo do status "Abatimento por duplicidade": "Valor pago em duplicidade em 09/2026".
 * Os meses vêm das datas dos pagamentos em duplicidade (sem repetir, em ordem, "08/2026 e 09/2026"); sem datas, fica só a frase sem o mês.
 */
export function buildDuplicateOffsetReason(duplicateDates) {
  const months = [
    ...new Set(
      (Array.isArray(duplicateDates) ? duplicateDates : [])
        .map(formatMonthYear)
        .filter(Boolean)
    ),
  ];
  const base = "Valor pago em duplicidade";

  if (months.length === 0) {
    return base;
  }

  if (months.length === 1) {
    return `${base} em ${months[0]}`;
  }

  return `${base} em ${months.slice(0, -1).join(", ")} e ${months[months.length - 1]}`;
}

function isPaidRemittanceStatus(statusRemessa) {
  return Number(statusRemessa) === 3 || Number(statusRemessa) === 5;
}

/**
 * Marca (`duplicateOffset`) os pagamentos da visão mensal que estão pagos e tiveram abatimento do pagamento indevido: o pagamento
 * do mesmo dia com valor pago menor que o devido no quadro do indevido. Os demais seguem como vieram.
 */
export function markDuplicateOffsetPayments(monthlyPayments, pagamentoIndevido) {
  const payments = Array.isArray(monthlyPayments) ? monthlyPayments : [];
  const offsetDates = new Set(
    (pagamentoIndevido?.items || [])
      .filter((item) => item.difference < 0 && item.date)
      .map((item) => item.date)
  );

  if (offsetDates.size === 0) {
    return payments;
  }

  const reason = buildDuplicateOffsetReason(pagamentoIndevido?.duplicateDates);

  return payments.map((payment) => {
    const paymentDate = payment.dataTentativaPagamento || payment.paymentDate;

    if (!isPaidRemittanceStatus(payment.statusRemessa) || !offsetDates.has(paymentDate)) {
      return payment;
    }

    return { ...payment, duplicateOffset: { status: DUPLICATE_OFFSET_STATUS, reason } };
  });
}

export async function getAgentePagamentoIndevido(userId) {
  const token = window.localStorage.getItem("jwt_access_token");

  if (!JwtService.isAuthTokenValid(token)) {
    throw new Error("Sessão inválida. Faça login novamente.");
  }

  const response = await api.request(
    buildRequestConfig(jwtServiceConfig.agentesPagamentoIndevido, token, {
      userId: Number(userId),
    })
  );

  return buildPagamentoIndevido(response.data);
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
