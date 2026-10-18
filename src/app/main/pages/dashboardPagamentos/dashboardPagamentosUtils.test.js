import {
  formatBRL,
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
});
