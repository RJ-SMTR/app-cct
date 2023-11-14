import { lazy } from 'react';
import { authRoles } from 'src/app/auth';

const ResumeApp = lazy(() => import('./ResumeApp'));

const ResumeConfig = {
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
            path: 'resumo',
            element: <ResumeApp />,
        },
    ],
};

export default ResumeConfig;
