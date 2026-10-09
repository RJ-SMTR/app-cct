import { getBankDataDateInfo } from "./bankDataDateInfo";

describe("getBankDataDateInfo", () => {
  const bankDataUpdatedAt = "2026-09-10T10:00:14.000Z";

  it("labels the date as the first registration while the bank was never replaced", () => {
    expect(
      getBankDataDateInfo({
        bankDataUpdatedAt,
        previousBankCode: null,
        createdAt: "2026-01-01T00:00:00.000Z",
      })
    ).toEqual({
      label: "Primeiro cadastro realizado em",
      date: bankDataUpdatedAt,
    });
  });

  it("labels the date as the last update once there is a previous bank", () => {
    expect(
      getBankDataDateInfo({
        bankDataUpdatedAt,
        previousBankCode: 104,
        updatedAt: "2026-10-01T00:00:00.000Z",
      })
    ).toEqual({
      label: "Última atualização em",
      date: bankDataUpdatedAt,
    });
  });

  it.each([
    ["bank data was never filled", { bankDataUpdatedAt: null, previousBankCode: null, createdAt: "2026-01-01T00:00:00.000Z" }],
    ["the API does not send the field yet", { previousBankCode: 104, updatedAt: "2026-10-01T00:00:00.000Z" }],
    ["there is no user", undefined],
  ])("returns null when %s", (_case, user) => {
    expect(getBankDataDateInfo(user)).toBeNull();
  });
});
