import SignInPage from './SignInPage';
import { authRoles } from 'src/app/auth';

const AdminSignIn = {
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
            path: 'admin/sign-in',
            element: <SignInPage />,
        },
    ],
};

export default AdminSignIn;