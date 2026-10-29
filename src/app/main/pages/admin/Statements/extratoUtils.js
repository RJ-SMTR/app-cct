import dayjs from 'dayjs';
import { utils, writeFile } from 'xlsx-js-style';

export const ROTA_EXTRATO = '/extrato-contas';
export const ROTA_EXTRATO_DETALHE = '/extrato-contas/detalhe';

export const ROTULO_CONTA = { bilhetagem: 'Conta Bilhetagem', cett: 'Conta CETT', rotativo: 'Conta Rotativo', outras: 'Outras contas' };
export const TIPOS = [
  { key: 'C', label: 'Entradas', color: '#2e7d32' },
  { key: 'D', label: 'Saídas', color: '#d32f2f' },
];
export const ROTULO_TIPO = { C: 'Entrada', D: 'Saída' };
export const COR_TIPO = { C: '#2e7d32', D: '#d32f2f' };

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const inteiro = new Intl.NumberFormat('pt-BR');
export const formatBRL = (valor) => brl.format(Number(valor) || 0);
export const formatQtd = (qtd) => inteiro.format(Number(qtd) || 0);
export const formatMetrica = (valor, metrica) => (metrica === 'valor' ? formatBRL(valor) : formatQtd(valor));

export const toIsoDate = (data) => dayjs(data).format('YYYY-MM-DD');

export const formatData = (iso) => {
  const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '—';
};

/** Período inicial: do primeiro dia do mês até hoje. */
export const periodoPadrao = (hoje = new Date()) => [dayjs(hoje).startOf('month').toDate(), dayjs(hoje).toDate()];

export function periodoDaUrl(searchParams, hoje = new Date()) {
  const inicio = searchParams.get('dataInicio');
  const fim = searchParams.get('dataFim');
  const valido = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || '') && dayjs(s).isValid();
  if (!valido(inicio) || !valido(fim) || dayjs(fim).isBefore(dayjs(inicio))) return periodoPadrao(hoje);
  return [dayjs(inicio).toDate(), dayjs(fim).toDate()];
}

/** Gráfico diário (barras) de uma conta: entradas e saídas, em valor, por dia. */
export function montarGraficoDias(conta) {
  const dias = conta?.porDia ?? [];
  return {
    categorias: dias.map((d) => d.data),
    series: [
      { name: 'Entradas', data: dias.map((d) => Number(d.entradas) || 0) },
      { name: 'Saídas', data: dias.map((d) => Number(d.saidas) || 0) },
    ],
  };
}

/** Rosca dos históricos (PIX RECEBIDO, ENVIO DE TED...) de um tipo, por valor ou quantidade. */
export function montarGraficoHistoricos(conta, tipo, metrica) {
  const itens = (conta?.porHistorico ?? []).filter((h) => h.tipo === tipo && Number(metrica === 'valor' ? h.valor : h.qtd) > 0);
  return {
    historicos: itens,
    rotulos: itens.map((h) => h.descricao),
    valores: itens.map((h) => Number(metrica === 'valor' ? h.valor : h.qtd) || 0),
  };
}

/** Endereço do detalhe de um ponto do dashboard. Parâmetros vazios são omitidos. */
export function montarUrlDetalhe({ conta, tipo, descricao, dia, busca, dataInicio, dataFim }) {
  const params = new URLSearchParams();
  Object.entries({ conta, tipo, descricao, dia, busca, dataInicio, dataFim }).forEach(([chave, valor]) => {
    if (valor !== undefined && valor !== null && valor !== '') params.set(chave, valor);
  });
  return `${ROTA_EXTRATO_DETALHE}?${params.toString()}`;
}

export function lerFiltrosDetalhe(searchParams) {
  const get = (chave) => searchParams.get(chave) || undefined;
  return {
    conta: get('conta'),
    tipo: get('tipo'),
    descricao: get('descricao'),
    dia: get('dia'),
    busca: get('busca'),
    dataInicio: get('dataInicio'),
    dataFim: get('dataFim'),
  };
}

export const CABECALHO_PLANILHA = ['Data', 'Conta', 'Tipo', 'Valor', 'Histórico', 'Cód. histórico', 'Documento', 'CNPJ/CPF', 'Agência', 'Conta (nº)', 'NSR'];

