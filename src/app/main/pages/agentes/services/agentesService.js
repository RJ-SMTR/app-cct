import { api } from 'app/configs/api/api';
import JwtService from '../../../../auth/services/jwtService';
import jwtServiceConfig from '../../../../auth/services/jwtService/jwtServiceConfig';

const USE_MOCKED_AGENTES_DASHBOARD = true;

const MOCKED_AGENTES_DASHBOARD = {
  '2026-05': {
    month: '2026-05',
    validPhotosCount: 186,
    rejectedPhotosCount: 29,
    consolidatedPaymentValue: 18452.67,
    rejectionReasons: [
      { reason: 'Documento ilegível', count: 12 },
      { reason: 'Foto fora do padrão', count: 9 },
      { reason: 'Dado inconsistente', count: 5 },
      { reason: 'Duplicidade', count: 3 },
    ],
    dailyPayments: [
      {
        date: '2026-05-03',
        validPhotosCount: 18,
        rejectedPhotosCount: 4,
        totalPaymentValue: 1840.35,
        payments: [
          {
            id: 'PAG-0503-01',
            description: 'Repasse manhã',
            status: 'Pago',
            amount: 420.15,
            rejectionReason: null,
          },
          {
            id: 'PAG-0503-02',
            description: 'Repasse tarde',
            status: 'Pago',
            amount: 515.2,
            rejectionReason: null,
          },
          {
            id: 'PAG-0503-03',
            description: 'Ajuste operacional',
            status: 'Rejeitado',
            amount: 0,
            rejectionReason: 'Documento ilegível',
          },
        ],
      },
      {
        date: '2026-05-11',
        validPhotosCount: 24,
        rejectedPhotosCount: 3,
        totalPaymentValue: 2690.8,
        payments: [
          {
            id: 'PAG-0511-01',
            description: 'Repasse integral',
            status: 'Pago',
            amount: 1350.4,
            rejectionReason: null,
          },
          {
            id: 'PAG-0511-02',
            description: 'Complemento',
            status: 'Pago',
            amount: 1340.4,
            rejectionReason: null,
          },
          {
            id: 'PAG-0511-03',
            description: 'Conferência manual',
            status: 'Rejeitado',
            amount: 0,
            rejectionReason: 'Dado inconsistente',
          },
        ],
      },
      {
        date: '2026-05-19',
        validPhotosCount: 31,
        rejectedPhotosCount: 5,
        totalPaymentValue: 4135.17,
        payments: [
          {
            id: 'PAG-0519-01',
            description: 'Repasse início de semana',
            status: 'Pago',
            amount: 1635.17,
            rejectionReason: null,
          },
          {
            id: 'PAG-0519-02',
            description: 'Repasse fim de semana',
            status: 'Pago',
            amount: 2500,
            rejectionReason: null,
          },
          {
            id: 'PAG-0519-03',
            description: 'Reprocessamento',
            status: 'Rejeitado',
            amount: 0,
            rejectionReason: 'Duplicidade',
          },
        ],
      },
      {
        date: '2026-05-25',
        validPhotosCount: 20,
        rejectedPhotosCount: 2,
        totalPaymentValue: 2210.55,
        payments: [
          {
            id: 'PAG-0525-01',
            description: 'Repasse consolidado',
            status: 'Pago',
            amount: 1080.25,
            rejectionReason: null,
          },
          {
            id: 'PAG-0525-02',
            description: 'Complemento operacional',
            status: 'Pago',
            amount: 1130.3,
            rejectionReason: null,
          },
        ],
      },
    ],
  },
  '2026-04': {
    month: '2026-04',
    validPhotosCount: 154,
    rejectedPhotosCount: 21,
    consolidatedPaymentValue: 15218.11,
    rejectionReasons: [
      { reason: 'Documento ilegível', count: 8 },
      { reason: 'Foto fora do padrão', count: 6 },
      { reason: 'Dado inconsistente', count: 4 },
      { reason: 'Cadastro incompleto', count: 3 },
    ],
    dailyPayments: [
      {
        date: '2026-04-08',
        validPhotosCount: 21,
        rejectedPhotosCount: 3,
        totalPaymentValue: 2018.5,
        payments: [
          {
            id: 'PAG-0408-01',
            description: 'Repasse semanal',
            status: 'Pago',
            amount: 980.25,
            rejectionReason: null,
          },
          {
            id: 'PAG-0408-02',
            description: 'Complemento',
            status: 'Pago',
            amount: 1038.25,
            rejectionReason: null,
          },
        ],
      },
      {
        date: '2026-04-16',
        validPhotosCount: 27,
        rejectedPhotosCount: 4,
        totalPaymentValue: 3489.61,
        payments: [
          {
            id: 'PAG-0416-01',
            description: 'Repasse quinzena',
            status: 'Pago',
            amount: 1989.61,
            rejectionReason: null,
          },
          {
            id: 'PAG-0416-02',
            description: 'Complemento quinzena',
            status: 'Pago',
            amount: 1500,
            rejectionReason: null,
          },
          {
            id: 'PAG-0416-03',
            description: 'Validação manual',
            status: 'Rejeitado',
            amount: 0,
            rejectionReason: 'Cadastro incompleto',
          },
        ],
      },
      {
        date: '2026-04-28',
        validPhotosCount: 19,
        rejectedPhotosCount: 2,
        totalPaymentValue: 1877.9,
        payments: [
          {
            id: 'PAG-0428-01',
            description: 'Repasse fechamento',
            status: 'Pago',
            amount: 877.9,
            rejectionReason: null,
          },
          {
            id: 'PAG-0428-02',
            description: 'Complemento fechamento',
            status: 'Pago',
            amount: 1000,
            rejectionReason: null,
          },
        ],
      },
    ],
  },
};

