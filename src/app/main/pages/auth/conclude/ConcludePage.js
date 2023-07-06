import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import Button from '@mui/material/Button';
import { useDispatch, useSelector } from 'react-redux';
import { useContext, useState } from 'react';
import Typography from '@mui/material/Typography';
import { Link, useNavigate } from 'react-router-dom';
import * as yup from 'yup';
import _ from '@lodash';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { StepOne, StepTwo } from '../formFields/FormFields';
import { makeStyles } from '@mui/styles';
import { AuthContext } from 'src/app/auth/AuthContext';
import { setActiveStep, setButtonType } from 'app/store/formStepSlice';
import { useParams } from 'react-router-dom'




const steps = ['', ''];
const schema = yup.object().shape({
    permissionCode: yup.string().required('You must enter display name'),
    password: yup
        .string()
        .required('Digite sua senha'),
    passwordConfirm: yup.string().oneOf([yup.ref('password'), null], 'As senhas devem ser iguais'),
});

const defaultValues = {
    permissionCode: '',
    password: '',
    passwordConfirm: '',
};

function ConcludePage() {
    // FAZER ALGO COM O HASH
    let { hash } = useParams();
    const dispatch = useDispatch();
    const activeStep = useSelector((state) => state.steps.activeStep);
    const buttonType = useSelector((state) => state.steps.buttonType);
    const [skipped, setSkipped] = useState(new Set());
    const { handlePreRegister, handleRegister } = useContext(AuthContext)
    const useStyles = makeStyles(() => ({
        root: {

            "& .muiltr-1k3l4nl-MuiSvgIcon-root-MuiStepIcon-root.Mui-active": { color: "#0DB1E3" },
            "& .muiltr-1k3l4nl-MuiSvgIcon-root-MuiStepIcon-root.Mui-completed": { color: "#0DB1E3" },
        },
    }));
    const c = useStyles()
    const { control, formState, handleSubmit, getValues, setError, clearErrors } = useForm({
        mode: 'onChange',
        defaultValues,
        resolver: yupResolver(schema),
    });

    const { isValid, dirtyFields, errors } = formState;

    function onSubmit({
        permissionCode,
        password,
    }) {
        handleRegister( password, permissionCode)
            .then((response) => {
                if (response.status === 200) {
                    navigate('/email-sent')
                }
            })
            .catch((_errors) => {
                console.log(_errors)
            })

    }

    const isStepSkipped = (step) => {
        return skipped.has(step);
    };

    const handleNext = (e) => {
        e.preventDefault();
        const values = getValues()
        const { permissionCode, CPF} = values;

        if (permissionCode) {
            if (activeStep === 0) {
                console.log('click')
                
                dispatch(setActiveStep(activeStep + 1));
                handlePreRegister(permissionCode)
                .then((response) => {
                        // setName(response.data.name)
                    })
                    .catch((_errors) => {
                        console.log(_errors)
                        if (_errors.licensee) {
                            setError(_errors.licensee, {
                                message: 'Código de Permissionário não encontrado',
                            });
                        } else if (_errors.cpfCnpj) {
                            if (_errors.cpfCnpj == 'invalidCpfCnpj') {
                                setError(_errors.cpfCnpj, {
                                    message: 'CPF/CNPJ inválido'
                                })
                            } else if (_errors.cpfCnpj == 'cpfCnpjDoesNotMatch') {
                                setError(_errors.cpfCnpj, {
                                    message: 'CPF/CNPJ não corresponde com o nosso sistema',
                                });
                            }

                        }
                    })
            } else if (activeStep === steps.length - 1) {
                if(isValid){
                    dispatch(setButtonType('submit'));
                    dispatch(setActiveStep(activeStep + 1));
                    handleSubmit(onSubmit)()
                } else {
                    setError('password', {
                        type: 'manual',
                        message: 'Digite sua senha',
                    })
                    setError('passwordConfirm', {
                        type: 'manual',
                        message: 'Confirme sua senha',
                    })
                }
            } 

        }
    }

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
        dispatch(setActiveStep(activeStep - 1));
        clearErrors('cpfCnpjDoesNotMatch')
        clearErrors('invalidCpfCnpj')
        clearErrors('licenseeProfileNotFOund')


    };

    const renderFields = () => {
        switch (activeStep) {
            case 0:
                return (
                    <>
                        <StepOne
                            type="name"
                            label="Código de permissão"
                            name="permissionCode"
                            control={control}
                            values={errors.licenseeProfileNotFound}
                        />
                    </>
                );
            case 1:
                return (
                    <>
                        <StepTwo
                            type="password"
                            label="Senha"
                            name="password"
                            control={control}
                            values={errors.password}
                        />
                        <StepTwo
                            type="password"
                            label="Confirmação da senha"
                            name="passwordConfirm"
                            control={control}
                            values={errors.passwordConfirm}
                        />
                    </>
                );
            default:
                return (
                    <>
                    </>
                  
                );
        }
    };

    return (
        <div className="flex flex-col sm:flex-row items-center md:items-start sm:justify-center md:justify-start flex-1 min-w-0">
            <Paper className="h-full sm:h-auto md:flex md:items-center md:justify-end w-full sm:w-auto md:h-full md:w-1/2 py-8 px-16 sm:p-48 md:p-64 sm:rounded-2xl md:rounded-none sm:shadow md:shadow-none ltr:border-r-1 rtl:border-l-1 relative">
                <div className="w-full max-w-320 sm:w-320 mx-auto sm:mx-0">
                    <Typography className="mt-48 text-4xl font-extrabold tracking-tight leading-tight">
                        <img src="assets/icons/logo.svg" className='mb-10' alt='logo CCT' />
                        Registre-se
                    </Typography>
                    {activeStep === steps.length ? <>
                      <Box className="flex flex-col items-center mt-40">
                        <img src='assets/icons/check.svg' alt='confirmado' />
                        <h1 className='text-center'> Obrigado por finalizar seu cadastro! Logo iremos te redirecionar, se não acontecer nada <Link to='/sign-in'>clique aqui</Link></h1>
                    </Box>
                    
                    </> : <>
                        <div className="items-baseline mt-10 font-medium">
                            <Typography>Olá, Operador X.<br></br> Precisamos finalizar seu cadastro! Se por acaso esse não for seu nome
                                <Link className="ml-4" to="/support">
                                    fale conosco
                                </Link></Typography>

                        </div>

                        <form
                            name="registerForm"
                            noValidate
                            className="flex flex-col justify-center w-full mt-16"
                            onSubmit={handleSubmit(onSubmit)}
                        >
                            <Box className="my-16">
                                <Stepper activeStep={activeStep} className={c.root} >
                                    {steps.map((label, index) => {
                                        const stepProps = {};
                                        const labelProps = {};
                                        if (isStepSkipped(index)) {
                                            stepProps.completed = false;
                                        }
                                        return (
                                            <Step key={label} {...stepProps}>
                                                <StepLabel {...labelProps}>{label}</StepLabel>
                                            </Step>
                                        );
                                    })}
                                </Stepper>
                            </Box>

                            {renderFields()}

                            {/* <Controller
              name="acceptTermsConditions"
              control={control}
              render={({ field }) => (
                <FormControl className="items-center" error={!!errors.acceptTermsConditions}>
                  <FormControlLabel
                    label="I agree to the Terms of Service and Privacy Policy"
                    control={<Checkbox size="small" {...field} />}
                  />
                  <FormHelperText>{errors?.acceptTermsConditions?.message}</FormHelperText>
                </FormControl>
              )}
            />  */}

                            <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
                                <Button
                                    color="inherit"
                                    disabled={activeStep === 0}
                                    onClick={handleBack}
                                    sx={{ mr: 1 }}
                                >
                                    Voltar
                                </Button>
                            </Box>

                            <Button
                                variant="contained"
                                color="secondary"
                                className="w-full mt-24 z-10"
                                aria-label="Register"
                                disabled={_.isEmpty(dirtyFields) || activeStep === steps.length + 1}
                                type={buttonType}
                                size="large"
                                onClick={handleNext}
                            >
                                {activeStep === steps.length || activeStep > steps.length ? 'Criar conta' : 'Avançar'}
                            </Button>
                        </form></> }
               

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



export default ConcludePage;