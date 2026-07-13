import { lazy } from 'react';
import { authRoles } from 'src/app/auth';

const AgentesHome = lazy(() => import('./AgentesHome'));
const AgentesApp = lazy(() => import('./AgentesApp'));

const agentesAppConfig = {
  settings: {
    layout: {
      config: {
        footer: {
          display: false,
        },
      },
    },
  },
  auth: authRoles.agentes,
  routes: [
    {
      path: 'agentes',
      element: <AgentesHome />,
    },
    {
      path: 'agentes/:id',
      element: <AgentesApp />,
    },
  ],
};

export default agentesAppConfig;