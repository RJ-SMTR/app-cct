import { lazy } from 'react';
import { authRoles } from 'src/app/auth';

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
    auth: authRoles.commonFinan,
    routes: [
        {
            path: 'aprovação',
            element: <ApprovalAppLazy />,
        },
    ],
};

export default ApprovalConfig;
