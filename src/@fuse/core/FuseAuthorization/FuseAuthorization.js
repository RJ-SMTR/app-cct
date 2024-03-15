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
    // Verifica se a url contém conclude-registration
    const matchedPath = matchPath({path: '/conclude-registration/:hash'},pathname)

    const matched = matchedRoutes ? matchedRoutes[0] : false;

    const userHasPermission = FuseUtils.hasPermission(matched.route.auth, userRole);

    const ignoredPaths = ['/', '/callback', '/sign-in', '/sign-out', '/logout', '/404', matchedPath?.pathname, '/forgot-password'];

    if (matched && !userHasPermission && !ignoredPaths.includes(pathname) ) {
      switch (userRole) {
        case "Lançador financeiro":
        case "Aprovador financeiro":
        case "Admin Finan":
          setSessionRedirectUrl("/lancamentos");
          break;
        case "User":
          setSessionRedirectUrl("/");
          break;
        default:
          setSessionRedirectUrl("/admin");
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
    if (!userRole || userRole.length === 0) {
      if (lastUserRole !== 'User' && lastUserRole !== 'Admin'){
        setTimeout(() => history.push('/financeiro/sign-in'), 0);
      } else if (lastUserRole !== 'User'){
        setTimeout(() => history.push('/admin/sign-in'), 0);
      } else{
        setTimeout(() => history.push('/sign-in'), 0);
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
