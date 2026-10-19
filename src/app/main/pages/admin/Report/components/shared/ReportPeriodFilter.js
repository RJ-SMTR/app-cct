import { Grid } from "@mui/material";
import { Controller } from "react-hook-form";
import PeriodDatePicker, { periodRequiredRules } from "app/shared-components/PeriodDatePicker";

/**
 * Linha 1 (período) dos formulários de filtro de relatório. Era a mesma marcação, byte a byte,
 * em ConsolidatedReportPage.js e FinancialMovementReport.js.
 */
// Item de Grid (não container): o chamador o coloca na mesma linha dos demais campos do
// filtro. md={4} (33%) é o máximo que os dois campos de data (De/Até) podem ocupar juntos,
// com a margem do Grid (spacing) já separando do próximo campo.
export default function ReportPeriodFilter({ control, singleDay = false, minDate, onChange, extraError = false }) {
  return (
    <Grid item xs={12} md={4}>
      <Controller
        name="dateRange"
        control={control}
        rules={periodRequiredRules}
        render={({ field, fieldState: { error } }) => (
          <PeriodDatePicker
            compact
            required
            value={field.value}
            onChange={(value) => {
              field.onChange(value);
              onChange?.(value);
            }}
            singleDay={singleDay}
            minDate={minDate}
            error={Boolean(error) || extraError}
            helperText={error?.message}
          />
        )}
      />
    </Grid>
  );
}
