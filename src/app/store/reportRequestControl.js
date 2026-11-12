// Controle das requisições dos relatórios (Consolidado e Movimentação Financeira), ADR 0023 da api-cct.
// A API cancela a consulta em 120 s e devolve 504; a tela espera um pouco mais (130 s) para receber essa
// resposta em vez de estourar antes. Uma pesquisa nova cancela as requisições da anterior, para que um
// resultado antigo não substitua o novo.

export const REPORT_REQUEST_TIMEOUT_MS = 130000;

export const REPORT_TIMEOUT_MESSAGE = 'A consulta demorou mais de 2 minutos; reduza o período';

let currentController = new AbortController();

// Chamado no início de cada pesquisa (botão Pesquisar): aborta o que a pesquisa anterior ainda espera.
export function beginReportSearch() {
  currentController.abort();
  currentController = new AbortController();
  return currentController.signal;
}

export function currentReportSignal() {
  return currentController.signal;
}

export function withReportRequestControl(config) {
  return { ...config, timeout: REPORT_REQUEST_TIMEOUT_MS, signal: currentReportSignal() };
}

// 'cancelado': a pesquisa foi substituída por outra, não mostrar nada.
// 'timeout': a API (504) ou o navegador (timeout do axios) desistiram, mostrar REPORT_TIMEOUT_MESSAGE.
// 'erro': qualquer outra falha, mantém a mensagem que cada tela já mostra.
export function classifyReportError(error) {
  if (error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError' || error?.name === 'AbortError') {
    return 'cancelado';
  }
  if (error?.response?.status === 504 || error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT') {
    return 'timeout';
  }
  return 'erro';
}

// Mensagem para o catch das telas: null quando a pesquisa foi substituída (não mostrar nada), a mensagem de
// timeout quando a consulta demorou demais, e a mensagem padrão da tela nos demais erros.
export function reportErrorMessage(error, mensagemPadrao) {
  const tipo = classifyReportError(error);
  if (tipo === 'cancelado') return null;
  if (tipo === 'timeout') return REPORT_TIMEOUT_MESSAGE;
  return mensagemPadrao;
}
