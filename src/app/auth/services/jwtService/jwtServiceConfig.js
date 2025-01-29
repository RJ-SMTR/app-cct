


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
  revenues: 'ticket-revenues/me/grouped',
  revenuesDay: 'ticket-revenues/me/individual',
  revenuesUn: 'ticket-revenues/me',
  adminSignIn: 'auth/admin/email/login',
  adminFinanceSignIn: 'auth/finan/email/login',
  adminConclude: 'auth/admin/email/conclude-login',
  finanGetInfo: 'lancamento',
  setRelease: 'lancamento/create',
  finanGetByStatus: 'lancamento/getbystatus',
  report: 'cnab/relatorio-novo-remessa',
  odpMensal: '/ordem-pagamento/mensal',
  odpSemanal: '/ordem-pagamento/semanal',
  odpDiario: '/ordem-pagamento/diario',
  odpAnteriores: '/ordem-pagamento/transacoes-dias-anteriores',

};

export default jwtServiceConfig;
