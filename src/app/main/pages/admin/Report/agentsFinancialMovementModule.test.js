import jwtServiceConfig from "src/app/auth/services/jwtService/jwtServiceConfig";

describe("AgentsFinancialMovement module setup", () => {
  it("defines the guardador financial movement endpoint in jwtServiceConfig", () => {
    expect(jwtServiceConfig.guardadorFinancialMovement).toBe(
      "cnab/relatorio-novo-remessa/guardador"
    );
  });
});
