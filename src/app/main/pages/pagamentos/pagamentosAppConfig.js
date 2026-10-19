import { lazy } from 'react';
import { authRoles } from 'src/app/auth';
import PagamentosHome from './pagamentosHome';


const PagamentosAppConfig = {
  settings: {
    layout: {
      config: {
        footer: {
          display: false,
        },
      },
    },
  },
  auth: authRoles.admin,
  routes: [
    {
      path: 'pagamentos',
      element: <PagamentosHome />,
    }   
  ],
};

export default PagamentosAppConfig;