import { lazy } from 'react';
import ReportVanzeiro from './ReportVanzeiroApp';


const ReportVanzeiroConfig = {
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
            path: 'relatorio-vanzeiro',
            element: <ReportVanzeiro />,
        },
    ],
};

export default ReportVanzeiroConfig;
