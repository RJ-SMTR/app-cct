/**
 * Authorization Roles
 */
const authRoles = {
  adminFinan: ['Admin Finan', , 'Admin Master'],
  commonFinan: [ 'Lançador financeiro', 'Aprovador financeiro', 'Admin Master' ],
  releases: ['Lançador financeiro', 'Admin Master'],
  approval: ['Aprovador financeiro', 'Admin Master'],
  admin: ['Admin', 'Admin Master'],
  staff: ['Admin', 'staff', 'Admin Master'],
  user: ['User'],
  onlyGuest: [],
};

export default authRoles;
