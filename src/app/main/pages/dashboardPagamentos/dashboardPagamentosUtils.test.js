import {
  formatBRL,
  gruposDoFiltro,
  CABECALHO_DETALHADO,
  montarLinhasDetalhado,
  nomeArquivoExportacao,
  lerFiltrosDetalhe,
  montarGraficoGrupos,
  agruparMotivosEmAberto,
  abasGraficoBarras,
  montarGraficoAguardando,
  montarGraficoGruposDuplo,
  montarGraficoMotivos,
  montarRoscasPendencias,
  COR_STATUS_RELATORIO,
  montarUrlDetalhe,
  periodoDaUrl,
  periodoPadrao,
  toIsoDate,
  usaGraficosRotativo,
  montarGraficoSituacoes,
  montarGraficoAguardandoRotativo,
  abasRotativo,
  formatCompacto,
  escalaEixo,
  paramsVoltar,
  urlVoltarDashboard,
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
    expect(porQtd.series.map((s) => s.name)).toEqual(['Pago', 'Não pago', 'Aguardando pagamento']);
    expect(porQtd.series[0].data).toEqual([9, 5]);
    expect(montarGraficoGrupos(conta, 'valor').series[1].data).toEqual([50, 0]);
  });

  it('barras duplas: uma categoria por consórcio e duas barras (Pago e Não pago), sem Aguardando pagamento', () => {
    const g = montarGraficoGruposDuplo(conta, 'valor');
    expect(g.categorias).toEqual(['VLT', 'STPL']);
    expect(g.series.map((x) => [x.key, x.group])).toEqual([
      ['pago', 'pago'],
      ['naoPago', 'naoPago'],
    ]);
    expect(g.series.map((x) => x.name)).not.toContain('Aguardando pagamento');
    // valores zerados não aparecem: viram null (sem barra e sem tooltip "R$ 0,00")
    expect(g.series[0].data).toEqual([1000, 500]);
    expect(g.series[1].data).toEqual([50, null]);
    // consórcio/modal só com Aguardando pagamento fica fora do gráfico
    const soEmAberto = { grupos: [...conta.grupos, { grupo: 'BRT', pago: { qtd: 0, valor: 0 }, naoPago: { qtd: 0, valor: 0 }, emAberto: { qtd: 3, valor: 30 } }] };
    expect(montarGraficoGruposDuplo(soEmAberto, 'valor').categorias).toEqual(['VLT', 'STPL']);
    // consórcio/modal sem nenhum valor fica fora do gráfico
    const comVazio = { grupos: [...conta.grupos, { grupo: 'GTU', pago: { qtd: 0, valor: 0 }, naoPago: { qtd: 0, valor: 0 }, emAberto: { qtd: 0, valor: 0 } }] };
    expect(montarGraficoGruposDuplo(comVazio, 'valor').categorias).toEqual(['VLT', 'STPL']);
    expect(montarGraficoGruposDuplo(undefined, 'qtd').categorias).toEqual([]);
  });

  it('monta o gráfico de "Aguardando pagamento" só com os consórcios/modais que têm valor aguardando', () => {
    const g = montarGraficoAguardando(conta, 'valor');
    expect(g.categorias).toEqual(['STPL']);
    expect(g.series).toEqual([{ key: 'emAberto', name: 'Aguardando pagamento', data: [20] }]);
    expect(montarGraficoAguardando(conta, 'qtd').series[0].data).toEqual([2]);
    expect(montarGraficoAguardando(undefined, 'qtd').categorias).toEqual([]);
  });

  it('abas do gráfico de barras: duas com pago e aguardando, uma só quando há apenas um deles', () => {
    const pagos = montarGraficoGruposDuplo(conta, 'valor');
    const aguardando = montarGraficoAguardando(conta, 'valor');
    const vazio = { categorias: [], series: [] };
    expect(abasGraficoBarras(pagos, aguardando).map((a) => a.id)).toEqual(['pagos', 'aguardando']);
    expect(abasGraficoBarras(vazio, aguardando)).toEqual([{ id: 'aguardando', rotulo: 'Aguardando pagamento' }]);
    expect(abasGraficoBarras(pagos, vazio).map((a) => a.id)).toEqual(['pagos']);
    expect(abasGraficoBarras(vazio, vazio)).toEqual([]);
  });

  it('motivos em aberto viram uma linha só, "Aguardando pagamento", sem código', () => {
    const motivos = [
      { situacao: 'pago', codigo: 'EFETIVADO', descricao: 'Efetivado', qtd: 5, valor: 50 },
      { situacao: 'emAberto', codigo: 'AGUARDANDO', descricao: 'Aguardando pagamento', qtd: 35, valor: 100 },
      { situacao: 'emAberto', codigo: 'ENVIADO', descricao: 'Enviado ao banco (aguardando retorno)', qtd: 1, valor: 20 },
    ];
    expect(agruparMotivosEmAberto(motivos)).toEqual([
      motivos[0],
      { situacao: 'emAberto', codigo: undefined, descricao: 'Aguardando pagamento', qtd: 36, valor: 120 },
    ]);
    expect(agruparMotivosEmAberto(motivos.slice(0, 1))).toEqual(motivos.slice(0, 1));
    expect(agruparMotivosEmAberto(undefined)).toEqual([]);
  });

  it('roscas: pendência paga x pendência de pagamento (% sobre a soma) e rejeitado x estorno', () => {
    const c = {
      naoPago: { qtd: 4, valor: 300 },
      motivos: [
        { situacao: 'pago', codigo: 'EFETIVADO', qtd: 10, valor: 5000 },
        { situacao: 'pago', codigo: 'PENDENCIA_PAGA', qtd: 2, valor: 900 },
        { situacao: 'naoPago', codigo: '02', qtd: 1, valor: 100 },
        { situacao: 'naoPago', codigo: 'AB', qtd: 3, valor: 200 },
        { situacao: 'emAberto', codigo: undefined, qtd: 7, valor: 700 },
      ],
    };
    const { pendencias, erros } = montarRoscasPendencias(c);
    expect(pendencias.fatias.map((f) => [f.rotulo, f.valor, f.qtd, f.fracao])).toEqual([
      ['Pendência paga', 900, 2, 0.75],
      ['Pendência de pagamento', 300, 4, 0.25],
    ]);
    expect(pendencias.total).toEqual({ valor: 1200, qtd: 6 });
    expect(erros.fatias.map((f) => [f.rotulo, f.valor, f.qtd])).toEqual([
      ['Rejeitado', 200, 3],
      ['Estorno', 100, 1],
    ]);
    expect(erros.fatias[1].detalhe).toEqual({ situacao: 'naoPago', motivo: '02' });
    // mesmas cores dos badges de status dos relatórios
    expect(pendencias.fatias.map((f) => f.cor)).toEqual(['#42A5F5', '#E57373']);
    expect(erros.fatias.map((f) => f.cor)).toEqual(['#E57373', '#FFEE58']);
    expect(COR_STATUS_RELATORIO.estorno).toBe('#FFEE58');
    // sem dados: tudo zerado, sem dividir por zero
    const vazio = montarRoscasPendencias(undefined);
    expect(vazio.pendencias.total).toEqual({ valor: 0, qtd: 0 });
    expect(vazio.erros.fatias.every((f) => f.fracao === 0)).toBe(true);
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

  it('monta as linhas do Detalhado com nome, CPF e valor de lançamento completos em todas as linhas', () => {
    const { linhas, totalGeral } = montarLinhasDetalhado([
      { detalheAId: 1, nome: 'ABDON ALVIM DE QUEIROZ', cpf: '38624400791', dataOrdem: '2026-10-16', valorOrdem: 80, valorLancamento: 340 },
      { detalheAId: 1, nome: 'ABDON ALVIM DE QUEIROZ', cpf: '38624400791', dataOrdem: '2026-10-17', valorOrdem: 150, valorLancamento: 340 },
      { detalheAId: 1, nome: 'ABDON ALVIM DE QUEIROZ', cpf: '38624400791', dataOrdem: '2026-10-18', valorOrdem: 110, valorLancamento: 340 },
      { detalheAId: 2, nome: 'ABILIO RODRIGUES DE SOUZA', cpf: '49130463734', dataOrdem: '2026-10-16', valorOrdem: 130, valorLancamento: 285 },
      { detalheAId: 2, nome: 'ABILIO RODRIGUES DE SOUZA', cpf: '49130463734', dataOrdem: '2026-10-17', valorOrdem: 155, valorLancamento: 285 },
    ]);
    expect(linhas).toEqual([
      { nome: 'ABDON ALVIM DE QUEIROZ', cpf: '38624400791', dataOrdem: '2026-10-16', valorOrdem: 80, valorLancamento: 340 },
      { nome: 'ABDON ALVIM DE QUEIROZ', cpf: '38624400791', dataOrdem: '2026-10-17', valorOrdem: 150, valorLancamento: 340 },
      { nome: 'ABDON ALVIM DE QUEIROZ', cpf: '38624400791', dataOrdem: '2026-10-18', valorOrdem: 110, valorLancamento: 340 },
      { nome: 'ABILIO RODRIGUES DE SOUZA', cpf: '49130463734', dataOrdem: '2026-10-16', valorOrdem: 130, valorLancamento: 285 },
      { nome: 'ABILIO RODRIGUES DE SOUZA', cpf: '49130463734', dataOrdem: '2026-10-17', valorOrdem: 155, valorLancamento: 285 },
    ]);
    expect(totalGeral).toBe(625);
  });

  it('pessoa com dois pagamentos: nome, CPF e o lançamento de cada pagamento em todas as linhas', () => {
    const { linhas } = montarLinhasDetalhado([
      { detalheAId: 1, nome: 'A', cpf: '1', dataOrdem: '2026-10-01', valorOrdem: 10, valorLancamento: 10 },
      { detalheAId: 2, nome: 'A', cpf: '1', dataOrdem: '2026-10-08', valorOrdem: 20, valorLancamento: 20 },
    ]);
    expect(linhas.map((l) => [l.nome, l.valorLancamento])).toEqual([['A', 10], ['A', 20]]);
  });

  it('pagamento sem ordens ligadas usa o lançamento como valor da ordem e entra no total', () => {
    const { linhas, totalGeral } = montarLinhasDetalhado([
      { detalheAId: 9, nome: null, cpf: null, dataOrdem: null, valorOrdem: null, valorLancamento: 50.5 },
    ]);
    expect(linhas[0]).toEqual({ nome: '(não identificado)', cpf: '', dataOrdem: null, valorOrdem: 50.5, valorLancamento: 50.5 });
    expect(totalGeral).toBe(50.5);
  });

  it('o cabeçalho da exportação tem exatamente as colunas da planilha de referência', () => {
    expect(CABECALHO_DETALHADO).toEqual(['Nome', 'CPF', 'Data Ordem', 'Valor  Ordem', 'Valor Lançamento']);
  });

  it('gera um nome de arquivo seguro a partir dos filtros', () => {
    expect(nomeArquivoExportacao({ conta: 'cett', situacao: 'pago', dataInicio: '2026-10-20', dataFim: '2026-10-20' })).toBe('detalhe-pagamentos_cett_pago_2026-10-20_2026-10-20.xlsx');
    expect(nomeArquivoExportacao({ conta: 'bilhetagem', grupo: 'GTU,VLT', dataInicio: '2026-10-01', dataFim: '2026-10-31' })).toBe('detalhe-pagamentos_bilhetagem_GTU-VLT_2026-10-01_2026-10-31.xlsx');
    expect(gruposDoFiltro(' GTU, VLT ,,')).toEqual(['GTU', 'VLT']);
    expect(gruposDoFiltro(undefined)).toEqual([]);
    expect(nomeArquivoExportacao({ conta: 'bilhetagem', grupo: 'Santa Cruz', dataInicio: '2026-10-01', dataFim: '2026-10-31' })).toBe('detalhe-pagamentos_bilhetagem_Santa-Cruz_2026-10-01_2026-10-31.xlsx');
  });
});

