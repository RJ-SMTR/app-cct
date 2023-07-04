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
  const [validPermissionCode, setValidPermissionCode] = useState(false)
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
      axios
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
            resolve(response)
            dispatch(showMessage({ message: 'Senha redefinida com sucesso!' }));
          }
        })
        .catch((error) => {
          dispatch(showMessage({ message: 'Houve um problema, tente novamente mais tarde!' }));
        });
    });
  }
  function handlePreRegister(licensee, cpfCnpj){
    return new Promise((resolve, reject) => {
      axios.post(jwtServiceConfig.preRegister, {
        licensee,
        cpfCnpj
      })
      .then((response) => {
        if(response){
          setValidPermissionCode(true)
          resolve(response)
        }
      })
      .catch((error) => {
        reject(error.response.data.errors)
        
      })
    })
  }
  function handleRegister(email, password, cpf, permissionCode, cellphone){
    return new Promise((resolve, reject) => {
      axios.post(jwtServiceConfig.register, {
        email,
        password,
        cpf,
        cellphone, 
        permissionCode,
        // ACHO Q AINDA TÃO COMO NECESSÁRIOS ENTÃO FIZ SÓ PRA PODER ENVIAR 
        firstName: "firstName should not be empty",
        lastName: "lastName should not be empty",
        fullName: "fullName should not be empty",
        agency: "2134",
        bankAccount: "1231231",
        bankAccountDigit: "1"
      })
        .then((response) => {
          if (response) {
            setValidPermissionCode(true)
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
  function confirmEmail(hash){
    return new Promise((resolve, reject) => {
      axios.post(jwtServiceConfig.confirm, {
        hash,
      })
        .then((response) => {
          if (response) {
            resolve(response)
          }
        })
        .catch((error) => {
          console.log("erroerror")
          

        })
    })

  }

  return waitAuthCheck ? (
    <FuseSplashScreen />
  ) : (
    <AuthContext.Provider
      value={{ isAuthenticated, forgotPasswordFunction, resetPasswordFunction, handlePreRegister, validPermissionCode, handleRegister, confirmEmail }}
    >
      {children}
    </AuthContext.Provider>
  );
}
