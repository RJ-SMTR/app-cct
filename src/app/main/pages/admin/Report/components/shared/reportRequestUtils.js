export const MOTIVO_OBRIGATORIO_MENSAGEM = "Selecione um motivo para a Pendência de Pagamento.";

// Pendência de Pagamento sem motivo não pode ser pesquisada: sem motivo o filtro não vira
// Estorno/Rejeitado/OPs atrasadas (applyPendenciaDePagamentoErro abaixo) e a busca saía com outro
// status. showErroStatus é verdadeiro exatamente quando o status de pendência está selecionado
// (Permissionário e Guardador, Consolidado e Movimentação Financeira).
export function motivoObrigatorioFaltando({ showErroStatus, selectedErroStatus }) {
  return Boolean(showErroStatus) && (selectedErroStatus?.length ?? 0) === 0;
}

// Tradução do filtro "Pendência de Pagamento" + motivo selecionado (Todos/Estorno/Rejeitado/OPs
// atrasadas) em flags booleanas (erro/estorno/rejeitado) que o backend espera. Essa lógica era
// duplicada (quase byte a byte) entre ConsolidatedReportPage.js e FinancialMovementReport.js.
export function applyPendenciaDePagamentoErro(requestData, { whichStatusShow, selectedErroStatus, addPendentesOnTodos }) {
  if (!(whichStatusShow.includes("Pendência de Pagamento") && selectedErroStatus.length > 0)) {
    return requestData;
  }

  requestData.status = requestData.status.filter((status) => status !== "Pendência de Pagamento");
  const selectedErroLabels = selectedErroStatus.map((status) => status.label);
  const statusSet = new Set(requestData.status);

  if (selectedErroLabels.includes("Todos")) {
    statusSet.add("Erro");
    if (addPendentesOnTodos) statusSet.add("Pendentes");
    requestData.erro = true;
  } else {
    if (selectedErroLabels.includes("Estorno")) {
      statusSet.add("Estorno");
      requestData.estorno = true;
    }
    if (selectedErroLabels.includes("Rejeitado")) {
      statusSet.add("Rejeitado");
      requestData.rejeitado = true;
    }
    if (selectedErroLabels.includes("OPs atrasadas")) {
      statusSet.add("Pendentes");
    }
  }

  requestData.status = Array.from(statusSet);
  return requestData;
}

// Traduz o combo "Específicos" (Eleição/Desativados) em flags booleanas. Só o permissionário usa.
export function applyEspecificosFlags(requestData, data) {
  if (data.especificos?.includes("Eleição")) requestData.eleicao = true;
  if (data.especificos?.includes("Desativados")) requestData.desativados = true;
  return requestData;
}
