import accounting from "accounting";
import dayjs from "dayjs";

export const AGENT_REPORT_SELECT_ALL_VALUE = "Todos";
export const AGENT_REPORT_ERROR_STATUS_VALUE = "Erros";

export const AGENT_REPORT_STATUS_LABELS = {
  todos: "Todos",
  pago: "Pago",
  erros: "Erros",
  aPagar: "A pagar",
  emProcessamento: "Em processamento",
  rejeitado: "Rejeitado",
  estorno: "Estorno",
};

function getOptionValue(option) {
  if (typeof option === "string") {
    return option;
  }

  return option?.value ?? option?.label ?? "";
}

export function normalizeCurrencyFilterValue(value) {
  if (value == null || value === "") {
    return null;
  }

  const normalizedValue = accounting.unformat(
    String(value).replace(/\./g, "").replace(",", ".")
  );

  if (!Number.isFinite(normalizedValue)) {
    return null;
  }

  return Number.parseFloat(normalizedValue).toFixed(2);
}

function buildCommaSeparatedFilter(values) {
  if (!Array.isArray(values) || values.length === 0) {
    return null;
  }

  if (values.includes(AGENT_REPORT_SELECT_ALL_VALUE)) {
    return AGENT_REPORT_SELECT_ALL_VALUE;
  }

  return values.join(",");
}

export function buildAgentConsolidatedReportParams(filters = {}) {
  const params = {};

  if (Array.isArray(filters.dateRange) && filters.dateRange.length === 2) {
    const startDate = dayjs(filters.dateRange[0]);
    const endDate = dayjs(filters.dateRange[1]);

    if (!endDate.isBefore(startDate, "day")) {
      params.dataInicio = startDate.format("YYYY-MM-DD");
      params.dataFim = endDate.format("YYYY-MM-DD");
    }
  }

  const favorecidoNome = buildCommaSeparatedFilter(filters.agentNames);
  if (favorecidoNome) {
    params.favorecidoNome = favorecidoNome;
  }

  const consorcioNome = buildCommaSeparatedFilter(filters.associations);
  if (consorcioNome) {
    params.consorcioNome = consorcioNome;
  }

  const valorMin = normalizeCurrencyFilterValue(filters.valorMin);
  if (valorMin) {
    params.valorMin = valorMin;
  }

  const valorMax = normalizeCurrencyFilterValue(filters.valorMax);
  if (valorMax) {
    params.valorMax = valorMax;
  }

  const selectedStatuses = new Set(filters.status || []);
  const selectedErrorReasons = new Set(filters.erroStatus || []);
  const hasErrorStatus = selectedStatuses.has(AGENT_REPORT_ERROR_STATUS_VALUE);

  if (hasErrorStatus) {
    params.pago = false;
  } else if (selectedStatuses.has("Pago")) {
    params.pago = true;
  }

  if (!hasErrorStatus && selectedStatuses.has("A pagar")) {
    params.aPagar = true;
  }
  if (selectedStatuses.has("Em processamento")) {
    params.emProcessamento = true;
  }
  if (
    hasErrorStatus &&
    selectedErrorReasons.size > 0 &&
    !selectedErrorReasons.has(AGENT_REPORT_SELECT_ALL_VALUE) &&
    selectedErrorReasons.has("Rejeitado")
  ) {
    params.rejeitado = true;
  }
  if (
    hasErrorStatus &&
    selectedErrorReasons.size > 0 &&
    !selectedErrorReasons.has(AGENT_REPORT_SELECT_ALL_VALUE) &&
    selectedErrorReasons.has("Estorno")
  ) {
    params.estorno = true;
  }

  return params;
}

export function getAgentReportStatusLabel(status) {
  return AGENT_REPORT_STATUS_LABELS[status] || status || AGENT_REPORT_STATUS_LABELS.todos;
}

