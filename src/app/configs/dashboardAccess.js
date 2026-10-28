// Usuários que enxergam o Dashboard de Pagamentos (menu e redirecionamento inicial).
export const DASHBOARD_PAGAMENTOS_USER_IDS = [45];

export const podeVerDashboardPagamentos = (userId) => DASHBOARD_PAGAMENTOS_USER_IDS.includes(Number(userId));

// Usuários com acesso à área de Auditoria (menu Configurações > Auditoria). A API valida o mesmo (AUDITORIA_USER_IDS).
export const AUDITORIA_USER_IDS = [45];

export const podeVerAuditoria = (userId) => AUDITORIA_USER_IDS.includes(Number(userId));
