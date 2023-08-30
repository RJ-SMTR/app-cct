import { lazy } from 'react';
import AdminApp from './AdminApp';

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
    auth: ['User'],
    routes: [
        {
            path: 'admin',
            element: <AdminAppLazy />,
        },
    ],
};

export default AdminConfig;
