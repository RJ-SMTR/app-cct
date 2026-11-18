import { renderToStaticMarkup } from 'react-dom/server';
import RoscaDoisAneis, { CORES_MOTIVOS_NAO_PAGO, montarAneis } from './RoscaDoisAneis';

const situacoes = [
  { key: 'pago', label: 'Pago', color: '#2e7d32', valor: 650, qtd: 7 },
  { key: 'naoPago', label: 'Não pago', color: '#d32f2f', valor: 300, qtd: 3 },
  { key: 'emAberto', label: 'Aguardando pagamento', color: '#ed6c02', valor: 100, qtd: 1 },
];
const motivos = [
  { situacao: 'pago', codigo: 'EFETIVADO', descricao: 'Efetivado', valor: 600, qtd: 6 },
  { situacao: 'pago', codigo: 'PENDENCIA_PAGA', descricao: 'Pendência paga', valor: 50, qtd: 1 },
  { situacao: 'naoPago', codigo: 'AB', descricao: 'Conta inválida', valor: 200, qtd: 2 },
  { situacao: 'naoPago', codigo: 'CD', descricao: 'Saldo insuficiente', valor: 50, qtd: 1 },
  { situacao: 'emAberto', codigo: undefined, descricao: 'Aguardando pagamento', valor: 100, qtd: 1 },
];

describe('montarAneis', () => {
  it('anel externo só com a "Pendência paga" (efetivados ficam de fora); interno com não pagos por motivo e aguardando pagamento', () => {
    const { totalPagos, totalPendentes, externo, interno } = montarAneis(situacoes, motivos, 'valor');
    expect(totalPagos).toBe(50);
    expect(externo.map((x) => [x.rotulo, x.fracao])).toEqual([['Pendência paga', 1]]);
    expect(totalPendentes).toBe(400);
    expect(interno.map((x) => [x.rotulo, x.fracao])).toEqual([
      ['Conta inválida', 0.5],
      ['Saldo insuficiente', 0.125],
      ['Não pago (sem motivo)', 0.125],
      ['Aguardando pagamento', 0.25],
    ]);
  });

  it('cada motivo de não pago tem uma cor diferente', () => {
    const { interno } = montarAneis(situacoes, motivos, 'valor');
    expect(interno[0].cor).toBe(CORES_MOTIVOS_NAO_PAGO[0]);
    expect(interno[1].cor).toBe(CORES_MOTIVOS_NAO_PAGO[1]);
    expect(interno[0].cor).not.toBe(interno[1].cor);
  });

  it('sem pendência paga o anel externo fica vazio; qtd usa a quantidade; total zero não gera NaN', () => {
    const semPendencia = montarAneis(situacoes, motivos.filter((m) => m.codigo !== 'PENDENCIA_PAGA'), 'valor');
    expect(semPendencia.externo).toEqual([]);
    expect(semPendencia.totalPagos).toBe(0);
    expect(montarAneis(situacoes, motivos, 'qtd').totalPagos).toBe(1);
    const zerado = montarAneis(situacoes.map((s) => ({ ...s, valor: 0, qtd: 0 })), [], 'valor');
    expect(zerado.interno).toEqual([]);
  });
});

describe('RoscaDoisAneis', () => {
  it('desenha uma fatia no anel externo (pendência paga) e uma por motivo no interno, sem legenda', () => {
    const html = renderToStaticMarkup(<RoscaDoisAneis situacoes={situacoes} motivos={motivos} metrica="valor" />);
    expect(html.match(/role="button"/g)).toHaveLength(1 + 4);
    expect(html).toContain('Pendência paga: Pendência paga');
    expect(html).toContain('Anel externo: pendência paga');
    expect(html).not.toContain('Efetivado');
  });
});
