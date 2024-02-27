import { lazy } from 'react';

const FinanReleaseLazy = lazy(() => import('./FinanReleaseApp'));

const FinanReleaseConfig = {
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
            path: 'lancamentos',
            element: <FinanReleaseLazy />,
        },
    ],
};

export default FinanReleaseConfig;
