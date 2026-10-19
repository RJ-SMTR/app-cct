import { Grid } from "@mui/material";
import { Controller } from "react-hook-form";
import PeriodDatePicker, { periodRequiredRules } from "app/shared-components/PeriodDatePicker";

/**
 * Linha 1 (período) dos formulários de filtro de relatório. Era a mesma marcação, byte a byte,
 * em ConsolidatedReportPage.js e FinancialMovementReport.js.
 */
export default function ReportPeriodFilter({ control, singleDay = false, minDate, onChange, extraError = false }) {
  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid item xs={12}>
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
    </Grid>
  );
}
