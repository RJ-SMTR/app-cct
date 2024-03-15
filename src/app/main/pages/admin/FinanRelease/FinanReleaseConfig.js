import { lazy } from 'react';
import { authRoles } from 'src/app/auth';

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
    auth:  authRoles.commonFinan,
    routes: [
        {
            path: 'lancamentos',
            element: <FinanReleaseLazy />,
        },
    ],
};

export default FinanReleaseConfig;
