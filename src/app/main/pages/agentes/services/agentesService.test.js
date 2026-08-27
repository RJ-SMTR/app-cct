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

jest.mock("../../../../auth/services/jwtService/jwtServiceConfig", () => ({
  __esModule: true,
  default: {},
}));

import {
  buildMonthlyPaymentRowKey,
  buildMonthlyPaymentRows,
  getPaymentStatus,
} from "./agentesService";

describe("agentesService payment normalization", () => {
  it("keeps rows without a remittance attempt as A pagar", () => {
    const monthlyRows = buildMonthlyPaymentRows({
      ordens: [
        {
          data: "2026-08-28T00:00:00.000Z",
          valorTotal: 0,
          statusRemessa: null,
          descricaoStatusRemessa: null,
          dataTentativaPagamento: "2026-08-28T00:00:00.000Z",
        },
      ],
    });

    expect(monthlyRows).toHaveLength(1);
    expect(monthlyRows[0].statusRemessa).toBeNull();
    expect(monthlyRows[0].paymentStatus).toBe("A pagar");
  });

  it("marks rows with value and no remittance status as Pendência de Pagamento", () => {
    const monthlyRows = buildMonthlyPaymentRows({
      ordens: [
        {
          data: "2026-08-28T00:00:00.000Z",
          valorTotal: 142.35,
          statusRemessa: null,
          descricaoStatusRemessa: null,
          motivoStatusRemessa: null,
          descricaoMotivoStatusRemessa: null,
          dataTentativaPagamento: "2026-08-28T00:00:00.000Z",
        },
      ],
    });

    expect(monthlyRows).toHaveLength(1);
    expect(monthlyRows[0].statusRemessa).toBeNull();
    expect(monthlyRows[0].paymentStatus).toBe("Pendência de Pagamento");
  });

  it("treats NaoEfetivado as Rejeitado instead of Pago", () => {
    expect(getPaymentStatus(4, "NaoEfetivado")).toBe("Rejeitado");
  });

  it("builds distinct row keys for same-date monthly rows", () => {
    const monthlyRows = buildMonthlyPaymentRows({
      ordens: [
        {
          ordemGuardadorId: 1,
          nomeGuardador: "TELMA CLOTILDE",
          ordemPagamentoAgrupadoIds: "491928",
          data: "2026-08-25T00:00:00.000Z",
          valorTotal: 1.4,
          statusRemessa: 4,
          descricaoStatusRemessa: "NaoEfetivado",
          dataTentativaPagamento: "2026-08-25T00:00:00.000Z",
        },
        {
          ordemGuardadorId: 2,
          nomeGuardador: "ANTERO GOMES COELHO NETO",
          ordemPagamentoAgrupadoIds: null,
          data: "2026-08-25T00:00:00.000Z",
          valorTotal: 0,
          statusRemessa: null,
          descricaoStatusRemessa: null,
          dataTentativaPagamento: "2026-08-25T00:00:00.000Z",
        },
      ],
    });

    expect(buildMonthlyPaymentRowKey(monthlyRows[0], 0)).not.toBe(
      buildMonthlyPaymentRowKey(monthlyRows[1], 1)
    );
  });
});