export function normalizeAgentConsolidatedReportBlocks(responseData) {
  if (!Array.isArray(responseData)) {
    return [];
  }

  return responseData.map((block) => {
    const rows = Array.isArray(block?.data) ? block.data : [];

    return {
      count: Number.isFinite(Number(block?.count)) ? Number(block.count) : rows.length,
      rawStatus: block?.status || "todos",
      statusLabel: getAgentReportStatusLabel(block?.status),
      valor: Number.isFinite(Number(block?.valor)) ? Number(block.valor) : 0,
      data: rows.map((row) => ({
        nome: row?.nome || "-",
        valor: Number.isFinite(Number(row?.valor)) ? Number(row.valor) : 0,
      })),
    };
  });
}

export function flattenAgentConsolidatedReportBlocks(blocks = []) {
  return blocks.flatMap((block) =>
    (block.data || []).map((row) => ({
      status: block.statusLabel,
      nome: row.nome,
      valor: row.valor,
    }))
  );
}

export function getAgentConsolidatedReportTotal(blocks = []) {
  const allBlock = blocks.find((block) => block.rawStatus === "todos");

  if (allBlock) {
    return allBlock.valor;
  }

  return blocks.reduce((total, block) => total + (Number(block.valor) || 0), 0);
}

export function getAgentOptionLabel(agentUser) {
  return agentUser?.fullName || agentUser?.label || "Guardador";
}

export function getAgentAssociationNames(agentUser) {
  if (Array.isArray(agentUser?.associacoes) && agentUser.associacoes.length > 0) {
    return agentUser.associacoes
      .map((association) => association?.label || association?.name || association?.value || "")
      .filter(Boolean);
  }

  return [
    agentUser?.consorcio,
    agentUser?.consorcioName,
    agentUser?.association,
    agentUser?.associacao,
  ].filter(Boolean);
}

export function buildAgentAutocompleteOptions(agentUsers = []) {
  const uniqueNames = Array.from(
    new Set(agentUsers.map((agentUser) => getAgentOptionLabel(agentUser)).filter(Boolean))
  ).sort((firstName, secondName) => firstName.localeCompare(secondName));

  return [
    { label: AGENT_REPORT_SELECT_ALL_VALUE, value: AGENT_REPORT_SELECT_ALL_VALUE },
    ...uniqueNames.map((name) => ({
      label: name,
      value: name,
    })),
  ];
}

export function buildAssociationAutocompleteOptions(agentUsers = []) {
  const uniqueAssociations = Array.from(
    new Set(
      agentUsers.flatMap((agentUser) => getAgentAssociationNames(agentUser)).filter(Boolean)
    )
  ).sort((firstAssociation, secondAssociation) =>
    firstAssociation.localeCompare(secondAssociation)
  );

  return [
    { label: AGENT_REPORT_SELECT_ALL_VALUE, value: AGENT_REPORT_SELECT_ALL_VALUE },
    ...uniqueAssociations.map((association) => ({
      label: association,
      value: association,
    })),
  ];
}

export function normalizeSelectAllAutocompleteValue(options = []) {
  if (!Array.isArray(options) || options.length === 0) {
    return [];
  }

  const selectedAllOption = options.find(
    (option) => option?.value === AGENT_REPORT_SELECT_ALL_VALUE
  );

  if (!selectedAllOption) {
    return options;
  }

  return [selectedAllOption];
}

export function normalizeAgentStatusSelection(options = []) {
  if (!Array.isArray(options) || options.length === 0) {
    return [];
  }

  const normalizedOptions = options.map((option) => ({
    ...option,
    value: getOptionValue(option),
    label: option?.label ?? getOptionValue(option),
  }));
  const hasErrorStatus = normalizedOptions.some(
    (option) => option.value === AGENT_REPORT_ERROR_STATUS_VALUE
  );

  if (!hasErrorStatus) {
    return normalizedOptions;
  }

  return normalizedOptions.filter(
    (option) => option.value === AGENT_REPORT_ERROR_STATUS_VALUE
  );
}


export function shouldShowAgentNameFilter(selectedAssociationOptions = []) {
  return !Array.isArray(selectedAssociationOptions) || selectedAssociationOptions.length === 0;
}

export function shouldShowAssociationFilter(selectedAgentOptions = []) {
  return !Array.isArray(selectedAgentOptions) || selectedAgentOptions.length === 0;
}
