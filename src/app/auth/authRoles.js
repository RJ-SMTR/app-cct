/**
 * Authorization Roles
 */
const authRoles = {
  adminFinan :['Admin Finan'],
  commonFinan: [ 'Lançador financeiro', 'Aprovador financeiro' ],
  releases: ['Lançador financeiro'],
  approval: ['Aprovador financeiro'],
  admin: ['Admin'],
  staff: ['Admin', 'staff'],
  user: ['User'],
  onlyGuest: [],
};

export default authRoles;
