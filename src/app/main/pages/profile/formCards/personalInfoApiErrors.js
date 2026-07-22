const DUPLICATE_EMAIL_ERROR_CODE = 'emailAlreadyExists';

export function isDuplicateEmailError(apiError) {
  return apiError?.message === DUPLICATE_EMAIL_ERROR_CODE
    || apiError?.errors?.email === DUPLICATE_EMAIL_ERROR_CODE;
}

export function getPersonalInfoErrors(apiError) {
  return apiError?.errors ?? apiError ?? {};
}

export function getPersonalInfoEmailErrorMessage(apiError) {
  if (isDuplicateEmailError(apiError)) {
    return 'Este e-mail já está em uso';
  }

  const errors = getPersonalInfoErrors(apiError);

  if (errors.email) {
    return 'E-mail inválido';
  }

  return null;
}
