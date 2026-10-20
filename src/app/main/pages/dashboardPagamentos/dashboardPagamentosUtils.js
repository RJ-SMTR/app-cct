import dayjs from 'dayjs';

export const SITUACOES = [
  { key: 'pago', label: 'Pago', color: '#2e7d32' },
  { key: 'naoPago', label: 'Não pago', color: '#d32f2f' },
  { key: 'emAberto', label: 'Em aberto', color: '#ed6c02' },
];

export const CONTAS = ['bilhetagem', 'rotativo', 'cett'];

export const ROTA_DASHBOARD = '/dashboard-pagamentos';
export const ROTA_DETALHE = '/dashboard-pagamentos/detalhe';

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const inteiro = new Intl.NumberFormat('pt-BR');

export const formatBRL = (valor) => brl.format(Number(valor) || 0);
export const formatQtd = (qtd) => inteiro.format(Number(qtd) || 0);

/** Valor do gráfico conforme a métrica escolhida (quantidade de pagamentos ou valor em R$). */
export const formatMetrica = (valor, metrica) => (metrica === 'valor' ? formatBRL(valor) : formatQtd(valor));

export const toIsoDate = (data) => dayjs(data).format('YYYY-MM-DD');

/** Período inicial do dashboard: do primeiro dia do mês até hoje. */
export const periodoPadrao = (hoje = new Date()) => [dayjs(hoje).startOf('month').toDate(), dayjs(hoje).toDate()];

/** Lê o período da URL (YYYY-MM-DD); se faltar ou for inválido, usa o padrão. */
export function periodoDaUrl(searchParams, hoje = new Date()) {
  const inicio = searchParams.get('dataInicio');
  const fim = searchParams.get('dataFim');
  const valido = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || '') && dayjs(s).isValid();
  if (!valido(inicio) || !valido(fim) || dayjs(fim).isBefore(dayjs(inicio))) return periodoPadrao(hoje);
  return [dayjs(inicio).toDate(), dayjs(fim).toDate()];
}

/** Séries empilhadas do gráfico de barras: uma barra por consórcio/modal, uma série por situação. */
export function montarGraficoGrupos(conta, metrica) {
  const grupos = conta?.grupos ?? [];
  return {
    categorias: grupos.map((g) => g.grupo),
    series: SITUACOES.map((s) => ({
      name: s.label,
      data: grupos.map((g) => Number(metrica === 'valor' ? g[s.key].valor : g[s.key].qtd) || 0),
    })),
  };
}

/** Rosca dos motivos de uma situação (por padrão "não pago"). */
export function montarGraficoMotivos(conta, situacao, metrica) {
  const motivos = (conta?.motivos ?? []).filter((m) => m.situacao === situacao);
  return {
    motivos,
    rotulos: motivos.map((m) => m.descricao),
    valores: motivos.map((m) => Number(metrica === 'valor' ? m.valor : m.qtd) || 0),
  };
}

/** Endereço da tela de detalhe de um ponto do gráfico. Parâmetros vazios são omitidos. */
export function montarUrlDetalhe({ conta, grupo, situacao, motivo, busca, dataInicio, dataFim }) {
  const params = new URLSearchParams();
  Object.entries({ conta, grupo, situacao, motivo, busca, dataInicio, dataFim }).forEach(([chave, valor]) => {
    if (valor !== undefined && valor !== null && valor !== '') params.set(chave, valor);
  });
  return `${ROTA_DETALHE}?${params.toString()}`;
}

export function lerFiltrosDetalhe(searchParams) {
  const get = (chave) => searchParams.get(chave) || undefined;
  return {
    conta: get('conta'),
    grupo: get('grupo'),
    situacao: get('situacao'),
    motivo: get('motivo'),
    busca: get('busca'),
    dataInicio: get('dataInicio'),
    dataFim: get('dataFim'),
  };
}

export const ROTULO_CONTA = { bilhetagem: 'Conta Bilhetagem', rotativo: 'Conta Rotativo', cett: 'Conta CETT' };
export const ROTULO_SITUACAO = Object.fromEntries(SITUACOES.map((s) => [s.key, s.label]));
export const COR_SITUACAO = Object.fromEntries(SITUACOES.map((s) => [s.key, s.color]));

/** Tamanho de página usado para buscar todo o detalhe na exportação (máximo aceito pela API). */
export const TAMANHO_PAGINA_EXPORTACAO = 200;

const formatarDataBR = (iso) => (iso ? dayjs(iso).format('DD/MM/YYYY') : '');

/** Linhas da planilha "Pagamentos": uma por pagamento, com os mesmos dados da tabela (banco/agência/conta separados). */
export function linhasExportacaoDetalhe(itens = []) {
  return itens.map((item) => ({
    'Data de pagamento': formatarDataBR(item.data),
    Favorecido: item.favorecido || '(não identificado)',
    'CPF/CNPJ': item.cpfCnpj ?? '',
    'Consórcio / Grupo': item.grupo ?? '',
    Situação: ROTULO_SITUACAO[item.situacao] ?? item.situacao ?? '',
    Motivo: item.motivoDescricao ?? item.motivo ?? '',
    Valor: Number(item.valor) || 0,
    Banco: item.banco ?? '',
    Agência: item.agencia ?? '',
    Conta: item.conta ?? '',
    Remessa: item.remessaId ?? '',
    'Id do pagamento': item.detalheAId ?? '',
  }));
}

/** Linhas da planilha "Filtros": quais filtros geraram a exportação e os totais. */
export function linhasFiltrosExportacao(filtros, total, valorTotal) {
  return [
    ['Conta', ROTULO_CONTA[filtros.conta] ?? filtros.conta ?? ''],
    ['Grupo', filtros.grupo ?? 'Todos'],
    ['Situação', ROTULO_SITUACAO[filtros.situacao] ?? 'Todas'],
    ['Motivo', filtros.motivo ?? 'Todos'],
    ['Favorecido', filtros.busca ?? ''],
    ['Período', `${formatarDataBR(filtros.dataInicio)} a ${formatarDataBR(filtros.dataFim)}`],
    ['Quantidade de pagamentos', Number(total) || 0],
    ['Valor total', Number(valorTotal) || 0],
  ];
}

/** Ex.: detalhe-pagamentos_cett_2026-10-20_2026-10-20.xlsx */
export function nomeArquivoExportacao(filtros) {
  const partes = ['detalhe-pagamentos', filtros.conta, filtros.grupo, filtros.situacao, filtros.dataInicio, filtros.dataFim]
    .filter(Boolean)
    .map((parte) => String(parte).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9-]+/g, '-'));
  return `${partes.join('_')}.xlsx`;
}
