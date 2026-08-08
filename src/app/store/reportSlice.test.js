import jwtServiceConfig from "../auth/services/jwtService/jwtServiceConfig";
import JwtService from "../auth/services/jwtService";
import { fetchAgentConsolidatedReport } from "./reportSlice";

jest.mock("app/configs/api/api", () => ({
  api: {
    request: jest.fn(),
  },
}), { virtual: true });

jest.mock("../auth/services/jwtService", () => ({
  __esModule: true,
  default: {
    isAuthTokenValid: jest.fn(),
  },
}));

const { api } = require("app/configs/api/api");

describe("fetchAgentConsolidatedReport", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.window = {
      localStorage: {
        getItem: jest.fn(() => "test-token"),
      },
    };
    JwtService.isAuthTokenValid.mockReturnValue(true);
    api.request.mockResolvedValue({ data: [] });
  });

  it("requests the configured guardador consolidated report endpoint", async () => {
    await fetchAgentConsolidatedReport({
      dateRange: [new Date("2026-07-01T12:00:00"), new Date("2026-07-31T12:00:00")],
      agentNames: [],
      associations: [],
      status: [],
      erroStatus: [],
      valorMin: "",
      valorMax: "",
    })();

    expect(api.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "get",
        url: jwtServiceConfig.consolidadoGuardador,
        params: expect.objectContaining({
          dataInicio: "2026-07-01",
          dataFim: "2026-07-31",
        }),
      })
    );
  });
});
