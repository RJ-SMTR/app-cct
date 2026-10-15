import { lazy } from 'react';
import { authRoles } from 'src/app/auth';

const PagamentoConsorciosLazy = lazy(() => import('./PagamentoConsorciosApp'));
const PagamentoModaisLazy = lazy(() => import('./PagamentoModaisApp'));
const PagamentoGuardadoresLazy = lazy(() => import('./PagamentoGuardadoresApp'));
const PagamentoConsorciosPendenteLazy = lazy(() => import('./PagamentoConsorciosPendenteApp'));
const PagamentoModaisPendenteLazy = lazy(() => import('./PagamentoModaisPendenteApp'));
const PagamentoGuardadoresPendenteLazy = lazy(() => import('./PagamentoGuardadoresPendenteApp'));

const PagamentoConfig = {
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
      path: 'pagamentos/consorcios',
      element: <PagamentoConsorciosLazy />,
    },
    {
      path: 'pagamentos/modais',
      element: <PagamentoModaisLazy />,
    },
    {
      path: 'pagamentos/guardadores',
      element: <PagamentoGuardadoresLazy />,
    },
    {
      path: 'pagamentos/pendente/consorcios',
      element: <PagamentoConsorciosPendenteLazy />,
    },
    {
      path: 'pagamentos/pendente/modais',
      element: <PagamentoModaisPendenteLazy />,
    },
    {
      path: 'pagamentos/pendente/guardadores',
      element: <PagamentoGuardadoresPendenteLazy />,
    },
  ],
};

export default PagamentoConfig;
