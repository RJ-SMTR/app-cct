import { lazy } from 'react';
import ExtractApp from './ExtractApp'

const ExtractConfig24 = {
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
            path: 'extrato-24',
            element: <ExtractApp />,
        },
    ],
};

export default ExtractConfig24;
