import { lazy } from 'react';
import { authRoles } from 'src/app/auth';

const AuditoriaLazy = lazy(() => import('./AuditoriaApp'));

const AuditoriaConfig = {
  settings: {
    layout: {
      config: {
        footer: {
          display: false,
        },
      },
    },
  },
  // O acesso por usuário (id 45) é validado na tela e na API; aqui só o perfil.
  auth: authRoles.master,
  routes: [
    {
      path: 'auditoria',
      element: <AuditoriaLazy />,
    },
  ],
};

export default AuditoriaConfig;
