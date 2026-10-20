import {
  formatBRL,
  linhasExportacaoDetalhe,
  linhasFiltrosExportacao,
  nomeArquivoExportacao,
  lerFiltrosDetalhe,
  montarGraficoGrupos,
  montarGraficoMotivos,
  montarUrlDetalhe,
  periodoDaUrl,
  periodoPadrao,
  toIsoDate,
} from './dashboardPagamentosUtils';

const conta = {
  conta: 'bilhetagem',
  grupos: [
    { grupo: 'VLT', pago: { qtd: 9, valor: 1000 }, naoPago: { qtd: 1, valor: 50 }, emAberto: { qtd: 0, valor: 0 } },
    { grupo: 'STPL', pago: { qtd: 5, valor: 500 }, naoPago: { qtd: 0, valor: 0 }, emAberto: { qtd: 2, valor: 20 } },
  ],
  motivos: [
    { situacao: 'pago', codigo: 'EFETIVADO', descricao: 'Efetivado', qtd: 14, valor: 1500 },
    { situacao: 'naoPago', codigo: '02', descricao: 'Débito não efetuado', qtd: 1, valor: 50 },
    { situacao: 'naoPago', codigo: 'SEM_MOTIVO', descricao: 'Motivo não informado pelo banco', qtd: 2, valor: 7 },
  ],
};

describe('dashboardPagamentosUtils', () => {
  it('formata valores em reais', () => {
    expect(formatBRL(1197.67).replace(/\s/g, ' ')).toBe('R$ 1.197,67');
  });

  it('monta o gráfico empilhado por consórcio/modal, na ordem da API, por quantidade ou por valor', () => {
    const porQtd = montarGraficoGrupos(conta, 'qtd');
    expect(porQtd.categorias).toEqual(['VLT', 'STPL']);
    expect(porQtd.series.map((s) => s.name)).toEqual(['Pago', 'Não pago', 'Em aberto']);
    expect(porQtd.series[0].data).toEqual([9, 5]);
    expect(montarGraficoGrupos(conta, 'valor').series[1].data).toEqual([50, 0]);
  });

  it('não quebra com conta ausente', () => {
    expect(montarGraficoGrupos(undefined, 'qtd').categorias).toEqual([]);
    expect(montarGraficoMotivos(undefined, 'naoPago', 'qtd').valores).toEqual([]);
  });

  it('monta a rosca só com os motivos da situação pedida', () => {
    const rosca = montarGraficoMotivos(conta, 'naoPago', 'qtd');
    expect(rosca.rotulos).toEqual(['Débito não efetuado', 'Motivo não informado pelo banco']);
    expect(rosca.valores).toEqual([1, 2]);
    expect(rosca.motivos.map((m) => m.codigo)).toEqual(['02', 'SEM_MOTIVO']);
  });

  it('monta a URL do detalhe omitindo parâmetros vazios e a lê de volta', () => {
    const url = montarUrlDetalhe({ conta: 'bilhetagem', grupo: 'STPL', situacao: 'naoPago', motivo: '', dataInicio: '2026-09-01', dataFim: '2026-09-30' });
    expect(url).toBe('/dashboard-pagamentos/detalhe?conta=bilhetagem&grupo=STPL&situacao=naoPago&dataInicio=2026-09-01&dataFim=2026-09-30');
    expect(lerFiltrosDetalhe(new URLSearchParams(url.split('?')[1]))).toEqual({
      conta: 'bilhetagem', grupo: 'STPL', situacao: 'naoPago', motivo: undefined, busca: undefined, dataInicio: '2026-09-01', dataFim: '2026-09-30',
    });
  });

  it('inclui a busca por favorecido na URL do detalhe e a lê de volta', () => {
    const url = montarUrlDetalhe({ conta: 'rotativo', busca: 'paulo cesar', dataInicio: '2026-09-01', dataFim: '2026-09-30' });
    expect(url).toContain('busca=paulo+cesar');
    expect(lerFiltrosDetalhe(new URLSearchParams(url.split('?')[1])).busca).toBe('paulo cesar');
  });

  it('o período padrão vai do início do mês até hoje', () => {
    const [inicio, fim] = periodoPadrao(new Date(2026, 9, 17));
    expect(toIsoDate(inicio)).toBe('2026-10-01');
    expect(toIsoDate(fim)).toBe('2026-10-17');
  });

  it('lê o período da URL e volta ao padrão quando ele é inválido', () => {
    const hoje = new Date(2026, 9, 17);
    const [i, f] = periodoDaUrl(new URLSearchParams('dataInicio=2026-09-01&dataFim=2026-09-30'), hoje);
    expect([toIsoDate(i), toIsoDate(f)]).toEqual(['2026-09-01', '2026-09-30']);
    const [pi, pf] = periodoDaUrl(new URLSearchParams('dataInicio=2026-09-30&dataFim=2026-09-01'), hoje);
    expect([toIsoDate(pi), toIsoDate(pf)]).toEqual(['2026-10-01', '2026-10-17']);
    expect(toIsoDate(periodoDaUrl(new URLSearchParams(''), hoje)[0])).toBe('2026-10-01');
  });

  it('monta as linhas da exportação com os mesmos dados da tabela', () => {
    const linhas = linhasExportacaoDetalhe([
      { detalheAId: 7, data: '2026-10-20', favorecido: 'ANTONIO ROBERTO CATALDO', cpfCnpj: '29735025787', grupo: 'TEC', situacao: 'pago', motivo: 'EFETIVADO', motivoDescricao: 'Efetivado', valor: '815.00', banco: 260, agencia: '0001', conta: '119369977-5', remessaId: 1131 },
      { detalheAId: 8, data: '2026-10-20', favorecido: null, situacao: 'naoPago', motivo: 'AR', valor: 0 },
    ]);
    expect(linhas[0]).toEqual({
      'Data de pagamento': '20/10/2026', Favorecido: 'ANTONIO ROBERTO CATALDO', 'CPF/CNPJ': '29735025787', 'Consórcio / Grupo': 'TEC', Situação: 'Pago', Motivo: 'Efetivado',
      Valor: 815, Banco: 260, Agência: '0001', Conta: '119369977-5', Remessa: 1131, 'Id do pagamento': 7,
    });
    expect(linhas[1]).toMatchObject({ Favorecido: '(não identificado)', Situação: 'Não pago', Motivo: 'AR', Valor: 0, Banco: '' });
  });

  it('descreve os filtros e os totais da exportação', () => {
    const linhas = linhasFiltrosExportacao({ conta: 'cett', situacao: 'pago', dataInicio: '2026-10-20', dataFim: '2026-10-20' }, 1810, 483565);
    expect(linhas).toEqual(expect.arrayContaining([
      ['Conta', 'Conta CETT'], ['Situação', 'Pago'], ['Grupo', 'Todos'], ['Período', '20/10/2026 a 20/10/2026'], ['Quantidade de pagamentos', 1810], ['Valor total', 483565],
    ]));
  });

  it('gera um nome de arquivo seguro a partir dos filtros', () => {
    expect(nomeArquivoExportacao({ conta: 'cett', situacao: 'pago', dataInicio: '2026-10-20', dataFim: '2026-10-20' })).toBe('detalhe-pagamentos_cett_pago_2026-10-20_2026-10-20.xlsx');
    expect(nomeArquivoExportacao({ conta: 'bilhetagem', grupo: 'Santa Cruz', dataInicio: '2026-10-01', dataFim: '2026-10-31' })).toBe('detalhe-pagamentos_bilhetagem_Santa-Cruz_2026-10-01_2026-10-31.xlsx');
  });
});
