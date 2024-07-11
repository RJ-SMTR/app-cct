import { lazy } from 'react';
import { authRoles } from 'src/app/auth';

const ReportLazy = lazy(() => import('./ReportApp'));

const ReportConfig = {
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
            path: 'relatorio',
            element: <ReportLazy />,
        },
    ],
};

export default ReportConfig;
