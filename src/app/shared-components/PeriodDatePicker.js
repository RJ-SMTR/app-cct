import { useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import ptBR from "date-fns/locale/pt-BR";

/**
 * Seletor de período reutilizável.
 *
 * - value: [inicio, fim] (Date ou null). Vazio é [].
 * - onChange(range): recebe sempre [inicio, fim] (ou [] quando limpo).
 * - singleDay: quando true, aceita um dia só e mantém fim igual ao início.
 * - minDate / maxDate: limites opcionais.
 * - labels: rótulos dos campos (padrão "De" e "Até"; em singleDay usa "Data").
 */
export default function PeriodDatePicker({
  value = [],
  onChange,
  singleDay = false,
  minDate,
  maxDate,
  labels = { start: "De", end: "Até", single: "Data" },
  error = false,
  helperText,
  className,
}) {
  // Datas parciais digitadas no campo chegam como Invalid Date: tratamos como vazio.
  const asValidDate = (d) => (d instanceof Date && !Number.isNaN(d.getTime()) ? d : null);
  const start = asValidDate(value?.[0]);
  const end = asValidDate(value?.[1]);

  // Com singleDay ligado, um intervalo já preenchido vira um único dia.
  useEffect(() => {
    if (singleDay && start && end) {
      onChange([start, start]);
    }
  }, [singleDay, start, end]);

  // Não altera o outro campo: durante a digitação o ano parcial pode gerar datas antigas,
  // e ajustar o início por isso corrompe a data. A validação de mínimo/máximo sinaliza o erro.
  const emit = (nextStart, nextEnd) => {
    if (!nextStart && !nextEnd) return onChange([]);
    if (singleDay) return onChange([nextStart ?? nextEnd, nextStart ?? nextEnd]);
    onChange([nextStart ?? nextEnd, nextEnd ?? nextStart]);
  };

  const handleStart = (date) => emit(asValidDate(date), end);

  const handleEnd = (date) => emit(start, asValidDate(date));

  const sharedProps = {
    minDate,
    maxDate,
    format: "dd/MM/yyyy",
    slotProps: { textField: { size: "medium", variant: "outlined", error: Boolean(error) } },
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
      <Box className={className} sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          {singleDay ? (
            <DatePicker
              {...sharedProps}
              label={labels.single}
              value={start}
              onChange={handleStart}
            />
          ) : (
            <>
              <DatePicker
                {...sharedProps}
                label={labels.start}
                value={start}
                maxDate={end ?? maxDate}
                onChange={handleStart}
              />
              <DatePicker
                {...sharedProps}
                label={labels.end}
                value={end}
                minDate={start ?? minDate}
                onChange={handleEnd}
              />
            </>
          )}
        </Box>
        {error && helperText ? (
          <Typography variant="caption" color="error">
            {helperText}
          </Typography>
        ) : null}
      </Box>
    </LocalizationProvider>
  );
}
