/**
 * Date line shown under the bank data card (RJ-SMTR/api-cct#1192).
 * `bankDataUpdatedAt` is when the bank data was last filled or changed;
 * the label keeps following `previousBankCode`.
 */
export function getBankDataDateInfo(user) {
  if (!user?.bankDataUpdatedAt) {
    return null;
  }

  return {
    label:
      user.previousBankCode != null
        ? "Última atualização em"
        : "Primeiro cadastro realizado em",
    date: user.bankDataUpdatedAt,
  };
}
