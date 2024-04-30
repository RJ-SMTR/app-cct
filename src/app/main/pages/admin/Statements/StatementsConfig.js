import { lazy } from 'react';
import { authRoles } from 'src/app/auth';

const StatementsAppLazy = lazy(() => import('./StatementsApp'));

const StatementsConfig = {
    settings: {
        layout: {
            config: {
                footer: {
                    display: false,
                },
            },
        },
    },
    auth: authRoles.commonFinan,
    routes: [
        {
            path: 'extrato-lançamentos',
            element: <StatementsAppLazy />,
        },
    ],
};

export default StatementsConfig;
