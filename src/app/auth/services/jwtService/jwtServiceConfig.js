
const baseUrl = 'http://localhost:3000/api/v1/'

const jwtServiceConfig = {
  // AJUSTAR URL DA API DE ACORDO COM A PORT DO SEU SISTEMA
  signIn: `${baseUrl}auth/email/login`,
  signUp: 'api/auth/sign-up',
  accessToken: `${baseUrl}auth/me`,
  updateUser: 'api/auth/user/update',
  forgotPassword: `${baseUrl}auth/forgot/password`,
  resetPassword: `${baseUrl}auth/reset/password`,
  preRegister: `${baseUrl}auth/licensee/pre-register`
};

export default jwtServiceConfig;
