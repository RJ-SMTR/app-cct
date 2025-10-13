import { lazy } from 'react';

const ReportLazy = lazy(() => import('./ReportApp.js'));

const ReportVanzeiroConfig = {
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
      path: 'relatorio-vanzeiro',
      element: <ReportLazy />,
    },
  ],
};

export default ReportVanzeiroConfig;
