import { lazy } from 'react';

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
    auth: ['Admin'],
    routes: [
        {
            path: 'disparo',
            element: <TriggerAppLazy />,
        },
    ],
};

export default TriggerConfig;
