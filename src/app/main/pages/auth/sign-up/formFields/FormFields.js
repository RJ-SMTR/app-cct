import { Controller } from 'react-hook-form';
import TextField from '@mui/material/TextField';
import { PatternFormat } from 'react-number-format';


export function StepOne({ type, control, values, label, name }) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <TextField
          {...field}
          className="mb-24"
          label={label}
          type={type}
          error={!!values}
          helperText={values?.message}
          variant="outlined"
          required
          fullWidth
        />
      )}
    />
  );
}

export function StepTwo({ type, control, values, label, name }) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <TextField
          {...field}
          className="mb-24"
          label={label}
          type={type}
          error={!!values}
          helperText={values?.message}
          variant="outlined"
          required
          fullWidth
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