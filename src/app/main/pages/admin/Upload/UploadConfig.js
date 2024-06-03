import { lazy } from 'react';
import { authRoles } from 'src/app/auth';

const UploadAppLazy = lazy(() => import('./UploadApp'));

const UploadConfig = {
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
            path: 'upload',
            element: <UploadAppLazy />,
        },
    ],
};

export default UploadConfig;
