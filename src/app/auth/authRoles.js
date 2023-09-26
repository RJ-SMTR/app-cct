/**
 * Authorization Roles
 */
const authRoles = {
  admin: ['Admin'],
  staff: ['admin', 'staff'],
  user: ['Admin', 'staff', 'User'],
  onlyGuest: [],
};

export default authRoles;
