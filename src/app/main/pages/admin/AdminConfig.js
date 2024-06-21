import { lazy } from 'react';
import AdminApp from './AdminApp';
import { authRoles } from 'src/app/auth';

const AdminAppLazy = lazy(() => import('./AdminApp'));

const AdminConfig = {
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
            path: 'admin',
            element: <AdminAppLazy />,
        },
    ],
};

export default AdminConfig;
