/**
 * Authorization Roles
 */
const authRoles = {
  adminFinan: ['Admin Finan', 'Admin Master'],
  commonFinan: ['Lançador financeiro', 'Aprovador financeiro', 'Admin Master', 'Admin Finan'],
  releases: ['Lançador financeiro', 'Admin Master'],
  approval: ['Aprovador financeiro', 'Admin Master'],
  agentes: ['Agente', 'agentes', 'Admin', 'admin', 'Admin Master'],
  admin: ['Admin', 'Admin Master', 'Agentes', 'agentes'],
  master: ['Admin Master'],
  staff: ['Admin', 'staff', 'Admin Master'],
  user: ['User'],
  onlyGuest: [],
  // Qualquer perfil autenticado (usado em telas comuns a todos, como Perfil e Alterar Senha).
  all: ['Admin Master', 'Admin', 'User', 'Lançador financeiro', 'Aprovador financeiro', 'Admin Finan', 'Agente'],
};

export default authRoles;
