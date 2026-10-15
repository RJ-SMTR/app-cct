// Fonte única de labels de status/específicos, espelhando exatamente o switch
// de app/store/reportSlice.js (handleData) que traduz esses labels em flags
// booleanas enviadas ao backend. Mudar os labels aqui sem espelhar o switch
// quebra o mapeamento de filtros.
export const STATUS_OPTIONS = [
  { label: 'Todos' },
  { label: 'A pagar' },
  { label: 'Aguardando Pagamento' },
  { label: 'Pago' },
  { label: 'Pendência de Pagamento' },
  { label: 'Pendencia Paga' },
];

export const ERRO_STATUS_OPTIONS = [
  { label: 'Todos' },
  { label: 'Estorno' },
  { label: 'Rejeitado' },
  { label: 'OPs atrasadas' },
];

export const ESPECIFICOS_OPTIONS = [
  { label: 'Todos' },
  { label: 'Eleição' },
];

// Data mínima permitida nos DateRangePicker dos relatórios.
export const MIN_SELECTABLE_DATE = new Date(2024, 3, 30);
