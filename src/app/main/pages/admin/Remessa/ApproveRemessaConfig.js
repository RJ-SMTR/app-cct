import { lazy } from 'react';
import { authRoles } from 'src/app/auth';

const ReportLazy = lazy(() => import('./ApproveRemessaApp'));

const AprovarRemessaConfig = {
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
            path: 'aprovar',
            element: <ReportLazy />,
        },
    ],
};

export default AprovarRemessaConfig;
