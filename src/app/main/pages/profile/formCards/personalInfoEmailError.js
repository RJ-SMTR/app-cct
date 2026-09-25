export function getEmailErrorMessage(emailError) {
  return emailError === 'emailAlreadyExists' ? 'E-mail já está sendo usado.' : 'E-mail inválido';
}
