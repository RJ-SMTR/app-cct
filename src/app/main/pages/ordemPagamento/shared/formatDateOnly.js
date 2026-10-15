// Formata uma data "date-only" (ex.: "2026-09-22" vinda de uma coluna `date`
// do Postgres) como dd/MM/yyyy sem passar por `new Date(...)`, que interpreta
// a string como UTC meia-noite e, em fusos atrás de UTC (ex.: Brasil), acaba
// exibindo o dia anterior ao formatar em horário local.
export default function formatDateOnly(value) {
  if (!value) return '';

  const datePart = String(value).split('T')[0];
  const [year, month, day] = datePart.split('-');

  if (!year || !month || !day) return '';

  return `${day}/${month}/${year}`;
}
