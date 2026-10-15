import React, { useState } from 'react';
import { Grid, InputAdornment, IconButton, TextField } from '@mui/material';
import { ClearIcon } from '@mui/x-date-pickers';
import { NumericFormat } from 'react-number-format';
import { Controller } from 'react-hook-form';

// Parsing único para os campos valorMin/valorMax: remove separador de milhar
// e troca vírgula decimal por ponto (ex.: "1.234,56" -> 1234.56).
function parseBrlNumber(value) {
  if (!value) return NaN;
  return parseFloat(value.replace(/\./g, '').replace(',', '.'));
}

const valueProps = {
  startAdornment: <InputAdornment position="start">R$</InputAdornment>,
};

function ValorField({ name, label, control, getValues, trigger, clearErrors, otherFieldName, validate }) {
  const [showClear, setShowClear] = useState(false);

  return (
    <Controller
      name={name}
      control={control}
      rules={{ validate }}
      render={({ field, fieldState: { error } }) => (
        <NumericFormat
          {...field}
          fullWidth
          thousandSeparator="."
          decimalSeparator=","
          fixedDecimalScale
          decimalScale={2}
          customInput={TextField}
          label={label}
          value={field.value}
          onChange={(e) => {
            field.onChange(e);
            if (getValues(otherFieldName)) {
              trigger(otherFieldName);
            } else {
              clearErrors(name);
            }
          }}
          error={!!error}
          helperText={error ? error.message : null}
          onMouseEnter={() => {
            if (field.value) setShowClear(true);
          }}
          onMouseLeave={() => setShowClear(false)}
          InputProps={{
            endAdornment: showClear && field.value && (
              <InputAdornment sx={{ position: 'absolute', right: '1rem' }} position="end">
                <IconButton
                  onClick={() => field.onChange('')}
                  sx={{ height: '2rem', width: '2rem' }}
                >
                  <ClearIcon sx={{ height: '2rem' }} />
                </IconButton>
              </InputAdornment>
            ),
            ...valueProps,
          }}
        />
      )}
    />
  );
}

// Encapsula os filtros de Valor Mínimo/Máximo usados em todos os relatórios,
// com parsing e validação cruzada consistentes entre os dois campos.
export default function ValorRangeFilter({ control, getValues, trigger, clearErrors, itemProps }) {
  return (
    <>
      <Grid item xs={6} sm={3} md={2} {...itemProps}>
        <ValorField
          name="valorMin"
          label="Valor Mínimo"
          control={control}
          getValues={getValues}
          trigger={trigger}
          clearErrors={clearErrors}
          otherFieldName="valorMax"
          validate={(value) => {
            if (!value) return true;
            const valorMin = parseBrlNumber(value);
            const valorMax = parseBrlNumber(getValues('valorMax'));
            if (Number.isNaN(valorMax)) return true;
            return valorMin <= valorMax || 'Valor Mínimo não pode ser maior que o Valor Máximo';
          }}
        />
      </Grid>
      <Grid item xs={6} sm={3} md={2} {...itemProps}>
        <ValorField
          name="valorMax"
          label="Valor Máximo"
          control={control}
          getValues={getValues}
          trigger={trigger}
          clearErrors={clearErrors}
          otherFieldName="valorMin"
          validate={(value) => {
            if (!value) return true;
            const valorMax = parseBrlNumber(value);
            const valorMin = parseBrlNumber(getValues('valorMin'));
            if (Number.isNaN(valorMin)) return true;
            return valorMax >= valorMin || 'Valor Máximo não pode ser menor que o Valor Mínimo';
          }}
        />
      </Grid>
    </>
  );
}
