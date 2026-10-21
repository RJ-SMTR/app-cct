import { lazy } from 'react';
import { authRoles } from 'src/app/auth';

const StatementsAppLazy = lazy(() => import('./StatementsApp'));
const StatementsDetalheAppLazy = lazy(() => import('./StatementsDetalheApp'));

const StatementsConfig = {
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
            path: 'extrato-contas',
            element: <StatementsAppLazy />,
        },
        {
            path: 'extrato-contas/detalhe',
            element: <StatementsDetalheAppLazy />,
        },
    ],
};

export default StatementsConfig;
