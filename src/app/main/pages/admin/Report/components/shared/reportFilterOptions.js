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

// Status só do Guardador: pagamento com abatimento do pagamento indevido (o mesmo da tela de
// Agentes, DUPLICATE_OFFSET_STATUS). O label é traduzido no flag "abatimentoDuplicidade" em
// app/store/reportSlice.js (handleAgentFinancialData).
export const ABATIMENTO_DUPLICIDADE_STATUS = 'Abatimento por duplicidade';

export const GUARDADOR_FINANCIAL_STATUS_OPTIONS = [...STATUS_OPTIONS, { label: ABATIMENTO_DUPLICIDADE_STATUS }];

export const ERRO_STATUS_OPTIONS = [
  { label: 'Todos' },
  { label: 'Estorno' },
  { label: 'Rejeitado' },
  { label: 'OPs atrasadas' },
];

export const ESPECIFICOS_OPTIONS = [
  { label: 'Todos' },
  { label: 'Eleição' },
  { label: 'STUC - Gratuidade' },
];

// Data mínima permitida no DateRangePicker dos relatórios do Guardador.
export const MIN_SELECTABLE_DATE_GUARDADOR = new Date(2026, 6, 23);

// Data mínima permitida no DateRangePicker dos relatórios do Permissionário.
export const MIN_SELECTABLE_DATE_PERMISSIONARIO = new Date(2024, 3, 30);
