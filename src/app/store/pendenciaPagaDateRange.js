// Pendência Paga é consultada por um único dia (a data de pagamento), por isso o campo de data aceita só
// um dia quando esse status está selecionado. Os rótulos cobrem as grafias que aparecem nos formulários.
export const SINGLE_DAY_STATUS_LABELS = [
  'Pendencia Paga',
  'Pendência Paga',
];

export const hasSingleDayStatus = (statuses = []) =>
  statuses.some((status) => SINGLE_DAY_STATUS_LABELS.includes(status));

// Converte o intervalo para um único dia: [início, início]. Sem início, devolve vazio.
export const toSingleDayRange = (range) => {
  if (!Array.isArray(range) || !range[0]) return [];
  return [range[0], range[0]];
};
