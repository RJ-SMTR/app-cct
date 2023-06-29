import ConfirmEmailPage from './ConfirmEmailPage';
import authRoles from '../../../../../auth/authRoles';

const ConfirmEmailConfig = {
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
            path: 'confirm-email/:hash',
            element: <ConfirmEmailPage />,
        },
    ],
};

export default ConfirmEmailConfig;
