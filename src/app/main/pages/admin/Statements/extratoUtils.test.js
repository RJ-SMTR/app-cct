import {
  lerFiltrosDetalhe,
  montarGraficoDias,
  montarGraficoHistoricos,
  montarPlanilha,
  montarUrlDetalhe,
  nomeArquivoExportacao,
  periodoDaUrl,
  somarTipos,
} from './extratoUtils';

const conta = {
  porDia: [
    { data: '2026-10-01', entradas: 100, saidas: 30 },
    { data: '2026-10-02', entradas: 50, saidas: 0 },
  ],
  porHistorico: [
    { tipo: 'C', descricao: 'PIX RECEBIDO', qtd: 3, valor: 150 },
    { tipo: 'D', descricao: 'ENVIO DE TED', qtd: 1, valor: 30 },
    { tipo: 'C', descricao: 'ZERADO', qtd: 0, valor: 0 },
  ],
};

describe('extratoUtils', () => {
  it('monta o gráfico diário com entradas e saídas', () => {
    const g = montarGraficoDias(conta);
    expect(g.categorias).toEqual(['2026-10-01', '2026-10-02']);
    expect(g.series).toEqual([
      { name: 'Entradas', data: [100, 50] },
      { name: 'Saídas', data: [30, 0] },
    ]);
  });

  it('monta a rosca por tipo e métrica, sem fatias zeradas', () => {
    expect(montarGraficoHistoricos(conta, 'C', 'valor').rotulos).toEqual(['PIX RECEBIDO']);
    expect(montarGraficoHistoricos(conta, 'D', 'qtd').valores).toEqual([1]);
  });

  it('ida e volta da URL de detalhe, omitindo vazios', () => {
    const url = montarUrlDetalhe({ conta: 'cett', tipo: 'C', descricao: 'PIX RECEBIDO', dataInicio: '2026-10-01', dataFim: '2026-10-20', dia: '' });
    expect(url).not.toContain('dia=');
    expect(lerFiltrosDetalhe(new URLSearchParams(url.split('?')[1]))).toEqual({
      conta: 'cett',
      tipo: 'C',
      descricao: 'PIX RECEBIDO',
      dia: undefined,
      busca: undefined,
      dataInicio: '2026-10-01',
      dataFim: '2026-10-20',
    });
  });

  it('período da URL inválido volta ao padrão', () => {
    const hoje = new Date(2026, 9, 20);
    const [ini, fim] = periodoDaUrl(new URLSearchParams('dataInicio=x&dataFim=y'), hoje);
    expect(ini.getDate()).toBe(1);
    expect(fim.getDate()).toBe(20);
    const [a] = periodoDaUrl(new URLSearchParams('dataInicio=2026-09-05&dataFim=2026-09-10'), hoje);
    expect(a.getMonth()).toBe(8);
  });

  it('planilha: saída negativa e totais ao final', () => {
    const itens = [
      { data: '2026-10-01', conta: 'cett', tipo: 'C', valor: '100.10', descricao: 'PIX RECEBIDO', numeroDocumento: '1', nsr: 1 },
      { data: '2026-10-01', conta: 'cett', tipo: 'D', valor: '30.05', descricao: 'ENVIO DE TED', numeroDocumento: '2', nsr: 2 },
    ];
    expect(somarTipos(itens)).toEqual({ entradas: 100.1, saidas: 30.05 });
    const folha = montarPlanilha(itens).Sheets.Extrato;
    expect(folha.D2.v).toBe(100.1);
    expect(folha.D3.v).toBe(-30.05);
    expect(folha.A4.v).toBe('TOTAL ENTRADAS');
    expect(folha.D6.v).toBe(70.05);
  });

  it('nome de arquivo seguro', () => {
    expect(nomeArquivoExportacao({ conta: 'cett', tipo: 'C', dataInicio: '2026-10-01', dataFim: '2026-10-20' })).toBe('extrato_cett_entradas_2026-10-01_2026-10-20.xlsx');
  });
});
