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
    auth: ['Staff'],
    routes: [
        {
            path: 'lancamentos-finaceiros',
            element: <FinanReleaseLazy />,
        },
    ],
};

export default FinanReleaseConfig;
