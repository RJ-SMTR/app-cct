import { lazy } from 'react';

const ProfileApp = lazy(() => import('./ProfileApp'));

const profileAppConfig = {
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
