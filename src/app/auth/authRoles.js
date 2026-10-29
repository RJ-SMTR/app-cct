/**
 * Authorization Roles
 */
const authRoles = {
  adminFinan: ['Admin Finan', 'Admin Master', 'Admin Master TI'],
  commonFinan: ['Lançador financeiro', 'Aprovador financeiro', 'Admin Master', 'Admin Master TI', 'Admin Finan'],
  releases: ['Lançador financeiro', 'Admin Master', 'Admin Master TI'],
  approval: ['Aprovador financeiro', 'Admin Master', 'Admin Master TI'],
  agentes: ['Agente', 'agentes', 'Admin', 'admin', 'Admin Master', 'Admin Master TI'],
  admin: ['Admin', 'Admin Master', 'Admin Master TI', 'Agentes', 'agentes'],
  master: ['Admin Master', 'Admin Master TI'],
  // Áreas restritas (Dashboard de Pagamentos, Ordens de Pagamento, Pagamentos, Auditoria): só a role TI.
  masterTi: ['Admin Master TI'],
  staff: ['Admin', 'staff', 'Admin Master', 'Admin Master TI'],
  user: ['User'],
  onlyGuest: [],
  // Qualquer perfil autenticado (usado em telas comuns a todos, como Perfil e Alterar Senha).
  all: ['Admin Master', 'Admin Master TI', 'Admin', 'User', 'Lançador financeiro', 'Aprovador financeiro', 'Admin Finan', 'Agente'],
};

export default authRoles;
