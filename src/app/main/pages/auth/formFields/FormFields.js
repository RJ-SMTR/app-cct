import { Controller } from 'react-hook-form';
import TextField from '@mui/material/TextField';
import { PatternFormat } from 'react-number-format';
import { useState } from 'react';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';


export function StepOne({ type, control, value, label, name, customClass}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <TextField
          {...field}
          className={`mb-24 z-[1]  ${customClass}`}
          label={label}
          type={type}
          variant="outlined"
          required
          value={value}
          fullWidth
          disabled
        />
      )}
    />
  );
}



export function StepTwo({ type, control, values, label, name }) {
  const [showPassword, setShowPassword] = useState(false);

  const handleTogglePasswordVisibility = () => {
    const input = document.getElementById(`password-${name}`);
    if (input) input.blur();
    setShowPassword((prev) => !prev);
  };

  const isPassword = type === 'password';

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <TextField
          {...field}
          id={`password-${name}`}
          className="mb-24"
          label={label}
          type={isPassword && showPassword ? 'text' : type}
          error={!!values}
          helperText={values?.message}
          variant="outlined"
          required
          fullWidth
          InputProps={{
            ...(isPassword && {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleTogglePasswordVisibility}
                    onMouseDown={(e) => e.preventDefault()}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }),
          }}
        />
      )}
    />
  );
}

export function CellPhonePhield({ type, control, values, label, name }) {
  const muiFieldProps = {
    className: "mb-24",
    label: label,
    type: type,
    error: !!values,
    helperText: values?.message,
    variant: "outlined",

  }
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <>
          <PatternFormat value="" format="## ##### ####" {...field} {...muiFieldProps} customInput={TextField} />
        </>
      )}
    />
  )
}