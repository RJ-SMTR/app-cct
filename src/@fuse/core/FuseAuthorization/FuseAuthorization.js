import FuseUtils from '@fuse/utils';
import AppContext from 'app/AppContext';
import { Component } from 'react';
import { matchPath, matchRoutes } from 'react-router-dom';
import withRouter from '@fuse/core/withRouter';
import history from '@history';
import {
  getSessionRedirectUrl,
  setSessionRedirectUrl,
  resetSessionRedirectUrl,
} from '@fuse/core/FuseAuthorization/sessionRedirectUrl';

const AGENTES_SIGN_IN_PATH = '/agentes/sign-in';
const ADMIN_SIGN_IN_PATH = '/admin/sign-in';
const FINANCEIRO_SIGN_IN_PATH = '/financeiro/sign-in';
const DEFAULT_SIGN_IN_PATH = '/sign-in';

function hasUserRole(userRole) {
  if (Array.isArray(userRole)) {
    return userRole.length > 0;
  }

  return Boolean(userRole);
}

class FuseAuthorization extends Component {
  constructor(props, context) {
    super(props);
    const { routes } = context;
    this.state = {
      accessGranted: true,
      routes,
      lastUserRole: null,
    };
  }

  componentDidMount() {
    if (!this.state.accessGranted) {
      this.redirectRoute();
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return nextState.accessGranted !== this.state.accessGranted;
  }

  componentDidUpdate() {
    if (!this.state.accessGranted) {
      this.redirectRoute();
    }
  }

  static getDerivedStateFromProps(props, state) {
    const { location, userRole } = props;
    const { pathname } = location;
    const isAgentesPath = pathname === '/agentes' || pathname.startsWith('/agentes/');

    const matchedRoutes = matchRoutes(state.routes, pathname);
    const matchedPath = matchPath({ path: '/conclude-registration/:hash' }, pathname);

    const matched = matchedRoutes ? matchedRoutes[0] : false;

    const userHasPermission = FuseUtils.hasPermission(matched.route.auth, userRole);

    const ignoredPaths = [
      '/',
      '/callback',
      DEFAULT_SIGN_IN_PATH,
      AGENTES_SIGN_IN_PATH,
      '/sign-out',
      '/logout',
      '/404',
      matchedPath?.pathname,
      '/forgot-password',
    ];

    if (
      pathname === FINANCEIRO_SIGN_IN_PATH ||
      pathname === ADMIN_SIGN_IN_PATH ||
      pathname === AGENTES_SIGN_IN_PATH ||
      pathname === DEFAULT_SIGN_IN_PATH
    ) {
      localStorage.setItem('loginUrl', pathname);
    }

    if (matched && !userHasPermission && !ignoredPaths.includes(pathname)) {
      switch (pathname) {
        case FINANCEIRO_SIGN_IN_PATH:
          setSessionRedirectUrl('/lancamentos');
          break;
        case ADMIN_SIGN_IN_PATH:
          setSessionRedirectUrl('/admin');
          break;
        default:
          if (isAgentesPath && !hasUserRole(userRole)) {
            setSessionRedirectUrl(pathname);
          } else {
            setSessionRedirectUrl('/profile');
          }
      }
    }

    return {
      accessGranted: matched ? userHasPermission : true,
    };
  }

  redirectRoute() {
    const { userRole } = this.props;
    const redirectUrl = getSessionRedirectUrl() || this.props.loginRedirectUrl;
    const isAgentesRedirect = redirectUrl?.startsWith('/agentes');
    const normalizedUserRole = Array.isArray(userRole) ? userRole[0] : userRole;
    const lastUserRole = Array.isArray(this.state.lastUserRole)
      ? this.state.lastUserRole[0]
      : this.state.lastUserRole;

    const savedLoginUrl = localStorage.getItem('loginUrl');

    if (!hasUserRole(userRole)) {
      if (isAgentesRedirect) {
        setTimeout(() => history.push(AGENTES_SIGN_IN_PATH), 0);
        return;
      }

      switch (lastUserRole) {
        case 'Admin Master':
        case 'Lançador financeiro':
        case 'Aprovador financeiro':
        case 'Admin Finan':
          setTimeout(() => history.push(savedLoginUrl || FINANCEIRO_SIGN_IN_PATH), 0);
          break;
        case 'Admin':
          setTimeout(() => history.push(savedLoginUrl || ADMIN_SIGN_IN_PATH), 0);
          break;
        case 'Agentes':
        case 'agentes':
          setTimeout(() => history.push(savedLoginUrl || AGENTES_SIGN_IN_PATH), 0);
          break;
        default:
          setTimeout(() => history.push(savedLoginUrl || DEFAULT_SIGN_IN_PATH), 0);
      }
    } else {
      setTimeout(() => history.push(redirectUrl), 0);
      this.setState({ lastUserRole: normalizedUserRole });

      resetSessionRedirectUrl();
    }
  }

  render() {
    return this.state.accessGranted ? this.props.children : null;
  }
}

FuseAuthorization.contextType = AppContext;

export default withRouter(FuseAuthorization);
