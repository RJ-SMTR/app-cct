import { lazy } from 'react';
import { authRoles } from 'src/app/auth';

const FinanEdit = lazy(() => import('./FinanEditApp'));

const FinanEditConfig = {
    settings: {
        layout: {
            config: {
                footer: {
                    display: false,
                },
            },
        },
    },
    auth: authRoles.commonFinan,
    routes: [
        {
            path: 'lancamentos/editar/:id',
            element: <FinanEdit />,
        },
    ],
};

export default FinanEditConfig;
