import { lazy } from 'react';

const ExtractApp = lazy(() => import('./ExtractApp'));

const ExtractConfig = {
    settings: {
        layout: {
            config: {},
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
