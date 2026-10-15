import { lazy } from 'react';
import { authRoles } from 'src/app/auth';

const ChangePasswordLazy = lazy(() => import('./ChangePassword'));

const ChangePasswordConfig = {
  auth: authRoles.all,
  settings: {
    layout: {
      config: {
        footer: {
          display: false,
        },
      },
    },
  },
  routes: [
    {
      path: 'change-password',
      element: <ChangePasswordLazy />,
    },
  ],
};

export default ChangePasswordConfig;
