import { lazy } from 'react';

const ExtractApp = lazy(() => import('./ExtractApp'));

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
            path: 'extract',
            element: <ExtractApp />,
        },
    ],
};

export default ExtractConfig;
