import { read, utils, write } from 'xlsx-js-style';
import { montarLinhasDetalhado } from './dashboardPagamentosUtils';
import { montarPlanilhaDetalhado } from './planilhaDetalhado';

const lerDeVolta = (linhasApi) => {
  const { linhas, totalGeral } = montarLinhasDetalhado(linhasApi);
  const livro = utils.book_new();
  utils.book_append_sheet(livro, montarPlanilhaDetalhado(linhas, totalGeral), 'Detalhado');
  const buffer = write(livro, { type: 'buffer', bookType: 'xlsx', cellStyles: true });
  return read(buffer, { type: 'buffer', cellStyles: true, cellDates: true }).Sheets.Detalhado;
};

describe('planilha Detalhado', () => {
  const api = [
    { detalheAId: 1, nome: 'ABDON ALVIM DE QUEIROZ', cpf: '38624400791', dataOrdem: '2026-10-16', valorOrdem: 80, valorLancamento: 340 },
    { detalheAId: 1, nome: 'ABDON ALVIM DE QUEIROZ', cpf: '38624400791', dataOrdem: '2026-10-17', valorOrdem: 150, valorLancamento: 340 },
    { detalheAId: 1, nome: 'ABDON ALVIM DE QUEIROZ', cpf: '38624400791', dataOrdem: '2026-10-18', valorOrdem: 110, valorLancamento: 340 },
    { detalheAId: 2, nome: 'ABILIO RODRIGUES DE SOUZA', cpf: '49130463734', dataOrdem: '2026-10-16', valorOrdem: 130, valorLancamento: 285 },
  ];

  it('tem o cabeçalho e as colunas da planilha de referência, com nome/CPF/lançamento só na primeira linha', () => {
    const folha = lerDeVolta(api);
    const linhas = utils.sheet_to_json(folha, { header: 1, defval: null, raw: true });
    expect(linhas[0]).toEqual(['Nome', 'CPF', 'Data Ordem', 'Valor  Ordem', 'Valor Lançamento']);
    expect(linhas[1].slice(0, 2)).toEqual(['ABDON ALVIM DE QUEIROZ', '38624400791']);
    expect(linhas[1][3]).toBe(80);
    expect(linhas[1][4]).toBe(340);
    // linhas seguintes da mesma pessoa: sem nome, sem CPF e sem lançamento
    expect(linhas[2][0] || '').toBe('');
    expect(linhas[2][1] || '').toBe('');
    expect(linhas[2][3]).toBe(150);
    expect(linhas[2][4] || '').toBe('');
    expect(linhas[4][0]).toBe('ABILIO RODRIGUES DE SOUZA');
  });

  it('termina com TOTAL GERAL, a soma dos valores das ordens, logo abaixo da última linha', () => {
    const folha = lerDeVolta(api);
    expect(folha.A6.v).toBe('TOTAL GERAL');
    expect(folha.D6.v).toBe(470);
    expect(folha['!ref']).toBe('A1:E6');
  });

  it('formata CPF como texto, data como dd/mm/aaaa, valores em R$ e aplica as cores do cabeçalho e do total', () => {
    const folha = lerDeVolta(api);
    expect(folha.B2.t).toBe('s');
    expect(folha.C2.w).toBe('16/10/2026');
    expect(folha.D2.z).toBe('"R$"\\ #,##0.00');
    expect(folha.E2.z).toBe('"R$"\\ #,##0.00');
    expect(folha.A1.s.fgColor.rgb).toBe('1F4E79');
    expect(folha.A6.s.fgColor.rgb).toBe('D9E2F3');
    expect(folha.D6.s.fgColor.rgb).toBe('FFC000');
  });
});