describe('Conta Rotativo: abas Pago / Não pago e Aguardando pagamento', () => {
  const rotativo = {
    conta: 'rotativo',
    pago: { qtd: 30, valor: 900 },
    naoPago: { qtd: 2, valor: 100 },
    emAberto: { qtd: 0, valor: 0 },
  };

  it('só a Conta Rotativo usa os gráficos de barras horizontais por situação', () => {
    expect(usaGraficosRotativo(rotativo)).toBe(true);
    expect(usaGraficosRotativo({ conta: 'bilhetagem' })).toBe(false);
    expect(usaGraficosRotativo({ conta: 'cett' })).toBe(false);
    expect(usaGraficosRotativo(undefined)).toBe(false);
  });

  it('abas: sem valor aguardando, só "Pago / Não pago" (sem "Por dia")', () => {
    expect(abasRotativo(rotativo, 'valor')).toEqual([{ id: 'pagos', rotulo: 'Pago / Não pago' }]);
  });

  it('abas: com valor aguardando, "Pago / Não pago" e "Aguardando pagamento"', () => {
    const c = { ...rotativo, emAberto: { qtd: 3, valor: 15800 } };
    expect(abasRotativo(c, 'valor').map((a) => a.id)).toEqual(['pagos', 'aguardando']);
    expect(abasRotativo(c, 'qtd').map((a) => a.rotulo)).toEqual(['Pago / Não pago', 'Aguardando pagamento']);
  });

  it('abas: só aguardando no período mostra só a aba de aguardando', () => {
    const c = { conta: 'rotativo', pago: { qtd: 0, valor: 0 }, naoPago: { qtd: 0, valor: 0 }, emAberto: { qtd: 1, valor: 10 } };
    expect(abasRotativo(c, 'valor')).toEqual([{ id: 'aguardando', rotulo: 'Aguardando pagamento' }]);
  });

  it('Pago / Não pago: uma linha para cada, com a fração de Pago + Não pago (aguardando fica de fora)', () => {
    const g = montarGraficoSituacoes({ ...rotativo, emAberto: { qtd: 9, valor: 5000 } }, 'valor');
    expect(g.total).toBe(1000);
    expect(g.maior).toBe(900);
    expect(g.linhas).toEqual([
      { key: 'pago', rotulo: 'Pago', valor: 900, fracao: 0.9, desenhado: 900 },
      { key: 'naoPago', rotulo: 'Não pago', valor: 100, fracao: 0.1, desenhado: 100 },
    ]);
  });

  it('Pago / Não pago: por quantidade usa qtd', () => {
    const g = montarGraficoSituacoes(rotativo, 'qtd');
    expect(g.linhas.map((l) => [l.key, l.valor, l.fracao])).toEqual([
      ['pago', 30, 30 / 32],
      ['naoPago', 2, 2 / 32],
    ]);
  });

  it('Pago / Não pago: valor muito pequeno ganha o comprimento mínimo visível, mas o valor e a fração são os reais', () => {
    const g = montarGraficoSituacoes({ conta: 'rotativo', pago: { valor: 377067.58 }, naoPago: { valor: 1246 } }, 'valor');
    const [pago, naoPago] = g.linhas;
    expect(pago.desenhado).toBe(377067.58);
    expect(naoPago.desenhado).toBe(1508.27032); // 0,4% do maior > 1.246
    expect(naoPago.valor).toBe(1246);
    expect(pago.fracao).toBeCloseTo(0.997, 3);
    expect(naoPago.fracao).toBeCloseTo(0.0033, 4);
  });

  it('Pago / Não pago: conta sem pagamento fica com os dois zerados', () => {
    const g = montarGraficoSituacoes({ conta: 'rotativo' }, 'valor');
    expect(g.total).toBe(0);
    expect(g.linhas.map((l) => [l.key, l.valor, l.fracao, l.desenhado])).toEqual([
      ['pago', 0, 0, 0],
      ['naoPago', 0, 0, 0],
    ]);
  });

  it('Aguardando pagamento: uma linha com o valor aguardando na métrica', () => {
    const c = { ...rotativo, emAberto: { qtd: 3, valor: 15800 } };
    expect(montarGraficoAguardandoRotativo(c, 'valor')).toEqual({
      maior: 15800,
      linhas: [{ key: 'emAberto', rotulo: 'Aguardando pagamento', valor: 15800, desenhado: 15800 }],
    });
    expect(montarGraficoAguardandoRotativo(c, 'qtd').linhas[0].valor).toBe(3);
  });

  it('escalaEixo: marcas redondas cobrindo o maior valor com a folga do rótulo', () => {
    expect(escalaEixo(377067.58)).toEqual({ max: 600000, passo: 100000, ticks: [0, 100000, 200000, 300000, 400000, 500000, 600000] });
    const e = escalaEixo(1000);
    expect(e.max).toBeGreaterThanOrEqual(1450);
    expect(e.ticks[0]).toBe(0);
    expect(e.ticks.every((t, i) => i === 0 || t > e.ticks[i - 1])).toBe(true);
  });

  it('escalaEixo: quantidade sem passo fracionário e zero sem escala', () => {
    expect(escalaEixo(3, { passoInteiro: true }).ticks).toEqual([0, 1, 2, 3, 4, 5]);
    expect(escalaEixo(0)).toEqual({ max: 0, passo: 0, ticks: [0] });
  });

  it('formatCompacto: eixo em "mil" e "mi"', () => {
    // O Intl usa espaço não separável entre o número e "mil"/"mi".
    const semNbsp = (v) => formatCompacto(v).split(String.fromCharCode(160)).join(' ');
    expect(semNbsp(50000)).toBe('50 mil');
    expect(semNbsp(1200000)).toBe('1,2 mi');
    expect(formatCompacto(0)).toBe('0');
  });
});

