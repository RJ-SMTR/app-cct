// "A Pagar" é filtrado no backend pela Data Ordem de Pagamento (dataVencimento), que segue o ciclo
// semanal da OPA: terça a quinta (pagamento na sexta) ou sexta a segunda (pagamento na terça seguinte).
// Por isso, quando esse status está selecionado, só terça ou sexta podem ser escolhidas como início,
// e o fim é completado automaticamente para fechar a janela certa.
export const A_PAGAR_STATUS_LABELS = ['A Pagar', 'A pagar'];

export const hasAPagarStatus = (statuses = []) =>
  statuses.some((status) => A_PAGAR_STATUS_LABELS.includes(status));

const TUESDAY = 2;
const FRIDAY = 5;

// Só terça ou sexta podem iniciar a janela da OPA.
export const isValidOpaStartDate = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return false;
  const day = date.getDay();
  return day === TUESDAY || day === FRIDAY;
};

// Terça -> Quinta (pagamento sexta); Sexta -> Segunda (pagamento terça seguinte).
export const toOpaWindowRange = (range) => {
  if (!Array.isArray(range) || !range[0]) return [];
  const start = range[0];
  const day = start.getDay();

  if (day !== TUESDAY && day !== FRIDAY) return [start, start];

  const end = new Date(start);
  end.setDate(start.getDate() + (day === TUESDAY ? 2 : 3));
  return [start, end];
};
