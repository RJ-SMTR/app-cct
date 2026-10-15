import { yupResolver } from '@hookform/resolvers/yup';
import { Controller, useForm } from 'react-hook-form';
import { useContext, useState } from 'react';
import * as yup from 'yup';
import _ from '@lodash';
import {
  Box,
  Button,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { AuthContext } from 'src/app/auth/AuthContext';

const getCharacterValidationError = (str) => `Sua senha deve conter 1 ${str}`;

const schema = yup.object().shape({
  currentPassword: yup.string().required('Digite sua senha atual.'),
  newPassword: yup
    .string()
    .required('Digite a nova senha.')
    .min(8, 'Senha muito curta - mínimo 8 caracteres.')
    .matches(/[0-9]/, getCharacterValidationError('número'))
    .matches(/[a-z]/, getCharacterValidationError('letra minúscula'))
    .matches(/[A-Z]/, getCharacterValidationError('letra maiúscula')),
  newPasswordConfirm: yup
    .string()
    .oneOf([yup.ref('newPassword'), null], 'As senhas não batem'),
});

const defaultValues = {
  currentPassword: '',
  newPassword: '',
  newPasswordConfirm: '',
};

function PasswordField({ name, label, control, error, show, onToggleShow }) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <TextField
          {...field}
          fullWidth
          label={label}
          type={show ? 'text' : 'password'}
          error={!!error}
          helperText={error?.message}
          variant="outlined"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={onToggleShow} onMouseDown={(e) => e.preventDefault()} edge="end">
                  {show ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      )}
    />
  );
}

function ChangePassword() {
  const { changePasswordFunction } = useContext(AuthContext);
  const { control, handleSubmit, formState, reset } = useForm({
    mode: 'onChange',
    resolver: yupResolver(schema),
    defaultValues,
  });
  const { isValid, dirtyFields, errors } = formState;

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = (data) => {
    setIsSubmitting(true);
    changePasswordFunction(data.currentPassword, data.newPassword)
      .then(() => reset(defaultValues))
      .catch(() => {})
      .finally(() => setIsSubmitting(false));
  };

  return (
    <div className="p-24 pt-10">
      <Typography className="font-medium text-3xl mb-24">Alterar Senha</Typography>

      <Paper className="p-24 rounded-2xl max-w-[40rem]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <PasswordField
                name="currentPassword"
                label="Senha atual"
                control={control}
                error={errors.currentPassword}
                show={showCurrent}
                onToggleShow={() => setShowCurrent((prev) => !prev)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <PasswordField
                name="newPassword"
                label="Nova senha"
                control={control}
                error={errors.newPassword}
                show={showNew}
                onToggleShow={() => setShowNew((prev) => !prev)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <PasswordField
                name="newPasswordConfirm"
                label="Confirmar nova senha"
                control={control}
                error={errors.newPasswordConfirm}
                show={showConfirm}
                onToggleShow={() => setShowConfirm((prev) => !prev)}
              />
            </Grid>
          </Grid>

          <Typography className="text-xs text-gray-500 mt-16">
            A nova senha deve conter no mínimo 8 caracteres, com ao menos uma letra maiúscula,
            uma minúscula e um número.
          </Typography>

          <Box className="mt-24">
            <Button
              variant="contained"
              color="secondary"
              type="submit"
              size="medium"
              disabled={_.isEmpty(dirtyFields) || !isValid || isSubmitting}
            >
              Salvar nova senha
            </Button>
          </Box>
        </form>
      </Paper>
    </div>
  );
}

export default ChangePassword;
