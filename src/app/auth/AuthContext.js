import { useEffect, useState, createContext } from 'react';
import { useDispatch } from 'react-redux';
import FuseSplashScreen from '@fuse/core/FuseSplashScreen';
import { showMessage } from 'app/store/fuse/messageSlice';
import { logoutUser, setUser } from 'app/store/userSlice';
import axios from 'axios';
import jwtServiceConfig from './services/jwtService/jwtServiceConfig';
import jwtService from './services/jwtService';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(undefined);
  const [waitAuthCheck, setWaitAuthCheck] = useState(true);
  const dispatch = useDispatch();

  useEffect(() => {
    jwtService.on('onAutoLogin', () => {
      dispatch(showMessage({ message: 'Signing in with JWT' }));

      /**
       * Sign in and retrieve user data with stored token
       */
      jwtService
        .signInWithToken()
        .then((user) => {
          success(user, 'Signed in with JWT');
        })
        .catch((error) => {
          pass(error.message);
        });
    });

    jwtService.on('onLogin', (user) => {
      success(user, 'Signed in');
    });

    jwtService.on('onLogout', () => {
      pass('Signed out');

      dispatch(logoutUser());
    });

    jwtService.on('onAutoLogout', (message) => {
      pass(message);

      dispatch(logoutUser());
    });

    jwtService.on('onNoAccessToken', () => {
      pass();
    });

    jwtService.init();

    function success(user, message) {
      if (message) {
        dispatch(showMessage({ message }));
      }

      Promise.all([
        dispatch(setUser(user)),
        // You can receive data in here before app initialization
      ]).then((values) => {
        setWaitAuthCheck(false);
        setIsAuthenticated(true);
      });
    }

    function pass(message) {
      if (message) {
        dispatch(showMessage({ message }));
      }

      setWaitAuthCheck(false);
      setIsAuthenticated(false);
    }
  }, [dispatch]);

  // CUSTOM FUNCTIONS
  function forgotPasswordFunction(email) {
    return new Promise((reject) => {
      axios
        .post(jwtServiceConfig.forgotPassword, {
          email,
        })
        .then((response) => {
          if (response) {
            dispatch(showMessage({ message: 'E-mail enviado!' }));
          }
        })
        .catch((error) => {
          dispatch(showMessage({ message: 'Houve um erro com o envio.' }));
        });
    });
  }
  function resetPasswordFunction(password, hash) {
    return new Promise((reject) => {
      axios
        .post(jwtServiceConfig.resetPassword, {
          password,
          hash,
        })
        .then((response) => {
          if (response) {
            dispatch(showMessage({ message: 'Senha redefinida com sucesso!' }));
          }
        })
        .catch((error) => {
          dispatch(showMessage({ message: 'Houve um problema, tente novamente mais tarde!' }));
        });
    });
  }

  return waitAuthCheck ? (
    <FuseSplashScreen />
  ) : (
    <AuthContext.Provider
      value={{ isAuthenticated, forgotPasswordFunction, resetPasswordFunction }}
    >
      {children}
    </AuthContext.Provider>
  );
}