const FORMATO_MOEDA = '"R$"\\ #,##0.00';
const ESTILO_CABECALHO = {
  font: { bold: true, color: { rgb: 'FFFFFF' } },
  fill: { patternType: 'solid', fgColor: { rgb: '1F4E79' } },
  alignment: { horizontal: 'center', vertical: 'center' },
};
const ESTILO_TOTAL = { font: { bold: true }, fill: { patternType: 'solid', fgColor: { rgb: 'D9E2F3' } } };
const numero = (v) => Math.round((Number(v) || 0) * 100) / 100;

/** Entradas e saídas somadas das linhas exportadas. */
export const somarTipos = (itens) =>
  itens.reduce(
    (t, i) => ({ entradas: t.entradas + (i.tipo === 'C' ? numero(i.valor) : 0), saidas: t.saidas + (i.tipo === 'D' ? numero(i.valor) : 0) }),
    { entradas: 0, saidas: 0 },
  );

export function montarPlanilha(itens) {
  const folha = utils.aoa_to_sheet([CABECALHO_PLANILHA]);
  CABECALHO_PLANILHA.forEach((_t, c) => {
    folha[utils.encode_cell({ r: 0, c })].s = ESTILO_CABECALHO;
  });
  itens.forEach((i, idx) => {
    const r = idx + 1;
    const texto = (c, v) => {
      folha[utils.encode_cell({ r, c })] = { t: 's', v: v ?? '', z: '@' };
    };
    texto(0, formatData(i.data));
    texto(1, ROTULO_CONTA[i.conta] ?? i.conta);
    texto(2, ROTULO_TIPO[i.tipo] ?? i.tipo);
    folha[utils.encode_cell({ r, c: 3 })] = { t: 'n', v: numero(i.valor) * (i.tipo === 'D' ? -1 : 1), z: FORMATO_MOEDA };
    texto(4, i.descricao);
    texto(5, i.codigoHistorico);
    texto(6, i.numeroDocumento);
    texto(7, i.numeroInscricao);
    texto(8, i.agencia);
    texto(9, i.numeroConta);
    folha[utils.encode_cell({ r, c: 10 })] = { t: 'n', v: Number(i.nsr) || 0 };
  });
  const total = somarTipos(itens);
  let r = itens.length + 1;
  [
    ['TOTAL ENTRADAS', total.entradas],
    ['TOTAL SAÍDAS', -total.saidas],
    ['RESULTADO', total.entradas - total.saidas],
  ].forEach(([rotulo, valor]) => {
    folha[utils.encode_cell({ r, c: 0 })] = { t: 's', v: rotulo, s: ESTILO_TOTAL };
    folha[utils.encode_cell({ r, c: 3 })] = { t: 'n', v: numero(valor), z: FORMATO_MOEDA, s: ESTILO_TOTAL };
    r += 1;
  });
  folha['!ref'] = utils.encode_range({ s: { r: 0, c: 0 }, e: { r: r - 1, c: CABECALHO_PLANILHA.length - 1 } });
  folha['!cols'] = [{ wch: 12 }, { wch: 18 }, { wch: 10 }, { wch: 18 }, { wch: 30 }, { wch: 14 }, { wch: 18 }, { wch: 16 }, { wch: 10 }, { wch: 16 }, { wch: 8 }];
  folha['!autofilter'] = { ref: utils.encode_range({ s: { r: 0, c: 0 }, e: { r: itens.length, c: CABECALHO_PLANILHA.length - 1 } }) };
  const livro = utils.book_new();
  utils.book_append_sheet(livro, folha, 'Extrato');
  return livro;
}

export const baixarPlanilha = (itens, nome) => writeFile(montarPlanilha(itens), nome);

/** Ex.: extrato_cett_entradas_2026-10-01_2026-10-20.xlsx */
export function nomeArquivoExportacao(filtros) {
  const tipo = filtros.tipo === 'C' ? 'entradas' : filtros.tipo === 'D' ? 'saidas' : '';
  return `${['extrato', filtros.conta, tipo, filtros.dia, filtros.dataInicio, filtros.dataFim]
    .filter(Boolean)
    .map((p) => String(p).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9-]+/g, '-'))
    .join('_')}.xlsx`;
}
