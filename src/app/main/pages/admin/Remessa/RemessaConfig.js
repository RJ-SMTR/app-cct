import { lazy } from 'react';
import { authRoles } from 'src/app/auth';

const ReportLazy = lazy(() => import('./RemessaApp'));

const RemessaConfig = {
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
            path: 'agendar',
            element: <ReportLazy />,
        },
    ],
};

export default RemessaConfig;
