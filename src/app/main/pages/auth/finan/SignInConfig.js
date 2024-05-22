import FinanSignIn from './SignInApp';
import { authRoles } from 'src/app/auth';

const FinanSignInConfig = {
    settings: {
        layout: {
            config: {
                navbar: {
                    display: false,
                },
                toolbar: {
                    display: false,
                },
                footer: {
                    display: false,
                },
                leftSidePanel: {
                    display: false,
                },
                rightSidePanel: {
                    display: false,
                },
            },
        },
    },
    auth: authRoles.onlyGuest,
    routes: [
        {
            path: 'financeiro/sign-in',
            element: <FinanSignIn />,
        },
    ],
};

export default FinanSignInConfig;