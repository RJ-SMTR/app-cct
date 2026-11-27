import { lazy } from 'react';
import { authRoles } from 'src/app/auth';

const DashboardPagamentosLazy = lazy(() => import('./DashboardPagamentosApp'));
const DashboardPagamentosDetalheLazy = lazy(() => import('./DashboardPagamentosDetalheApp'));

const DashboardPagamentosConfig = {
  settings: {
    layout: {
      config: {
        footer: {
          display: false,
        },
      },
    },
  },
  // Admin Master (roleId 0) e Admin Master TI (roleId 7).
  auth: authRoles.master,
  routes: [
    {
      path: 'dashboard-pagamentos',
      element: <DashboardPagamentosLazy />,
    },
    {
      path: 'dashboard-pagamentos/detalhe',
      element: <DashboardPagamentosDetalheLazy />,
    },
  ],
};

export default DashboardPagamentosConfig;
