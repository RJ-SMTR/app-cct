import { lazy } from 'react';
import { authRoles } from 'src/app/auth';

const ScheduleLazy = lazy(() => import('./ScheduleApp'));

const ScheduleConfig = {
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
            path: 'agendamento',
            element: <ScheduleLazy />,
        },
    ],
};

export default ScheduleConfig;
