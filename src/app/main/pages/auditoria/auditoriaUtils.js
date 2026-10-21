export const formatDataHora = (valor) => {
  if (!valor) return '—';
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('pt-BR');
};

export const formatData = (valor) => {
  if (!valor) return '—';
  const m = String(valor).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-BR');
};

export const formatBRL = (valor) =>
  valor === null || valor === undefined || valor === '' || Number.isNaN(Number(valor))
    ? '—'
    : Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const ROTULO_ACAO = {
  INSERIDA: 'Nova (inserida)',
  ALTERADA: 'Alterada',
  QUARENTENA: 'Em quarentena',
  APROVADA: 'Aprovada',
  REJEITADA: 'Rejeitada',
};

export const COR_ACAO = {
  INSERIDA: 'success',
  ALTERADA: 'info',
  QUARENTENA: 'warning',
  APROVADA: 'success',
  REJEITADA: 'error',
};

export const ROTULO_OPERACAO = { I: 'Inserção', U: 'Alteração', D: 'Exclusão' };
export const COR_OPERACAO = { I: 'success', U: 'info', D: 'error' };

export const ROTULO_STATUS_EXECUCAO = { em_andamento: 'Em andamento', concluida: 'Concluída', erro: 'Erro' };
export const COR_STATUS_EXECUCAO = { em_andamento: 'warning', concluida: 'success', erro: 'error' };

/** Remove filtros vazios para não mandar `?campo=` à API. */
export const limparFiltros = (filtros) =>
  Object.fromEntries(Object.entries(filtros).filter(([, v]) => v !== '' && v !== null && v !== undefined && v !== false));

/** Texto curto de um objeto JSON (antes/depois) para a célula da tabela. */
export const resumirJson = (obj, max = 120) => {
  if (obj === null || obj === undefined) return '—';
  const texto = typeof obj === 'string' ? obj : JSON.stringify(obj);
  return texto.length > max ? `${texto.slice(0, max)}…` : texto;
};

/** Lista os campos que mudaram entre `antes` e `depois` ({campo: valor}). */
export const diferencas = (antes, depois) => {
  const a = antes || {};
  const d = depois || {};
  return [...new Set([...Object.keys(a), ...Object.keys(d)])]
    .filter((campo) => JSON.stringify(a[campo]) !== JSON.stringify(d[campo]))
    .map((campo) => ({ campo, antes: a[campo], depois: d[campo] }));
};

export const mensagemDeErro = (error, padrao = 'Não foi possível concluir a operação.') =>
  error?.response?.data?.error || error?.response?.data?.message || padrao;
