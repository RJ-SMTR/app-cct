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
  pendenciaPaga: "Pendência paga",
  rejeitado: "Rejeitado",
  estorno: "Estorno",
};

function getOptionValue(option) {
  if (typeof option === "string") {
    return option;
  }

  return option?.value ?? option?.label ?? "";
}

function normalizeAssociationName(name) {
  return String(name)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

// Separator the API uses when a guardador belongs to more than one association.
const ASSOCIATION_SEPARATOR = " / ";

function getSingleAssociationDisplayName(name) {
  const normalizedName = normalizeAssociationName(name);

  if (normalizedName.includes("SINGAERJ")) {
    return "SINGAERJ";
  }

  if (normalizedName.startsWith("ASSOCIACAO NACIONAL DOS GUARDADORES E LAVADORES")) {
    return "ANGLAE";
  }

  return name;
}

// Purely visual: the full names of these two associations are too long for the tables.
// A guardador with several associations arrives as one joined value, so each one is shortened.
export function getAssociationDisplayName(name) {
  if (!name) {
    return name;
  }

  return String(name)
    .split(ASSOCIATION_SEPARATOR)
    .map(getSingleAssociationDisplayName)
    .join(ASSOCIATION_SEPARATOR);
}

// Only a paid pendência has an effective payment date to show; a plain "Pago" row shows "-".
export function getAgentEffectivePaymentDateLabel(report) {
  return report?.status === "Pendencia Paga" && report?.dataPagamento
    ? report.dataPagamento
    : "-";
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

// The guardador selector holds user ids. "Todos" is not a filter, so no ids are sent.
function buildUserIdsFilter(values) {
  if (!Array.isArray(values) || values.length === 0) {
    return null;
  }

  if (values.includes(AGENT_REPORT_SELECT_ALL_VALUE)) {
    return null;
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

  const userIds = buildUserIdsFilter(filters.agentNames);
  if (userIds) {
    params.userIds = userIds;
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
  if (selectedStatuses.has("Pendencia Paga")) {
    params.pendenciaPaga = true;
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

// The selector value is the user id (sent to the API), not the name: two guardadores can
// share a name and the API filters by id.
function getAgentUserId(agentUser) {
  return agentUser?.id ?? agentUser?.userId ?? null;
}

export function buildAgentAutocompleteOptions(agentUsers = []) {
  const optionsById = new Map();

  agentUsers.forEach((agentUser) => {
    const userId = getAgentUserId(agentUser);

    if (userId != null && !optionsById.has(userId)) {
      optionsById.set(userId, { label: getAgentOptionLabel(agentUser), value: userId });
    }
  });

  const agentOptions = Array.from(optionsById.values()).sort(
    (firstOption, secondOption) =>
      firstOption.label.localeCompare(secondOption.label) ||
      Number(firstOption.value) - Number(secondOption.value)
  );

  return [
    { label: AGENT_REPORT_SELECT_ALL_VALUE, value: AGENT_REPORT_SELECT_ALL_VALUE },
    ...agentOptions,
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
      label: getAssociationDisplayName(association),
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
