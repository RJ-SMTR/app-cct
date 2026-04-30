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
import HomeConifg from '../main/pages/home/HomeConfig';
import profileAppConfig from '../main/pages/profile/profileAppConfig';
import ExtractConfig from '../main/pages/extract/ExtractConfig';
import AdminSignIn from '../main/pages/auth/admin/sign-in/SignInConfig';
import FinanSignInConfig from '../main/pages/auth/finan/SignInConfig';
import AdminConfig from '../main/pages/admin/AdminConfig';
import ForbiddenConfig from '../main/pages/errors/401/ForbiddenConfig';
import AdminUserConfig from '../main/pages/admin/UserAnalysis/UserConfig';
import UploadConfig from '../main/pages/admin/Upload/UploadConfig';
import TriggerConfig from '../main/pages/admin/TriggerEmail/TriggerConfig';
import FinanReleaseConfig from '../main/pages/admin/FinanRelease/FinanReleaseConfig';
import ApprovalConfig from '../main/pages/admin/Approval/ApprovalConfig';
import FinanEditConfig from '../main/pages/admin/FinanRelease/FinanEdit/FinanEditConfig';
import StatementsConfig from '../main/pages/admin/Statements/StatementsConfig';
import ReportConfig from '../main/pages/admin/Report/ReportConfig';
import ReportReleaseConfig from '../main/pages/admin/ReportRelease/ReportReleaseConfig';
import ReportVanzeiroConfig from '../main/pages/report/reportConfig';
import RemessaConfig from '../main/pages/admin/Remessa/RemessaConfig';
const routeConfigs = [
  // HomeConifg,
  SignOutConfig,
  SignInConfig,
  ForgotPasswordConfig,
  ResetPasswordConfig,
  ConcludeConfig,
  profileAppConfig,
  RemessaConfig,
  ExtractConfig,
  // ResumeConfig,
  AdminSignIn,
  AdminConfig,
  ForbiddenConfig,
  AdminUserConfig,
  UploadConfig,
  TriggerConfig,
  FinanReleaseConfig,
  ApprovalConfig,
  FinanSignInConfig,
  FinanEditConfig,
  StatementsConfig,
  ReportVanzeiroConfig,
  ReportConfig,
  ReportReleaseConfig
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