describe('Voltar do detalhe aberto num período menor que o do dashboard', () => {
  const url = montarUrlDetalhe({
    conta: 'rotativo', situacao: 'naoPago', dataInicio: '2026-11-03', dataFim: '2026-11-03', voltarInicio: '2026-11-01', voltarFim: '2026-11-26',
  });
  const params = new URLSearchParams(url.split('?')[1]);

  it('o detalhe abre no período menor, e o período do dashboard vai junto', () => {
    expect(url).toBe(
      '/dashboard-pagamentos/detalhe?conta=rotativo&situacao=naoPago&dataInicio=2026-11-03&dataFim=2026-11-03&voltarInicio=2026-11-01&voltarFim=2026-11-26',
    );
    expect(lerFiltrosDetalhe(params)).toMatchObject({ dataInicio: '2026-11-03', dataFim: '2026-11-03' });
  });

  it('os parâmetros do Voltar não entram nos filtros enviados à API', () => {
    expect(Object.keys(lerFiltrosDetalhe(params))).not.toContain('voltarInicio');
    expect(Object.keys(lerFiltrosDetalhe(params))).not.toContain('voltarFim');
    expect(paramsVoltar(params)).toEqual({ voltarInicio: '2026-11-01', voltarFim: '2026-11-26' });
  });

  it('o Voltar devolve o dashboard no período original; sem ele, no período do detalhe', () => {
    expect(urlVoltarDashboard(params)).toBe('/dashboard-pagamentos?dataInicio=2026-11-01&dataFim=2026-11-26');
    const semVoltar = new URLSearchParams('conta=rotativo&dataInicio=2026-09-01&dataFim=2026-09-30');
    expect(urlVoltarDashboard(semVoltar)).toBe('/dashboard-pagamentos?dataInicio=2026-09-01&dataFim=2026-09-30');
    expect(paramsVoltar(semVoltar)).toEqual({ voltarInicio: undefined, voltarFim: undefined });
  });
});
