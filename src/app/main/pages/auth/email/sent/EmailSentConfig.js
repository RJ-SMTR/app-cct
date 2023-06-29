import EmailSentPage from './EmailSentPage';
import authRoles from '../../../../../auth/authRoles';

const EmailSentConfig = {
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
            path: 'email-sent',
            element: <EmailSentPage />,
        },
    ],
};

export default EmailSentConfig;
