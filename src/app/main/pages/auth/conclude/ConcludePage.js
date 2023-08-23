import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import Button from '@mui/material/Button';
import { useDispatch, useSelector } from 'react-redux';
import { useContext, useState } from 'react';
import Typography from '@mui/material/Typography';
import { Link } from 'react-router-dom';
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
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';




const steps = ['', ''];
const schema = yup.object().shape({
    password: yup
        .string()
        .required('Digite sua senha'),
    passwordConfirm: yup.string().oneOf([yup.ref('password'), null], 'As senhas devem ser iguais'),
});

const defaultValues = {
    permitCode: '',
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
    const [info, setInfo] = useState({})
    const [isInviteInfoCalled, setIsInviteInfoCalled] = useState(false);
    const { handleInvite, handleRegister } = useContext(AuthContext)
    const useStyles = makeStyles(() => ({
        root: {

            "& .muiltr-1k3l4nl-MuiSvgIcon-root-MuiStepIcon-root.Mui-active": { color: "#0DB1E3" },
            "& .muiltr-1k3l4nl-MuiSvgIcon-root-MuiStepIcon-root.Mui-completed": { color: "#0DB1E3" },
            "& .muiltr-1d3z3hw-MuiOutlinedInput-notchedOutline": { background: "#f5f5f5" },
            "& .muiltr-1soyadh-MuiInputBase-input-MuiOutlinedInput-input.Mui-disabled": { zIndex: "1", color: '#5a5a5a', "-webkit-text-fill-color": "#5a5a5a !important", },


        },
    }));
    const c = useStyles()
    const { control, formState, handleSubmit, setError, clearErrors, getValues, setValue } = useForm({
        mode: 'onChange',
        defaultValues,
        resolver: yupResolver(schema),
    })

    const { isValid, dirtyFields, errors,  } = formState;

    function inviteInfo(hash){
    handleInvite(hash) 
        .then((response) => {
            if (response.status === 200){
                setInfo(response.data)
                setIsInviteInfoCalled(true);

            }
        })
        .catch((_error)=> {
        })
    }
    if (hash && !isInviteInfoCalled) {
        inviteInfo(hash);
    }
    
    function onSubmit({ permitCode, password, email }) {
        handleRegister(hash, permitCode, password, email)
    }

    const isStepSkipped = (step) => {
        return skipped.has(step);
    };

    const handleNext = (e) => {
        e.preventDefault();
        setValue('permitCode', info.permitCode)
            if (activeStep === 0) {
                dispatch(setActiveStep(activeStep + 1));
            } else {
                if(isValid){
                    dispatch(setActiveStep(activeStep + 1));
                    dispatch(setButtonType('submit'));
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


    const handleBack = () => {
        dispatch(setActiveStep(activeStep - 1));
        clearErrors('cpfCnpjDoesNotMatch')
        clearErrors('invalidCpfCnpj')
        clearErrors('licenseeProfileNotFOund')


    };

    const renderFields = (email, permitCode) => {
        if (email && permitCode) {
        switch (activeStep) {
            case 0:
                    return (
                    <>
                        <StepOne
                            customClass={c.root}
                            type="name"
                            label="Código de permissão"
                            name="permitCode"
                            control={control}
                            value={permitCode}
                        />
                        <StepOne
                            customClass={c.root}
                            type="email"
                            label="E-mail"
                            name="email"
                            control={control}
                            value={email}
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
        } 
    };

    if (isInviteInfoCalled){
       return (
    
           <div className="flex flex-col sm:flex-row items-center md:items-start sm:justify-center md:justify-start flex-1 min-w-0">
               <Paper className="h-full sm:h-auto md:flex md:items-center md:justify-end w-full sm:w-auto md:h-full md:w-1/2 py-8 px-16 sm:p-48 md:p-64 sm:rounded-2xl md:rounded-none sm:shadow md:shadow-none ltr:border-r-1 rtl:border-l-1 relative">
                   <div className="w-full max-w-320 sm:w-320 mx-auto sm:mx-0">
                       <Typography className="mt-48 text-4xl font-extrabold tracking-tight leading-tight">
                           <img src="assets/icons/logoPrefeitura.png" width="155" className='mb-10' alt='logo CCT' />
                           {activeStep == '1' ? <> Crie sua senha </> : <> Registre-se</>}
                       </Typography>
                       {activeStep === steps.length ? <>
                           <Box className="flex flex-col items-center mt-40">
                               <img src='assets/icons/check.svg' alt='confirmado' />
                               <h2 className='text-center'> Obrigado por finalizar seu cadastro! Logo iremos te redirecionar, se não acontecer nada <Link to='/'>clique aqui</Link></h2>
                           </Box>

                       </> : <>
                           <div className="items-baseline mt-10 font-medium">
                               <Typography>Olá, {info.fullName}.<br></br> Confirme seus dados abaixo! Se por acaso estiverem incorretos
                                       <Link className="ml-4" to="https://secretariamunicipaldetransportes.movidesk.com/form/6594/">
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

                               {renderFields(info.email, info.permitCode)}

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
                                   className="w-full z-10"
                                   aria-label="Register"
                                   type={buttonType}
                                   size="large"
                                   onClick={handleNext}
                               >
                                   {activeStep === steps.length || activeStep > steps.length ? 'Criar conta' : 'Avançar'}
                               </Button>
                           </form></>}


                   </div>
                   <svg
                       className="absolute inset-0 pointer-events-none md:hidden z-0"
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
   } else {
    return (
        <div className="flex flex-col sm:flex-row items-center md:items-start sm:justify-center md:justify-start flex-1 min-w-0">
            <Paper className="h-full sm:h-auto md:flex md:items-center md:justify-end w-full sm:w-auto md:h-full md:w-1/2 py-8 px-16 sm:p-48 md:p-64 sm:rounded-2xl md:rounded-none sm:shadow md:shadow-none ltr:border-r-1 rtl:border-l-1 relative">
                <div className="w-full max-w-320 sm:w-320 mx-auto sm:mx-0">
                    <Typography className="mt-48 text-4xl font-extrabold tracking-tight leading-tight">
                        <img src="assets/icons/logoPrefeitura.png" width="155" className='mb-10' alt='logo CCT' />
                    </Typography>
                   
                        <Box className="flex flex-col items-center mt-40">
                        <FuseSvgIcon className="text-48" size={48} color="action">material-outline:link_off</FuseSvgIcon>
                        <h2 className='text-center'> Aparentemente esse link já expirou para que<br></br>  possamos te ajudar <Link to='/sign-in'>clique aqui</Link></h2>
                        </Box>

                </div>
                <svg
                    className="absolute inset-0 pointer-events-none md:hidden z-0"
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
    )
   }
}



export default ConcludePage;