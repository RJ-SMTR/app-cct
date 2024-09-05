import { lazy } from 'react';
import { authRoles } from 'src/app/auth';

const ReportLazy = lazy(() => import('./ReportReleaseApp'));

const ReportReleaseConfig = {
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
            path: 'relatorio-lançamento',
            element: <ReportLazy />,
        },
    ],
};

export default ReportReleaseConfig;
