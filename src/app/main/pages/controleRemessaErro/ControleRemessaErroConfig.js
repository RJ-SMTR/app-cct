import { lazy } from 'react';
import { authRoles } from 'src/app/auth';

const ControleRemessaErroApp = lazy(() => import('./ControleRemessaErroApp'));

const ControleRemessaErroConfig = {
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
      path: 'controle-remessa-erros',
      element: <ControleRemessaErroApp />,
    },
  ],
};

export default ControleRemessaErroConfig;
