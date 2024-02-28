import { lazy } from 'react';
import { authRoles } from 'src/app/auth';

const ForbiddenAppLazy = lazy(() => import('./ForbiddenApp'));

const ForbiddenConfig = {
    settings: {
        layout: {
            config: {
                footer: {
                    display: false,
                },
            },
        },
    },
    auth: authRoles.onlyGuest,
    routes: [
        { 
            path: '/not-auth',
            element: <ForbiddenAppLazy />,
        },
    ],
};

export default ForbiddenConfig;
