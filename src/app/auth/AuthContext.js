import { useEffect, useState, createContext } from 'react';
import { useDispatch } from 'react-redux';
import FuseSplashScreen from '@fuse/core/FuseSplashScreen';
import { showMessage } from 'app/store/fuse/messageSlice';
import { logoutUser, setUser } from 'app/store/userSlice';
import jwtServiceConfig from './services/jwtService/jwtServiceConfig';
import jwtService from './services/jwtService';
import { api } from 'app/configs/api/api';
import { redirect } from 'react-router-dom';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  
  const [isAuthenticated, setIsAuthenticated] = useState(undefined);
  const [validPermitCode, setValidPermitCode] = useState(false)
  const [waitAuthCheck, setWaitAuthCheck] = useState(true);
  const dispatch = useDispatch();
  

  useEffect(() => {
    jwtService.on('onAutoLogin', () => {
      dispatch(showMessage({ message: 'Bem-vindo de volta!' }));

      /**
       * Sign in and retrieve user data with stored token
       */
      jwtService
        .signInWithToken()
        .then((user) => {
          success(user, 'Bem-vindo de volta!');
        })
        .catch((error) => {
          pass(error.message);
        });
    });

    jwtService.on('onLogin', (user) => {
      success(user, 'Bem-vindo!');
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
    return new Promise((resolve, reject) => {
      api
        .post(jwtServiceConfig.forgotPassword, {
          email,
        })
        .then((response) => {
          if (response) {
            dispatch(showMessage({ message: 'E-mail enviado!' }));
            resolve(response)
          }
        })
        .catch((error) => {
          reject(error)
          dispatch(showMessage({ message: 'Houve um erro com o envio.' }));
        });
    });
  }
  function resetPasswordFunction(password, hash) {
    return new Promise((resolve, reject) => {
      api
        .post(jwtServiceConfig.resetPassword, {
          password,
          hash,
        })
        .then((response) => {
          if (response) {
            resolve(response)
            dispatch(showMessage({ message: 'Senha redefinida com sucesso!' }));
          
          }
        })
        .catch((error) => {
          reject(error)
          dispatch(showMessage({ message: 'Houve um problema, tente novamente mais tarde!' }));
        });
    });
  }
  function handlePreRegister(licensee, cpfCnpj){
    return new Promise((resolve, reject) => {
      api.post(jwtServiceConfig.preRegister, {
        licensee,
        cpfCnpj
      })
      .then((response) => {
        if(response){
          setValidPermitCode(true)
          resolve(response)
        }
      })
      .catch((error) => {
        dispatch(showMessage({ message: 'Houve um problema, tente novamente mais tarde!' }));
        reject(error.response.data.errors)
        
      })
    })
  }
  function handleRegister(hash,permitCode, password){
    return new Promise((resolve, reject) => {
      api.post(`auth/licensee/register/${hash}`, {
        password,
        permitCode
      })
        .then((response) => {
          if (response) {
            setTimeout(() => {
              jwtService
                .signInWithPermitCodeAndPasswrod(permitCode, password)
                .then(() => {
                  redirect('/')
                })
            }, 3000)
            resolve(response)
          }
        })
        .catch((error) => {
          reject(error.response.data.errors)
          if(error.response.data.errors.email == 'emailAlreadyExists'){
            dispatch(showMessage({ message: 'Esse e-mail já está sendo usado' }));
          }
          
          

        })
    })
  } 
  function handleInvite(hash){
    return new Promise((resolve, reject) => {
      api.post(`auth/licensee/invite/${hash}`)
        .then((response) => {
          if (response) {
            resolve(response)
          }
        })
        .catch((error) => {
          reject(error)
        })
    })

  }
  function patchInfo(info){
    const token = window.localStorage.getItem('jwt_access_token');
    return new Promise((resolve, reject) => {
      api.patch(jwtServiceConfig.userInfo, 
       info, {
          headers: { "Authorization": `Bearer ${token}` },
        }
      )
        .then((response) => {
          resolve(response.data)
        })
        .catch((error) => {
          reject(error.response.data.errors)
        })

    })
  }

  return waitAuthCheck ? (
    <FuseSplashScreen />
  ) : (
    <AuthContext.Provider
      value={{ isAuthenticated, forgotPasswordFunction, resetPasswordFunction, handlePreRegister, validPermitCode, handleRegister, handleInvite, patchInfo }}
    >
      {children}
    </AuthContext.Provider>
  );
}
