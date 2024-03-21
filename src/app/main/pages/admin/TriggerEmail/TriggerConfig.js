import { lazy } from 'react';
import { authRoles } from 'src/app/auth';

const TriggerAppLazy = lazy(() => import('./TriggerApp'));

const TriggerConfig = {
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
            path: 'disparo',
            element: <TriggerAppLazy />,
        },
    ],
};

export default TriggerConfig;
