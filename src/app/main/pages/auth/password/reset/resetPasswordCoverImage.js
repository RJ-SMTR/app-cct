const GUARDADOR_ROLE_ID = 6;

export function getResetPasswordCoverImage(roleId) {
  return roleId === GUARDADOR_ROLE_ID ? 'assets/images/etc/agentes.jpeg' : 'assets/images/etc/kombi.jpg';
}
