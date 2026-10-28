import { utils, writeFile } from 'xlsx-js-style';

export const ROTULO_SITUACAO = { devendo: 'Devendo', quitado: 'Quitado' };

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export const formatBRL = (valor) => brl.format(Number(valor) || 0);

export const formatData = (iso) => {
  const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '—';
};

/** CPF (11 dígitos) ou CNPJ (14) formatado; outro formato volta como veio. */
export const formatCpfCnpj = (valor) => {
  const d = String(valor || '').replace(/\D/g, '');
  if (d.length === 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  if (d.length === 14) return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  return valor || '—';
};

export const CABECALHO_PLANILHA = ['Guardador', 'CPF/CNPJ', 'Data de referência', 'Valor pago', 'Valor a pagar', 'Valor indevido', 'Já debitado', 'Deve (saldo devedor)', 'Situação'];

const FORMATO_MOEDA = '"R$"\\ #,##0.00';
const ESTILO_CABECALHO = {
  font: { bold: true, color: { rgb: 'FFFFFF' } },
  fill: { patternType: 'solid', fgColor: { rgb: '1F4E79' } },
  alignment: { horizontal: 'center', vertical: 'center' },
};
const ESTILO_TOTAL = { font: { bold: true }, fill: { patternType: 'solid', fgColor: { rgb: 'D9E2F3' } } };

const numero = (v) => Math.round((Number(v) || 0) * 100) / 100;

/** Totais das linhas exportadas (a soma é refeita aqui para a planilha bater com o que ela mostra). */
export function somarLinhas(itens) {
  return itens.reduce(
    (t, i) => ({
      valorIndevido: t.valorIndevido + numero(i.valorIndevido),
      valorDebitado: t.valorDebitado + numero(i.valorDebitado),
      saldoDevedor: t.saldoDevedor + numero(i.saldoDevedor),
    }),
    { valorIndevido: 0, valorDebitado: 0, saldoDevedor: 0 },
  );
}

export function montarPlanilha(itens) {
  const folha = utils.aoa_to_sheet([CABECALHO_PLANILHA]);
  CABECALHO_PLANILHA.forEach((_t, c) => {
    folha[utils.encode_cell({ r: 0, c })].s = ESTILO_CABECALHO;
  });
  itens.forEach((i, idx) => {
    const r = idx + 1;
    folha[utils.encode_cell({ r, c: 0 })] = { t: 's', v: i.guardador };
    folha[utils.encode_cell({ r, c: 1 })] = { t: 's', v: i.cpfCnpj || '', z: '@' };
    folha[utils.encode_cell({ r, c: 2 })] = { t: 's', v: i.dataReferencia ? formatData(i.dataReferencia) : '' };
    [i.valorPago, i.valorPagar, i.valorIndevido, i.valorDebitado, i.saldoDevedor].forEach((v, k) => {
      folha[utils.encode_cell({ r, c: 3 + k })] = { t: 'n', v: numero(v), z: FORMATO_MOEDA };
    });
    folha[utils.encode_cell({ r, c: 8 })] = { t: 's', v: ROTULO_SITUACAO[i.situacao] ?? i.situacao };
  });
  const total = somarLinhas(itens);
  const r = itens.length + 1;
  folha[utils.encode_cell({ r, c: 0 })] = { t: 's', v: 'TOTAL GERAL', s: ESTILO_TOTAL };
  [5, 6, 7].forEach((c, k) => {
    const v = [total.valorIndevido, total.valorDebitado, total.saldoDevedor][k];
    folha[utils.encode_cell({ r, c })] = { t: 'n', v: numero(v), z: FORMATO_MOEDA, s: ESTILO_TOTAL };
  });
  folha['!ref'] = utils.encode_range({ s: { r: 0, c: 0 }, e: { r, c: CABECALHO_PLANILHA.length - 1 } });
  folha['!cols'] = [{ wch: 38 }, { wch: 18 }, { wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 20 }, { wch: 12 }];
  folha['!autofilter'] = { ref: utils.encode_range({ s: { r: 0, c: 0 }, e: { r: itens.length, c: CABECALHO_PLANILHA.length - 1 } }) };
  const livro = utils.book_new();
  utils.book_append_sheet(livro, folha, 'Pagamentos indevidos');
  return livro;
}

export function baixarPlanilha(itens, nomeArquivo) {
  writeFile(montarPlanilha(itens), nomeArquivo);
}

export const nomeArquivo = (hoje = new Date()) => `pagamentos-indevidos-guardadores_${hoje.toISOString().slice(0, 10)}.xlsx`;
