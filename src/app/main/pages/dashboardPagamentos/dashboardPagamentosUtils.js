import dayjs from 'dayjs';

export const SITUACOES = [
  { key: 'pago', label: 'Pago', color: '#2e7d32' },
  { key: 'naoPago', label: 'Não pago', color: '#d32f2f' },
  { key: 'emAberto', label: 'Aguardando pagamento', color: '#ed6c02' },
];

export const CONTAS = ['bilhetagem', 'rotativo', 'cett'];

// Mesmos grupos que a API devolve no resumo (GRUPOS_POR_CONTA); alimentam o filtro múltiplo do detalhe.
const MODAIS = ['STPC', 'STPL', 'TEC'];
export const GRUPOS_POR_CONTA = {
  bilhetagem: ['GTU', 'Intersul', 'Internorte', 'MobiRio', 'Santa Cruz', 'Transcarioca', 'TUSE', 'VLT', ...MODAIS],
  rotativo: ['Guardador'],
  cett: [...MODAIS, 'Pagamento único'],
};

/** O filtro de grupo vai na URL e na API como lista separada por vírgula ("GTU,VLT"). */
export const gruposDoFiltro = (grupo) =>
  String(grupo || '')
    .split(',')
    .map((g) => g.trim())
    .filter(Boolean);

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

/**
 * Barras duplas: duas barras por consórcio/modal, "Pago" e "Não pago". "Aguardando pagamento" (em aberto) nunca
 * entra neste gráfico. O nome do consórcio aparece uma vez no eixo X; as duas barras saem de séries com `group`
 * (barras agrupadas do ApexCharts). Valores zerados não são exibidos: ponto zerado vira `null` (sem barra nem
 * tooltip) e consórcio/modal sem pago nem não pago na métrica fica fora do gráfico.
 */
export function montarGraficoGruposDuplo(conta, metrica) {
  const valorDe = (g, situacao) => Number(metrica === 'valor' ? g[situacao].valor : g[situacao].qtd) || 0;
  const situacoesGrafico = ['pago', 'naoPago'];
  const grupos = (conta?.grupos ?? []).filter((g) => situacoesGrafico.some((situacao) => valorDe(g, situacao) > 0));
  const serie = (situacao, group) => ({
    key: situacao,
    name: ROTULO_SITUACAO[situacao],
    group,
    data: grupos.map((g) => (valorDe(g, situacao) > 0 ? valorDe(g, situacao) : null)),
  });
  return {
    categorias: grupos.map((g) => g.grupo),
    series: [serie('pago', 'pago'), serie('naoPago', 'naoPago')],
  };
}

/**
 * Gráfico de "Aguardando pagamento" (em aberto): uma barra por consórcio/modal, separado do gráfico Pago | Não pago.
 * Consórcio/modal sem valor aguardando na métrica fica fora do gráfico.
 */
export function montarGraficoAguardando(conta, metrica) {
  const valorDe = (g) => Number(metrica === 'valor' ? g.emAberto?.valor : g.emAberto?.qtd) || 0;
  const grupos = (conta?.grupos ?? []).filter((g) => valorDe(g) > 0);
  return {
    categorias: grupos.map((g) => g.grupo),
    series: [{ key: 'emAberto', name: ROTULO_SITUACAO.emAberto, data: grupos.map(valorDe) }],
  };
}

/**
 * Abas do gráfico de barras: "pagos" (Pago | Não pago) quando há dado pago ou não pago no período e "aguardando"
 * quando há dado aguardando pagamento. Com só uma das duas a tela mostra só aquele gráfico, sem abas.
 */
export function abasGraficoBarras(graficoPagos, graficoAguardando) {
  const abas = [];
  if (graficoPagos?.categorias?.length > 0) abas.push({ id: 'pagos', rotulo: 'Pago / Não pago' });
  if (graficoAguardando?.categorias?.length > 0) abas.push({ id: 'aguardando', rotulo: ROTULO_SITUACAO.emAberto });
  return abas;
}

/**
 * Conta Rotativo tem um grupo só (Guardador): no lugar das barras por consórcio/modal ela mostra as abas
 * "Proporção" e "Por dia".
 */
export const usaGraficosRotativo = (conta) => conta?.conta === 'rotativo';

export const ABAS_ROTATIVO = [
  { id: 'proporcao', rotulo: 'Proporção' },
  { id: 'porDia', rotulo: 'Por dia' },
];

/** Eixo dos gráficos em formato curto ("50 mil", "1,2 mi"). */
const compacto = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 });
export const formatCompacto = (valor) => compacto.format(Number(valor) || 0);

