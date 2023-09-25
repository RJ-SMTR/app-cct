import { lazy } from 'react';

const ResumeApp = lazy(() => import('./ResumeApp'));

const ResumeConfig = {
    settings: {
        layout: {
            config: {
                footer: {
                    display: false,
                },
            },
        },
    },
    routes: [
        {
            path: 'resumo',
            element: <ResumeApp />,
        },
    ],
};

export default ResumeConfig;
