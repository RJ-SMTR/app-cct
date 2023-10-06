import { lazy } from 'react';

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
    auth: ['Admin'],
    routes: [
        {
            path: 'upload',
            element: <UploadAppLazy />,
        },
    ],
};

export default UploadConfig;
