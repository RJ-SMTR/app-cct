import { lazy } from 'react';
import { authRoles } from 'src/app/auth';

const OrdemPagamentoPermissionarioLazy = lazy(() => import('./OrdemPagamentoPermissionarioApp'));
const OrdemPagamentoGuardadorLazy = lazy(() => import('./OrdemPagamentoGuardadorApp'));

const OrdemPagamentoConfig = {
  settings: {
    layout: {
      config: {
        footer: {
          display: false,
        },
      },
    },
  },
  auth: authRoles.masterTi,
  routes: [
    {
      path: 'ordem-pagamento/permissionario',
      element: <OrdemPagamentoPermissionarioLazy />,
    },
    {
      path: 'ordem-pagamento/guardador',
      element: <OrdemPagamentoGuardadorLazy />,
    },
  ],
};

export default OrdemPagamentoConfig;
