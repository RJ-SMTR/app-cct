import { utils, writeFile } from 'xlsx-js-style';
import { CABECALHO_DETALHADO } from './dashboardPagamentosUtils';

const FORMATO_MOEDA = '"R$"\\ #,##0.00';
const FORMATO_DATA = 'dd/mm/yyyy';

const ESTILO_CABECALHO = {
  font: { bold: true, color: { rgb: 'FFFFFF' } },
  fill: { patternType: 'solid', fgColor: { rgb: '1F4E79' } },
  alignment: { horizontal: 'center', vertical: 'center' },
};
const ESTILO_TOTAL = { font: { bold: true }, fill: { patternType: 'solid', fgColor: { rgb: 'D9E2F3' } } };
const ESTILO_TOTAL_VALOR = { font: { bold: true }, fill: { patternType: 'solid', fgColor: { rgb: 'FFC000' } }, numFmt: FORMATO_MOEDA };

/** `YYYY-MM-DD` -> Date ao meio-dia local (evita deslocar o dia por fuso ao gravar no Excel). */
const paraData = (iso) => {
  if (!iso) return null;
  const [ano, mes, dia] = iso.split('-').map(Number);
  return new Date(ano, mes - 1, dia, 12);
};

/**
 * Monta a planilha "Detalhado" no layout da planilha de referência: cabeçalho azul, CPF como texto, data e valores
 * formatados, filtro no cabeçalho e a linha "TOTAL GERAL" (soma dos valores das ordens) ao final.
 * `linhas` vem de `montarLinhasDetalhado`.
 */
export function montarPlanilhaDetalhado(linhas, totalGeral) {
  const folha = utils.aoa_to_sheet([CABECALHO_DETALHADO]);
  CABECALHO_DETALHADO.forEach((_titulo, coluna) => {
    folha[utils.encode_cell({ r: 0, c: coluna })].s = ESTILO_CABECALHO;
  });

  linhas.forEach((linha, indice) => {
    const r = indice + 1;
    const data = paraData(linha.dataOrdem);
    folha[utils.encode_cell({ r, c: 0 })] = { t: 's', v: linha.nome };
    folha[utils.encode_cell({ r, c: 1 })] = { t: 's', v: linha.cpf, z: '@' };
    folha[utils.encode_cell({ r, c: 2 })] = data ? { t: 'd', v: data, z: FORMATO_DATA } : { t: 's', v: '' };
    folha[utils.encode_cell({ r, c: 3 })] = { t: 'n', v: linha.valorOrdem, z: FORMATO_MOEDA };
    folha[utils.encode_cell({ r, c: 4 })] =
      linha.valorLancamento == null ? { t: 's', v: '' } : { t: 'n', v: linha.valorLancamento, z: FORMATO_MOEDA };
  });

  const linhaTotal = linhas.length + 1;
  folha[utils.encode_cell({ r: linhaTotal, c: 0 })] = { t: 's', v: 'TOTAL GERAL', s: ESTILO_TOTAL };
  [1, 2, 4].forEach((c) => {
    folha[utils.encode_cell({ r: linhaTotal, c })] = { t: 's', v: '', s: ESTILO_TOTAL };
  });
  folha[utils.encode_cell({ r: linhaTotal, c: 3 })] = { t: 'n', v: totalGeral, z: FORMATO_MOEDA, s: ESTILO_TOTAL_VALOR };

  folha['!ref'] = utils.encode_range({ s: { r: 0, c: 0 }, e: { r: linhaTotal, c: CABECALHO_DETALHADO.length - 1 } });
  folha['!cols'] = [39.17, 14.17, 13.17, 17.17, 17.17].map((wch) => ({ wch }));
  folha['!autofilter'] = { ref: utils.encode_range({ s: { r: 0, c: 0 }, e: { r: Math.max(linhas.length, 1), c: CABECALHO_DETALHADO.length - 1 } }) };
  return folha;
}

/** Gera e baixa o arquivo .xlsx com a aba "Detalhado". */
export function baixarPlanilhaDetalhado(linhas, totalGeral, nomeArquivo) {
  const livro = utils.book_new();
  utils.book_append_sheet(livro, montarPlanilhaDetalhado(linhas, totalGeral), 'Detalhado');
  writeFile(livro, nomeArquivo, { cellStyles: true });
}
