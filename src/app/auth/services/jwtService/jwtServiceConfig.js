const jwtServiceConfig = {
  // AJUSTAR URL DA API DE ACORDO COM A PORT DO SEU SISTEMA
  signIn: 'http://localhost:3001/api/v1/auth/email/login',
  signUp: 'api/auth/sign-up',
  accessToken: 'http://localhost:3001/api/v1/auth/me',
  updateUser: 'api/auth/user/update',
  forgotPassword: "http://localhost:3001/api/v1/auth/forgot/password"
};

export default jwtServiceConfig;
