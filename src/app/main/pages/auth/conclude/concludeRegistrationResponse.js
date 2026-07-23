/**
 * @typedef {Object} ConcludeRegistrationResponseData
 * @property {string | undefined} fullName
 * @property {string | undefined} email
 * @property {string | undefined} permitCode
 * @property {number | null} roleId
 * @property {string | undefined} redirectTo
 */

/**
 * @param {{ data?: Partial<ConcludeRegistrationResponseData> } | undefined} response
 * @returns {ConcludeRegistrationResponseData}
 */
function normalizeConcludeRegistrationResponse(response) {
  return {
    fullName: response?.data?.fullName,
    email: response?.data?.email,
    permitCode: response?.data?.permitCode,
    roleId: response?.data?.roleId ?? null,
    redirectTo: response?.data?.redirectTo,
  };
}

export function getConcludeRegistrationInviteData(response) {
  return normalizeConcludeRegistrationResponse(response);
}

export function getConcludeRegistrationRegisterData(response) {
  return normalizeConcludeRegistrationResponse(response);
}
