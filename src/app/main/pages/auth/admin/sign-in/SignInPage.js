import { yupResolver } from '@hookform/resolvers/yup';
import { Controller, useForm } from 'react-hook-form';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { Link, redirect } from 'react-router-dom';
import * as yup from 'yup';
import _ from '@lodash';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import jwtService from 'src/app/auth/services/jwtService';
import { useState } from 'react';

/**
 * Form Validation Schema
 */

const schema = yup.object().shape({
    email: yup.string().required('Insira seu código de permissão'),
    password: yup.string().required('Por favor insira sua senha.').min(4, 'Senha muito curta'),
});

const defaultValues = {
    email: '',
    password: '',
};


function SignInPage() {
    const [sent, setSent] = useState(false)
    const { control, formState, handleSubmit, setError, setValue } = useForm({
        mode: 'onChange',
        defaultValues,
        resolver: yupResolver(schema),
    });

    const { isValid, dirtyFields, errors } = formState;

    function onSubmit({ email, password }) {
        jwtService
            .adminSignIn(email, password)
            .then((response) => {
            })
            .catch((_errors) => {
                setError('password', {
                    message: 'Senha ou e-mail incorretos',
                });
            });
    }

    return (
        <div className="flex flex-col sm:flex-row items-center justify-center md:items-start sm:justify-center md:justify-start flex-1 min-w-0">
            <Paper className="h-full sm:h-auto flex items-center md:flex md:items-center md:justify-end w-full sm:w-auto md:h-full md:w-1/2 py-8 px-16 sm:p-48 md:p-64 sm:rounded-2xl md:rounded-none sm:shadow md:shadow-none ltr:border-r-1 rtl:border-l-1 relative">
        
                <div className="w-full max-w-320 h-5/6 md:h-1/2  sm:w-320 mx-auto sm:mx-0">
                    <Typography className="mt-48 text-4xl font-extrabold tracking-tight leading-tight">
                        <img src="assets/icons/logoPrefeitura.png" width="155" className='mb-10' alt='logo CCT' />
                        {sent ? "Enviado com sucesso!" : "Login de Administrador"}

                      
                    </Typography>
                    <Box className="bg-red-700 text-white p-10 rounded-8 w-[40%]">
                        HOMOLOGAÇÃO
                    </Box>
                    
                    {sent ? <><Box>Foi enviado um email para que você possa prosseguir com seu login!</Box> <Link className='underline' to={link}>Link que seria enviado para email</Link></>: 
                    <form
                        name="loginForm"
                        noValidate
                        className="flex flex-col justify-center w-full mt-10"
                        onSubmit={handleSubmit(onSubmit)}
                    >
                        <Controller
                            name="email"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    className="mb-24"
                                    label="E-mail"
                                    autoFocus
                                    type="string"
                                    error={!!errors.email}
                                    helperText={errors?.email?.message}
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
                        <Box className="flex justify-end">
                                <Link className="text-md font-medium" to="/forgot-password">
                                    Esqueceu sua senha?
                                </Link>
                        </Box>
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
                    </form>}
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

export default SignInPage;