/**
 * Comprimento mínimo da barra de uma situação com valor (fração do maior valor): um valor muito pequeno perto
 * de outro muito grande (ex.: R$ 1 mil não pago ao lado de R$ 377 mil pagos) continua aparecendo como um traço.
 */
export const FRACAO_MINIMA_BARRA = 0.004;

/** Folga do eixo depois da maior barra, para o texto "valor • %" caber à direita dela. */
export const FOLGA_ROTULO = 1.45;

/**
 * Escala do eixo das barras horizontais, com marcas redondas (1, 2, 2,5 ou 5 × 10^n): o máximo cobre o maior
 * valor mais a folga do rótulo. Com `passoInteiro` (quantidade de pagamentos) o passo nunca é fracionário.
 */
export function escalaEixo(maior, { folga = FOLGA_ROTULO, marcas = 8, passoInteiro = false } = {}) {
  const alvo = (Number(maior) || 0) * folga;
  if (!(alvo > 0)) return { max: 0, passo: 0, ticks: [0] };
  const bruto = alvo / marcas;
  const magnitude = 10 ** Math.floor(Math.log10(bruto));
  const normalizado = bruto / magnitude;
  const fator = [1, 2, 2.5, 5, 10].find((f) => normalizado <= f);
  const passo = passoInteiro ? Math.max(1, Math.ceil(fator * magnitude)) : fator * magnitude;
  const quantidade = Math.ceil(alvo / passo - 1e-9);
  const ticks = Array.from({ length: quantidade + 1 }, (_v, i) => Math.round(i * passo * 1e6) / 1e6);
  return { max: ticks[ticks.length - 1], passo, ticks };
}

/**
 * Barras horizontais, uma linha por situação (Pago, Não pago e, embaixo, Aguardando pagamento), numa escala só.
 * `fracao` é a parte de cada situação no total das três (as linhas somam 100%). `desenhado` é o comprimento da
 * barra: o valor, ou o mínimo visível quando o valor é pequeno demais; o rótulo e o tooltip usam sempre `valor`.
 * Sem valor aguardando pagamento a linha dele não aparece (mesma regra dos demais gráficos, onde "Aguardando
 * pagamento" só aparece quando há valor); Pago e Não pago aparecem sempre, mesmo zerados.
 */
export function montarGraficoSituacoes(conta, metrica) {
  const valorDe = (situacao) => Number(metrica === 'valor' ? conta?.[situacao]?.valor : conta?.[situacao]?.qtd) || 0;
  const total = SITUACOES.reduce((t, s) => t + valorDe(s.key), 0);
  const maior = Math.max(0, ...SITUACOES.map((s) => valorDe(s.key)));
  const exibidas = SITUACOES.filter((s) => s.key !== 'emAberto' || valorDe(s.key) > 0);
  const linhas = exibidas.map((s) => {
    const valor = valorDe(s.key);
    return {
      key: s.key,
      rotulo: s.label,
      valor,
      fracao: total > 0 ? valor / total : 0,
      desenhado: valor > 0 ? Math.max(valor, maior * FRACAO_MINIMA_BARRA) : 0,
    };
  });
  return { total, maior, linhas };
}

/** Dias (YYYY-MM-DD) de dataInicio a dataFim, inclusive. */
export function diasDoPeriodo(dataInicio, dataFim) {
  const dias = [];
  const fim = dayjs(dataFim);
  for (let d = dayjs(dataInicio); !d.isAfter(fim, 'day'); d = d.add(1, 'day')) dias.push(d.format('YYYY-MM-DD'));
  return dias;
}

/**
 * Barras horizontais por dia de vencimento: uma linha por dia, com uma barra por situação (Pago, Não pago,
 * Aguardando pagamento). Situação zerada no período inteiro fica fora do gráfico. Por padrão todos os dias do
 * período aparecem; com `somenteDiasComPagamento` ficam só os dias com algum pagamento (lista mais curta).
 * `data` são os valores reais (rótulo e tooltip); `desenhado` é o comprimento da barra, com o mínimo visível
 * (`FRACAO_MINIMA_BARRA` do maior valor) para valores muito pequenos. `dias` (YYYY-MM-DD) acompanha as
 * categorias (DD/MM) para o clique abrir o detalhe do dia.
 */
