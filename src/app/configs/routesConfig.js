import FuseUtils from '@fuse/utils';
import FuseLoading from '@fuse/core/FuseLoading';
import { Navigate } from 'react-router-dom';
import settingsConfig from 'app/configs/settingsConfig';
import SignInConfig from '../main/pages/auth/sign-in/SignInConfig';
import SignOutConfig from '../main/pages/auth/sign-out/SignOutConfig';
import ForgotPasswordConfig from '../main/pages/auth/password/forgot/ForgotPasswordConfig';
import ResetPasswordConfig from '../main/pages/auth/password/reset/ResetPasswordConfig';
import ConcludeConfig from '../main/pages/auth/conclude/ConcludeConfig';
import Error404Page from '../main/404/Error404Page';
import ExampleConfig from '../main/example/ExampleConfig';
import profileAppConfig from '../main/pages/profile/profileAppConfig';

const routeConfigs = [
  ExampleConfig,
  SignOutConfig,
  SignInConfig,
  ForgotPasswordConfig,
  ResetPasswordConfig,
  ConcludeConfig,
  profileAppConfig
];

const routes = [
  ...FuseUtils.generateRoutesFromConfigs(routeConfigs, settingsConfig.defaultAuth),
  {
    path: '/',
    element: <Navigate to="/profile" />,
    auth: settingsConfig.defaultAuth,
  },
  {
    path: 'loading',
    element: <FuseLoading />,
  },
  {
    path: '404',
    element: <Error404Page />,
  },
  {
    path: '*',
    element: <Navigate to="404" />,
  },
];

export default routes;
