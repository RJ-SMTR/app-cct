import { authRoles } from 'src/app/auth';
import { lazy } from 'react';

const ConcludeLazy = lazy(() => import('./ConcludeApp'));

const AdminConclude = {
    settings: {
        layout: {
            config: {
                navbar: {
                    display: false,
                },
                toolbar: {
                    display: false,
                },
                footer: {
                    display: false,
                },
                leftSidePanel: {
                    display: false,
                },
                rightSidePanel: {
                    display: false,
                },
            },
        },
    },
    auth: authRoles.onlyGuest,
    routes: [
        {
            path: 'conclude-admin/:hash',
            element: <ConcludeLazy />,
        },
    ],
};

export default AdminConclude;