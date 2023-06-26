
const baseUrl = 'http://localhost:3001/api/v1/'

const jwtServiceConfig = {
  // AJUSTAR URL DA API DE ACORDO COM A PORT DO SEU SISTEMA
  signIn: `${baseUrl}auth/email/login`,
  signUp: 'api/auth/sign-up',
  accessToken: `${baseUrl}auth/me`,
  updateUser: 'api/auth/user/update',
  forgotPassword: `${baseUrl}auth/forgot/password`,
  resetPassword: `${baseUrl}auth/reset/password`,
};

export default jwtServiceConfig;
