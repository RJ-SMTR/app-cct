// Usuários que enxergam o Dashboard de Pagamentos (menu e redirecionamento inicial).
export const DASHBOARD_PAGAMENTOS_USER_IDS = [45];

export const podeVerDashboardPagamentos = (userId) => DASHBOARD_PAGAMENTOS_USER_IDS.includes(Number(userId));
