import { api } from "../../../../configs/api/api";
import JwtService from "../../../../auth/services/jwtService";
import {
  buildDashboardRequestConfig,
  getAgentesDashboard,
  normalizeDashboardResponse,
} from "./agentesService";

jest.mock("../../../../configs/api/api", () => ({
  api: {
    request: jest.fn(),
  },
}));

jest.mock("../../../../auth/services/jwtService", () => ({
  __esModule: true,
  default: {
    isAuthTokenValid: jest.fn(),
  },
}));

describe("agentesService", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    global.window = {
      localStorage: {
        getItem: jest.fn(() => "valid-token"),
      },
    };
  });

  it("builds dashboard request params according to the updated contract", () => {
    const requestConfig = buildDashboardRequestConfig(
      12,
      {
        month: "2026-08",
        dateType: "effective",
        paymentDate: "2026-08-20",
        workDate: "2026-08-15",
      },
      "token-123"
    );

    expect(requestConfig).toEqual({
      method: "get",
      url: "/v1/agentes/dashboard",
      headers: {
        Authorization: "Bearer token-123",
      },
      params: {
        userId: 12,
        month: "2026-08",
        dateType: "effective",
        paymentDate: "2026-08-20",
        workDate: "2026-08-15",
      },
    });
  });

  it("normalizes the dashboard response according to the new payload shape", () => {
    const normalizedDashboard = normalizeDashboardResponse(
      {
        month: "2026-08",
        dateType: "effective",
        availableMonths: ["2026-07", "2026-08"],
        currentView: "weekly",
        validPhotosCount: "3",
        rejectedPhotosCount: null,
        consolidatedPaymentValue: "90.5",
        associacoes: [
          {
            value: "10",
            label: "Flamengo",
            cpfCnpj: "12345678000100",
          },
        ],
        rejectionReasons: [{ reason: "Sem placa", count: "2" }],
        monthlySummary: {
          daysWithPayments: "1",
          totalPayments: "2",
          totalPaidEntries: "3",
          totalRejectedEntries: "4",
          totalPaymentValue: "90.5",
        },
        monthlyPayments: [
          {
            paymentDate: "2026-08-20",
            paymentDayType: "outro",
            validPhotosCount: "3",
            rejectedPhotosCount: "1",
            paymentStatus: "Pago",
            pendingReason: null,
            totalPaymentValue: "90.5",
            coveredDaysCount: "1",
          },
        ],
        selectedPaymentWeek: {
          paymentDate: "2026-08-20",
          paymentDayType: "outro",
          totalPaymentValue: "90.5",
          days: [
            {
              date: "2026-08-15",
              periodLabel: "Integral",
              validPhotosCount: "3",
              rejectedPhotosCount: "0",
              paymentStatus: "Pago",
              pendingReason: null,
              totalPaymentValue: "90.5",
            },
          ],
        },
        selectedWorkDayPhotos: {
          paymentDate: "2026-08-20",
          date: "2026-08-15",
          periodLabel: "Integral",
          photos: [
            {
              id: "photo-1",
              capturedAt: "2026-08-15T10:00:00.000Z",
              description: "Foto 1",
              status: "Pago",
              amount: "30.25",
              rejectionReason: null,
            },
          ],
        },
      },
      "2026-08"
    );

    expect(normalizedDashboard).toEqual({
      month: "2026-08",
      dateType: "effective",
      currentView: "weekly",
      availableMonths: ["2026-07", "2026-08"],
      associacoes: [
        {
          value: 10,
          label: "Flamengo",
          cpfCnpj: "12345678000100",
        },
      ],
      validPhotosCount: 3,
      rejectedPhotosCount: 0,
      consolidatedPaymentValue: 90.5,
      rejectionReasons: [{ reason: "Sem placa", count: 2 }],
      monthlySummary: {
        daysWithPayments: 1,
        totalPayments: 2,
        totalPaidEntries: 3,
        totalRejectedEntries: 4,
        totalPaymentValue: 90.5,
      },
      monthlyPayments: [
        {
          paymentDate: "2026-08-20",
          paymentDayType: "outro",
          validPhotosCount: 3,
          rejectedPhotosCount: 1,
          paymentStatus: "Pago",
          pendingReason: null,
          totalPaymentValue: 90.5,
          coveredDaysCount: 1,
        },
      ],
      selectedPaymentWeek: {
        paymentDate: "2026-08-20",
        paymentDayType: "outro",
        totalPaymentValue: 90.5,
        days: [
          {
            date: "2026-08-15",
            periodLabel: "Integral",
            validPhotosCount: 3,
            rejectedPhotosCount: 0,
            paymentStatus: "Pago",
            pendingReason: null,
            totalPaymentValue: 90.5,
          },
        ],
      },
      selectedWorkDayPhotos: {
        paymentDate: "2026-08-20",
        date: "2026-08-15",
        periodLabel: "Integral",
        photos: [
          {
            id: "photo-1",
            capturedAt: "2026-08-15T10:00:00.000Z",
            description: "Foto 1",
            status: "Pago",
            amount: 30.25,
            rejectionReason: null,
          },
        ],
      },
    });
  });

  it("requests the dashboard with month and explicit dateType", async () => {
    JwtService.isAuthTokenValid.mockReturnValue(true);
    api.request.mockResolvedValue({
      data: {
        month: "2026-08",
        dateType: "tentative",
        currentView: "monthly",
        availableMonths: ["2026-08"],
        associacoes: [],
        validPhotosCount: 0,
        rejectedPhotosCount: 0,
        rejectionReasons: [],
        consolidatedPaymentValue: 0,
        monthlySummary: {},
        monthlyPayments: [],
      },
    });

    const dashboard = await getAgentesDashboard(
      7,
      "2026-08",
      "tentative",
      "2026-08-20",
      "2026-08-15"
    );

    expect(api.request).toHaveBeenCalledWith({
      method: "get",
      url: "/v1/agentes/dashboard",
      headers: {
        Authorization: "Bearer valid-token",
      },
      params: {
        userId: 7,
        month: "2026-08",
        dateType: "tentative",
        paymentDate: "2026-08-20",
        workDate: "2026-08-15",
      },
    });

    expect(dashboard.userId).toBe(7);
    expect(dashboard.dateType).toBe("tentative");
  });
});
