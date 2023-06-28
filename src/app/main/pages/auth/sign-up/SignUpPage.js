import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import Button from '@mui/material/Button';
import { useContext, useEffect, useState } from 'react';
import Typography from '@mui/material/Typography';
import { Link } from 'react-router-dom';
import * as yup from 'yup';
import _ from '@lodash';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { cpf } from 'cpf-cnpj-validator';
import { StepOne, StepThree } from './formFields/FormFields';
import { makeStyles } from '@mui/styles';
import { AuthContext } from 'src/app/auth/AuthContext';

/**
 * Form Validation Schema
 */
const steps = ['', ''];
const schema = yup.object().shape({
  permissionCode: yup.string().required('You must enter display name'),
  CPF: yup
    .string()
    .required('CPF is required')
    .test('CPF inválido', 'CPF inválido', (value) => cpf.isValid(value)),
  // password: yup
  //   .string()
  //   .required('Please enter your password.')
  //   .min(8, 'Password is too short - should be 8 chars minimum.'),
  // passwordConfirm: yup.string().oneOf([yup.ref('password'), null], 'Passwords must match'),
  // acceptTermsConditions: yup.boolean().oneOf([true], 'The terms and conditions must be accepted.'),
});

const defaultValues = {
  permissionCode: '',
  CPF: '',
  name: '',
  email: '',
  password: '',
  passwordConfirm: '',
  cellphone: '',
};

function SignUpPage() {
    const [activeStep, setActiveStep] = useState(0);
    const [confirmData, setConfirmData] = useState({});
  const [skipped, setSkipped] = useState(new Set());
  const {handlePreRegister, validPermissionCode} = useContext(AuthContext)
 const useStyles = makeStyles(() => ({
  root: {
   
    "& .muiltr-1k3l4nl-MuiSvgIcon-root-MuiStepIcon-root.Mui-active": { color: "#0DB1E3" },
    "& .muiltr-1k3l4nl-MuiSvgIcon-root-MuiStepIcon-root.Mui-completed": { color: "#0DB1E3" },
  },
}));
  const c = useStyles()
  const { control, formState, handleSubmit, getValues, setError } = useForm({
    mode: 'onChange',
    defaultValues,
    resolver: yupResolver(schema),
  });

  const { isValid, dirtyFields, errors } = formState;

  function onSubmit({
    permissionCode,
    CPF,
    name,
    email,
    cellphone,
    password,
  }) {
    // jwtService
    //   .createUser({
    //     permissionCode,
    //     email,
    //   })
    //   .then((user) => {
    //     // No need to do anything, registered user data will be set at app/auth/AuthContext
    //   })
    //   .catch((_errors) => {
    //     _errors.forEach((error) => {
    //       setError(error.type, {
    //         type: 'manual',
    //         message: error.message,
    //       });
    //     });
    //   });
  }



  const isStepSkipped = (step) => {
    return skipped.has(step);
  };

  const handleNext = (e) => {
    e.preventDefault();
    const values = getValues()
    const { permissionCode, CPF } = values;
    
    if (permissionCode && CPF) {
      handlePreRegister(permissionCode, CPF)
      .then(() => {
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
      })
      .catch((_errors) => {
        if (_errors.licensee) {
            setError(_errors.licensee, {
              message: 'Código de Permissionário não encontrado',
            });
          } else if (_errors.cpfCnpj) {
            setError(_errors.cpfCnpj, {
              message: 'CPF/CNPJ não corresponde com o nosso sistema',
            });
          }
      })
    }
    return;
  };


  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
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
            <StepOne type="string" label="CPF" name="CPF" control={control} values={errors.cpfCnpjDoesNotMatch} />
          </>
        );
      case 1:
        return (
          <>
            <StepThree
              type="email"
              label="E-mail"
              name="email"
              control={control}
              values={errors.email}
            />
            <StepThree
              type="string"
              label="Celular"
              name="cellphone"
              control={control}
              values={errors.cellphone}
            />
            <StepThree
              type="password"
              label="Senha"
              name="password"
              control={control}
              values={errors.password}
            />
            <StepThree
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
            <h3>Confrime seus dados: </h3>
           
          </>
        );
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center md:items-start sm:justify-center md:justify-start flex-1 min-w-0">
      <Paper className="h-full sm:h-auto md:flex md:items-center md:justify-end w-full sm:w-auto md:h-full md:w-1/2 py-8 px-16 sm:p-48 md:p-64 sm:rounded-2xl md:rounded-none sm:shadow md:shadow-none ltr:border-r-1 rtl:border-l-1">
        <div className="w-full max-w-320 sm:w-320 mx-auto sm:mx-0">
          <Typography className="mt-32 text-4xl font-extrabold tracking-tight leading-tight">
            Registre-se
          </Typography>
          <div className="flex items-baseline mt-2 font-medium">
            <Typography>Já tem uma conta?</Typography>
            <Link className="ml-4" to="/sign-in">
              Faça login
            </Link>
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
              className="w-full mt-24"
              aria-label="Register"
              disabled={_.isEmpty(dirtyFields)}
              type={activeStep === steps.length + 1 ? 'submit' : 'button'}
              size="large"
              onClick={handleNext}
            >
              {activeStep === steps.length ? 'Criar conta' : 'Avançar'}
            </Button>
          </form>
        </div>
      </Paper>

      <Box className="relative hidden md:flex flex-auto items-center justify-center h-screen  overflow-hidden ">
        <img src="assets/images/etc/BRT.jpg" className="w-full" alt="BRT" />
      </Box>
    </div>
  );
}

export default SignUpPage;