export function montarGraficoPorDia(conta, metrica, periodo, { somenteDiasComPagamento = false } = {}) {
  const porData = new Map((conta?.porDia ?? []).map((d) => [d.data, d]));
  const valorDe = (dia, situacao) =>
    Number(metrica === 'valor' ? porData.get(dia)?.[situacao]?.valor : porData.get(dia)?.[situacao]?.qtd) || 0;
  const todosOsDias =
    periodo?.dataInicio && periodo?.dataFim ? diasDoPeriodo(periodo.dataInicio, periodo.dataFim) : Array.from(porData.keys()).sort();
  const dias = somenteDiasComPagamento ? todosOsDias.filter((dia) => SITUACOES.some((s) => valorDe(dia, s.key) > 0)) : todosOsDias;
  const comValores = SITUACOES.map((s) => ({ key: s.key, name: s.label, data: dias.map((dia) => valorDe(dia, s.key)) })).filter((s) =>
    s.data.some((v) => v > 0),
  );
  const maior = Math.max(0, ...comValores.flatMap((s) => s.data));
  const series = comValores.map((s) => ({ ...s, desenhado: s.data.map((v) => (v > 0 ? Math.max(v, maior * FRACAO_MINIMA_BARRA) : 0)) }));
  return { dias, categorias: dias.map((dia) => dayjs(dia).format('DD/MM')), series, maior };
}

/**
 * Tudo que está em aberto aparece como "Aguardando pagamento": os motivos de "em aberto" viram uma linha só (sem código,
 * então o clique abre a situação inteira). Os demais motivos ficam como vieram.
 */
export function agruparMotivosEmAberto(motivos) {
  const lista = motivos ?? [];
  const abertos = lista.filter((m) => m.situacao === 'emAberto');
  if (abertos.length === 0) return lista;
  const unico = {
    situacao: 'emAberto',
    codigo: undefined,
    descricao: ROTULO_SITUACAO.emAberto,
    qtd: abertos.reduce((s, m) => s + (Number(m.qtd) || 0), 0),
    valor: abertos.reduce((s, m) => s + (Number(m.valor) || 0), 0),
  };
  return [...lista.filter((m) => m.situacao !== 'emAberto'), unico];
}

/** Código CNAB do banco que indica estorno; os demais motivos de "não pago" contam como rejeitado. */
export const MOTIVO_ESTORNO = '02';
/** Motivo dos pagos que foram pagos depois de uma pendência. */
export const MOTIVO_PENDENCIA_PAGA = 'PENDENCIA_PAGA';

/**
 * Cores das fatias das roscas iguais às dos badges de status dos relatórios
 * (getStatusStyles em FinancialMovementReport.js / ReportApp.js, paleta do tailwind.config.js):
 * Pendência Paga = blue-400, Estorno = yellow-400, Rejeitado e demais erros = red-300.
 * "Pendência de pagamento" é o filtro "Erros" dos relatórios (estorno + rejeitado), que aparece em vermelho.
 */
export const COR_STATUS_RELATORIO = {
  pendenciaPaga: '#42A5F5',
  pendenciaPagamento: '#E57373',
  rejeitado: '#E57373',
  estorno: '#FFEE58',
};

const somaMotivos = (motivos, filtro) =>
  motivos.filter(filtro).reduce((t, m) => ({ valor: t.valor + (Number(m.valor) || 0), qtd: t.qtd + (Number(m.qtd) || 0) }), { valor: 0, qtd: 0 });

const comFracoes = (fatias) => {
  const total = fatias.reduce((t, f) => ({ valor: t.valor + f.valor, qtd: t.qtd + f.qtd }), { valor: 0, qtd: 0 });
  return { total, fatias: fatias.map((f) => ({ ...f, fracao: total.valor > 0 ? f.valor / total.valor : 0 })) };
};

/**
 * Dados das duas roscas de "Situação e motivos" (sempre por valor; a quantidade vem junto para exibição).
 * - `pendencias`: "Pendência paga" (pagos com motivo PENDENCIA_PAGA) x "Pendência de pagamento" (total não pago).
 *   A porcentagem de cada fatia é sobre a soma das duas.
 * - `erros`: o não pago dividido em "Estorno" (motivo 02) e "Rejeitado" (demais motivos), como no status dos relatórios.
 *   O rejeitado é o total não pago menos o estorno, então as duas fatias somam o não pago.
 * "Aguardando pagamento" não entra em nenhuma das duas. `detalhe` são os filtros da tela de detalhe ao clicar.
 */
