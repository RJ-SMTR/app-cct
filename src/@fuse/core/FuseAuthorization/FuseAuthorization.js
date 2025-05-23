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

    const matchedRoutes = matchRoutes(state.routes, pathname);
    const matchedPath = matchPath({ path: '/conclude-registration/:hash' }, pathname);

    const matched = matchedRoutes ? matchedRoutes[0] : false;

    const userHasPermission = FuseUtils.hasPermission(matched.route.auth, userRole);

    const ignoredPaths = ['/', '/callback', '/sign-in', '/sign-out', '/logout', '/404', matchedPath?.pathname, '/forgot-password'];

    if (pathname === "/financeiro/sign-in" || pathname === "/admin/sign-in" || pathname === "/sign-in") {
      localStorage.setItem('loginUrl', pathname);
    }

    if (matched && !userHasPermission && !ignoredPaths.includes(pathname)) {
      switch (pathname) {
        case "/financeiro/sign-in":
          setSessionRedirectUrl("/lancamentos");
          break;
        case "/admin/sign-in":
          setSessionRedirectUrl("/admin");
          break;
        default:
          setSessionRedirectUrl("/profile");
      }
    }

    return {
      accessGranted: matched ? userHasPermission : true,
    };
  }

  redirectRoute() {
    const { userRole } = this.props;
    const redirectUrl = getSessionRedirectUrl() || this.props.loginRedirectUrl;
    const lastUserRole = this.state.lastUserRole;

    const savedLoginUrl = localStorage.getItem('loginUrl');

    if (!userRole || userRole.length === 0) {
      switch (lastUserRole) {
        case 'Admin Master':
        case 'Lançador financeiro':
        case 'Aprovador financeiro':
        case 'Admin Finan':
          setTimeout(() => history.push(savedLoginUrl || '/financeiro/sign-in'), 0);
          break;
        case 'Admin':
          setTimeout(() => history.push(savedLoginUrl || '/admin/sign-in'), 0);
          break;
        default:
          setTimeout(() => history.push(savedLoginUrl || '/sign-in'), 0);
      }
    } else {
      setTimeout(() => history.push(redirectUrl), 0);
      this.setState({ lastUserRole: userRole });

      resetSessionRedirectUrl();
    }
  }

  render() {
    return this.state.accessGranted ? this.props.children : null;
  }
}



FuseAuthorization.contextType = AppContext;

export default withRouter(FuseAuthorization);
