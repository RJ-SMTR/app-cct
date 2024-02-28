import { lazy } from 'react';

const ApprovalAppLazy = lazy(() => import('./ApprovalApp'));

const ApprovalConfig = {
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
            path: 'aprovação',
            element: <ApprovalAppLazy />,
        },
    ],
};

export default ApprovalConfig;
