/**
 * Authorization Roles
 */
const authRoles = {
  adminFinan: ['Admin Finan', 'Admin Master'],
  commonFinan: ['Lançador financeiro', 'Aprovador financeiro', 'Admin Master', 'Admin Finan'],
  releases: ['Lançador financeiro', 'Admin Master'],
  approval: ['Aprovador financeiro', 'Admin Master'],
  agentes: ['Agentes', 'agentes', 'Admin', 'admin', 'Admin Master'],
  admin: ['Admin', 'Admin Master', 'Agentes', 'agentes'],
  staff: ['Admin', 'staff', 'Admin Master'],
  user: ['User'],
  onlyGuest: [],
};

export default authRoles;
