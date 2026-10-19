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
