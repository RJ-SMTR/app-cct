import { yupResolver } from '@hookform/resolvers/yup';
import { Controller, useForm } from 'react-hook-form';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import * as yup from 'yup';
import _ from '@lodash';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { useContext } from 'react';
import { AuthContext } from 'src/app/auth/AuthContext';
import {  useNavigate, useParams } from 'react-router-dom'

const getCharacterValidationError = (str) => {
  return `Sua senha deve conter 1 ${str}`;
};

const schema = yup.object().shape({
  password: yup
    .string()
    .required('Por favor digite a nova senha.')
    .min(8, 'Senha muito curta - mínimo 8 caracteres.')
    .matches(/[0-9]/, getCharacterValidationError('número'))
    .matches(/[a-z]/, getCharacterValidationError('letra minúscula'))
    .matches(/[A-Z]/, getCharacterValidationError('letra maiúscula')),
  passwordConfirm: yup.string().oneOf([yup.ref('password'), null], 'As senhas não batem'),
});

function ResetPassword() {
  const navigate = useNavigate()
  let { hash } = useParams();
  const { resetPasswordFunction } = useContext(AuthContext);
  const { control, formState, handleSubmit } = useForm({
    mode: 'onChange',
    resolver: yupResolver(schema),
  });

  const { isValid, dirtyFields, errors } = formState;

  function onSubmit( password ) {
    resetPasswordFunction(password.passwordConfirm, hash)
      .then( setTimeout(() => {
             return navigate('/sign-in')
            }, 3000))
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center md:items-start sm:justify-center md:justify-start flex-1 min-w-0">
      <Paper className="h-full sm:h-auto flex items-center md:flex md:items-center md:justify-end w-full sm:w-auto md:h-full md:w-1/2 py-8 px-16 sm:p-48 md:p-64 sm:rounded-2xl md:rounded-none sm:shadow md:shadow-none ltr:border-r-1 rtl:border-l-1 relative">
        <div className="w-full max-w-320 h-5/6 md:h-1/2  sm:w-320 mx-auto sm:mx-0">
          <Typography className="mt-32 text-4xl font-extrabold tracking-tight leading-tight">
            Recuperação de senha
          </Typography>
          <div className="flex flex-col items-baseline mt-2 font-medium">
            <Typography>Digite sua nova senha!
            </Typography>
            <Typography> Ela deve conter: 
              <ul>
                <li>- 8 caracteres</li>
                <li>- Uma letra minúscula</li>
                <li>- Uma letra maiúscula</li>
              </ul>
            </Typography>
            
          </div>

          <form
            name="loginForm"
            noValidate
            className="flex flex-col justify-center w-full mt-16"
            onSubmit={handleSubmit(onSubmit)}
          >
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  className="mb-24"
                  label="Senha"
                  autoFocus
                  type="password"
                  error={!!errors.password}
                  helperText={errors?.password?.message}
                  variant="outlined"
                  required
                  fullWidth
                />
              )}
            />
            <Controller
              name="passwordConfirm"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  className="mb-24"
                  label="Confirmação da senha"
                  autoFocus
                  type="password"
                  error={!!errors.passwordConfirm}
                  helperText={errors?.passwordConfirm?.message}
                  variant="outlined"
                  required
                  fullWidth
                />
              )}
            />

            <Button
              variant="contained"
              color="secondary"
              className=" w-full mt-16 z-10"
              aria-label="Sign in"
              disabled={_.isEmpty(dirtyFields) || !isValid}
              type="submit"
              size="large"
            >
              Enviar
            </Button>
          </form>
        </div>
        <svg
          className="absolute inset-0 pointer-events-none md:hidden"
          viewBox="0 0 960 540"
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMax slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <Box
            component="g"
            sx={{ color: 'primary.light' }}
            className="opacity-20"
            fill="none"
            stroke="currentColor"
            strokeWidth="100"
          >
            <circle r="234" cx="720" cy="491" />
          </Box>
        </svg>
      </Paper>

      <Box className="relative hidden md:flex flex-auto items-center justify-center h-screen  overflow-hidden ">
        <img src="assets/images/etc/BRT.jpg" className="w-full" alt="BRT" />
      </Box>
    </div>
  );
}

export default ResetPassword;
