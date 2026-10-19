import { lazy } from 'react';
import { authRoles } from 'src/app/auth';

const ProfileApp = lazy(() => import('./ProfileApp'));

const profileAppConfig = {
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
      path: 'profile',
      element: <ProfileApp />,
    },
  ],
};

export default profileAppConfig;