export function montarRoscasPendencias(conta) {
  const motivos = conta?.motivos ?? [];
  const naoPago = { valor: Number(conta?.naoPago?.valor) || 0, qtd: Number(conta?.naoPago?.qtd) || 0 };
  const pendenciaPaga = somaMotivos(motivos, (m) => m.situacao === 'pago' && m.codigo === MOTIVO_PENDENCIA_PAGA);
  const estorno = somaMotivos(motivos, (m) => m.situacao === 'naoPago' && m.codigo === MOTIVO_ESTORNO);
  const rejeitado = { valor: Math.max(naoPago.valor - estorno.valor, 0), qtd: Math.max(naoPago.qtd - estorno.qtd, 0) };
  return {
    pendencias: comFracoes([
      { id: 'pendenciaPaga', rotulo: 'Pendência paga', cor: COR_STATUS_RELATORIO.pendenciaPaga, ...pendenciaPaga, detalhe: { situacao: 'pago', motivo: MOTIVO_PENDENCIA_PAGA } },
      { id: 'pendenciaPagamento', rotulo: 'Pendência de pagamento', cor: COR_STATUS_RELATORIO.pendenciaPagamento, ...naoPago, detalhe: { situacao: 'naoPago' } },
    ]),
    erros: comFracoes([
      { id: 'rejeitado', rotulo: 'Rejeitado', cor: COR_STATUS_RELATORIO.rejeitado, ...rejeitado, detalhe: { situacao: 'naoPago' } },
      { id: 'estorno', rotulo: 'Estorno', cor: COR_STATUS_RELATORIO.estorno, ...estorno, detalhe: { situacao: 'naoPago', motivo: MOTIVO_ESTORNO } },
    ]),
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

/**
 * Endereço da tela de detalhe de um ponto do gráfico. Parâmetros vazios são omitidos.
 * `voltarInicio`/`voltarFim`: período do dashboard quando o detalhe abre num período menor (um dia do gráfico
 * "Por dia"), para o "Voltar" devolver o dashboard no período em que estava. Não vão para a API.
 */
export function montarUrlDetalhe({ conta, grupo, situacao, motivo, busca, dataInicio, dataFim, voltarInicio, voltarFim }) {
  const params = new URLSearchParams();
  Object.entries({ conta, grupo, situacao, motivo, busca, dataInicio, dataFim, voltarInicio, voltarFim }).forEach(([chave, valor]) => {
    if (valor !== undefined && valor !== null && valor !== '') params.set(chave, valor);
  });
  return `${ROTA_DETALHE}?${params.toString()}`;
}

/** Parâmetros do "Voltar" que o detalhe preserva ao regravar a URL (vazios quando não vieram). */
export const paramsVoltar = (searchParams) => ({
  voltarInicio: searchParams.get('voltarInicio') || undefined,
  voltarFim: searchParams.get('voltarFim') || undefined,
});

/** Endereço do "Voltar" do detalhe: o período original do dashboard, se veio na URL, senão o período do detalhe. */
export function urlVoltarDashboard(searchParams) {
  const inicio = searchParams.get('voltarInicio') || searchParams.get('dataInicio') || '';
  const fim = searchParams.get('voltarFim') || searchParams.get('dataFim') || '';
  return `${ROTA_DASHBOARD}?dataInicio=${inicio}&dataFim=${fim}`;
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

/** Colunas da exportação, exatamente como na planilha de referência ("Valor  Ordem" tem dois espaços). */
export const CABECALHO_DETALHADO = ['Nome', 'CPF', 'Data Ordem', 'Valor  Ordem', 'Valor Lançamento'];

/**
 * Linhas da planilha "Detalhado": uma por ordem, com nome, CPF e valor de lançamento completos em todas as
 * linhas (repetidos, para dar para filtrar e somar por qualquer coluna). As linhas já chegam da API
 * ordenadas por nome e data da ordem. Pagamento sem ordens ligadas usa o próprio lançamento como valor da ordem.
 */
export function montarLinhasDetalhado(linhas = []) {
  const resultado = [];
  let totalGeral = 0;
  linhas.forEach((linha) => {
    const semOrdem = linha.dataOrdem == null && linha.valorOrdem == null;
    const valorOrdem = semOrdem ? Number(linha.valorLancamento) || 0 : Number(linha.valorOrdem) || 0;
    totalGeral += valorOrdem;
    resultado.push({
      nome: linha.nome || '(não identificado)',
      cpf: linha.cpf ?? '',
      dataOrdem: linha.dataOrdem ?? null,
      valorOrdem,
      valorLancamento: Number(linha.valorLancamento) || 0,
    });
  });
  return { linhas: resultado, totalGeral: Math.round(totalGeral * 100) / 100 };
}

/** Ex.: detalhe-pagamentos_cett_2026-10-20_2026-10-20.xlsx */
export function nomeArquivoExportacao(filtros) {
  const partes = ['detalhe-pagamentos', filtros.conta, filtros.grupo, filtros.situacao, filtros.dataInicio, filtros.dataFim]
    .filter(Boolean)
    .map((parte) => String(parte).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9-]+/g, '-'));
  return `${partes.join('_')}.xlsx`;
}
