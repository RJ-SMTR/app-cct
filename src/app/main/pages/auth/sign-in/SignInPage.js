import { yupResolver } from '@hookform/resolvers/yup';
import { Controller, useForm } from 'react-hook-form';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { Link } from 'react-router-dom';
import * as yup from 'yup';
import _ from '@lodash';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import jwtService from '../../../../auth/services/jwtService';

/**
 * Form Validation Schema
 */

const schema = yup.object().shape({
  permitCode: yup.string().required('Insira seu código de permissão'),
  password: yup.string().required('Por favor insira sua senha.').min(4, 'Senha muito curta'),
});

const defaultValues = {
  permitCode: '',
  password: '',
  remember: true,
};

function SignInPage() {
  const isHmg = window.location.href.includes("hmg")
  const { control, formState, handleSubmit, setError, setValue } = useForm({
    mode: 'onChange',
    defaultValues,
    resolver: yupResolver(schema),
  });

  const { isValid, dirtyFields, errors } = formState;

  function onSubmit({ permitCode, password }) {
    jwtService
      .signInWithPermitCodeAndPasswrod(permitCode, password)
      .then((user) => { })
      .catch((_errors) => {
        setError('password', {
          message: 'Senha ou código de permissionário incorretos',
        });
      });
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center md:items-start sm:justify-center md:justify-start flex-1 min-w-0">
      <Paper className="h-full sm:h-auto flex items-center md:flex md:items-center md:justify-end w-full sm:w-auto md:h-full md:w-1/2 py-8 px-16 sm:p-48 md:p-64 sm:rounded-2xl md:rounded-none sm:shadow md:shadow-none ltr:border-r-1 rtl:border-l-1 relative">
        <div className="w-full max-w-320 h-5/6 md:h-1/2  sm:w-320 mx-auto sm:mx-0">
          <Typography className="mt-48 text-4xl font-extrabold tracking-tight leading-tight">
            <img src="assets/icons/logoPrefeitura.png" width="155" className='mb-10' alt='logo CCT' />
            Login
          </Typography>

          <div className="flex items-baseline mt-2 font-medium">
            <Typography>Não foi registrado?</Typography>
            <Link className="ml-4" to="https://transportes.prefeitura.rio/atendimentodigital/">
              <span className='underline'> fale conosco!</span>
            </Link>
          </div>
          {isHmg && (
            <Box className="mt-10 bg-red-500 uppercase text-white text-center p-10 rounded-4 text-xl">
              Homologação
            </Box>
          )}


          <form
            name="loginForm"
            noValidate
            className="flex flex-col justify-center w-full mt-32"
            onSubmit={handleSubmit(onSubmit)}
          >
            <Controller
              name="permitCode"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  className="mb-24"
                  label="Código de Permissão"
                  autoFocus
                  type="string"
                  error={!!errors.permitCodeNotExists}
                  helperText={errors?.permitCodeNotExists?.message}
                  variant="outlined"
                  required
                  fullWidth
                />
              )}
            />

            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  className="mb-24"
                  label="Senha"
                  type="password"
                  error={!!errors.password}
                  helperText={errors?.password?.message}
                  variant="outlined"
                  required
                  fullWidth
                />
              )}
            />

            <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between">
              <Controller
                name="remember"
                control={control}
                render={({ field }) => (
                  <FormControl>
                    <FormControlLabel
                      label="Manter conectado"
                      control={<Checkbox size="small" {...field} />}
                    />
                  </FormControl>
                )}
              />

              <Link className="text-md font-medium" to="/forgot-password">
                Esqueceu sua senha?
              </Link>
            </div>

            <Button
              variant="contained"
              color="secondary"
              className=" w-full mt-16 z-10"
              aria-label="Sign in"
              disabled={_.isEmpty(dirtyFields) || !isValid}
              type="submit"
              size="large"
            >
              Fazer login
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

      <Box className="relative hidden md:flex flex-auto items-center justify-center h-screen overflow-hidden max-w-[55vw]">
        <img src="assets/images/etc/kombi.jpg" className="h-full w-full object-fill" alt="Kombis CCT" />
      </Box>
    </div>
  );
}

export default SignInPage;
