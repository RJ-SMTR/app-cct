


const jwtServiceConfig = {
  
  signIn: `auth/licensee/login`,
  signUp: 'api/auth/sign-up',
  userInfo: `auth/me`,
  updateUser: 'api/auth/user/update',
  forgotPassword: `auth/forgot/password`,
  resetPassword: `auth/reset/password`,
  preRegister: `auth/licensee/pre-register`,
  register: `auth/email/register`,
  confirm: `auth/email/confirm`,
  invite: `auth/licensee/invite`,
  bankStatement: 'bank-statements/me',
  resumeTrips: '/trips-income/me',
  adminSignIn: 'auth/admin/email/login'
};

export default jwtServiceConfig;
