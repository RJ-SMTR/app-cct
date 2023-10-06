import { lazy } from 'react';
import { authRoles } from 'src/app/auth';

const UserApp = lazy(() => import('./UserApp'));

const AdminUserConfig = {
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
            path: 'admin/user/:id',
            element: <UserApp />,
        },
    ],
};

export default AdminUserConfig;
