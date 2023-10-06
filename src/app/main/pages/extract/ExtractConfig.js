import { lazy } from 'react';
import ExtractApp from './ExtractApp'

const ExtractConfig = {
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
            path: 'extrato',
            element: <ExtractApp />,
        },
    ],
};

export default ExtractConfig;
