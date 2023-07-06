import ConcludePage from './ConcludePage';
import authRoles from '../../../../auth/authRoles';

const ConcludeConfig = {
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
            path: 'conclude-registration/:hash',
            element: <ConcludePage />,
        },
    ],
};

export default ConcludeConfig;