export const DEFAULT_AGENTES_DASHBOARD_MONTH = Object.keys(MOCKED_AGENTES_DASHBOARD)
  .sort()
  .slice(-1)[0];

function normalizeNumber(value) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function normalizeDashboardResponse(data, requestedMonth) {
  const dailyPayments = Array.isArray(data?.dailyPayments)
    ? data.dailyPayments.map((day) => ({
        date: day?.date || '',
        validPhotosCount: normalizeNumber(day?.validPhotosCount),
        rejectedPhotosCount: normalizeNumber(day?.rejectedPhotosCount),
        totalPaymentValue: normalizeNumber(day?.totalPaymentValue),
        payments: Array.isArray(day?.payments)
          ? day.payments.map((payment) => ({
              id: payment?.id || '',
              description: payment?.description || '-',
              status: payment?.status || '-',
              amount: normalizeNumber(payment?.amount),
              rejectionReason: payment?.rejectionReason || null,
            }))
          : [],
      }))
    : [];

  return {
    month: data?.month || requestedMonth,
    availableMonths: Object.keys(MOCKED_AGENTES_DASHBOARD).sort(),
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
  };
}

function buildDashboardRequestConfig(userId, month, token) {
  return {
    method: 'get',
    url: jwtServiceConfig.agentesDashboard,
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params: {
      userId,
      month,
    },
  };
}

function wait(timeout) {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
}

export async function getAgentesDashboard(userId, month) {
  if (USE_MOCKED_AGENTES_DASHBOARD) {
    await wait(250);
    return {
      ...normalizeDashboardResponse(MOCKED_AGENTES_DASHBOARD[month], month),
      userId,
    };
  }

  const token = window.localStorage.getItem('jwt_access_token');

  if (!JwtService.isAuthTokenValid(token)) {
    throw new Error('Sessão inválida. Faça login novamente.');
  }

  const response = await api.request(buildDashboardRequestConfig(userId, month, token));
  return {
    ...normalizeDashboardResponse(response.data, month),
    userId,
  };
}
