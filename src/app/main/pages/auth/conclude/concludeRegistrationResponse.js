/**
 * @typedef {Object} ConcludeRegistrationResponseData
 * @property {string | undefined} fullName
 * @property {string | undefined} email
 * @property {string | undefined} permitCode
 * @property {string | undefined} cpfCnpj
 * @property {number | null} roleId
 * @property {string | undefined} roleName
 * @property {string | undefined} redirectTo
 */

/**
 * @param {{ data?: Partial<ConcludeRegistrationResponseData> } | undefined} response
 * @returns {ConcludeRegistrationResponseData}
 */
function normalizeConcludeRegistrationResponse(response) {
  const user = response?.data?.user;

  return {
    fullName: response?.data?.fullName ?? user?.fullName,
    email: response?.data?.email ?? user?.email,
    permitCode: response?.data?.permitCode ?? user?.permitCode,
    cpfCnpj: response?.data?.cpfCnpj ?? user?.cpfCnpj,
    roleId: response?.data?.roleId ?? null,
    roleName: response?.data?.role?.name ?? user?.role?.name,
    redirectTo: response?.data?.redirectTo,
  };
}

export function getConcludeRegistrationInviteData(response) {
  return normalizeConcludeRegistrationResponse(response);
}

export function getConcludeRegistrationRegisterData(response) {
  return normalizeConcludeRegistrationResponse(response);
}

export function isConcludeRegistrationAgente(data) {
  return data?.roleId === 6 || data?.roleName === 'agentes';
}

export function getConcludeRegistrationPrimaryInfo(data) {
  if (isConcludeRegistrationAgente(data)) {
    return {
      label: 'CPF',
      value: data?.cpfCnpj ?? '',
    };
  }

  return {
    label: 'Código de permissão',
    value: data?.permitCode ?? '',
  };
}

export function getConcludeRegistrationCoverImage(data) {
  return isConcludeRegistrationAgente(data)
    ? 'assets/images/etc/agentes.jpeg'
    : 'assets/images/etc/kombi.jpg';
}
