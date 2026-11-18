import { renderToStaticMarkup } from 'react-dom/server';
import RoscaDoisAneis, { montarAneis } from './RoscaDoisAneis';

const situacoes = [
  { key: 'pago', label: 'Pago', color: '#2e7d32', valor: 600, qtd: 6 },
  { key: 'naoPago', label: 'Não pago', color: '#d32f2f', valor: 300, qtd: 3 },
  { key: 'emAberto', label: 'Em aberto', color: '#ed6c02', valor: 100, qtd: 1 },
];
const motivos = [
  { situacao: 'pago', codigo: 'OK', descricao: 'Efetivado', valor: 600, qtd: 6 },
  { situacao: 'naoPago', codigo: 'AB', descricao: 'Conta inválida', valor: 200, qtd: 2 },
  { situacao: 'naoPago', codigo: 'CD', descricao: 'Saldo insuficiente', valor: 50, qtd: 1 },
  { situacao: 'emAberto', codigo: 'EF', descricao: 'Aguardando', valor: 100, qtd: 1 },
];

describe('montarAneis', () => {
  it('anel externo com os pagos e anel interno com não pagos e aguardando pagamento, cada um fechando 100%', () => {
    const { totalPagos, totalPendentes, externo, interno } = montarAneis(situacoes, motivos, 'valor');
    expect(totalPagos).toBe(600);
    expect(totalPendentes).toBe(400);
    expect(externo.map((x) => [x.rotulo, x.fracao])).toEqual([['Efetivado', 1]]);
    expect(interno.map((x) => [x.rotulo, x.fracao])).toEqual([
      ['Conta inválida', 0.5],
      ['Saldo insuficiente', 0.125],
      ['Não pago (sem motivo)', 0.125],
      ['Aguardando', 0.25],
    ]);
    expect(interno.map((x) => x.situacao)).toEqual(['naoPago', 'naoPago', 'naoPago', 'emAberto']);
  });

  it('situação sem motivos vira uma fatia com o nome da situação; qtd usa a quantidade; total zero não gera NaN', () => {
    const semMotivos = montarAneis(situacoes, [], 'qtd');
    expect(semMotivos.externo.map((x) => [x.rotulo, x.valor])).toEqual([['Pago', 6]]);
    expect(semMotivos.interno.map((x) => [x.rotulo, x.valor])).toEqual([['Não pago', 3], ['Em aberto', 1]]);
    const zerado = montarAneis(situacoes.map((s) => ({ ...s, valor: 0, qtd: 0 })), [], 'valor');
    expect(zerado.externo).toEqual([]);
    expect(zerado.interno).toEqual([]);
  });
});

describe('RoscaDoisAneis', () => {
  it('desenha uma fatia por motivo em cada anel, com os totais no centro e sem legenda', () => {
    const html = renderToStaticMarkup(<RoscaDoisAneis situacoes={situacoes} motivos={motivos} metrica="valor" />);
    expect(html.match(/role="button"/g)).toHaveLength(1 + 4);
    expect(html).toContain('Pagos: Efetivado');
    expect(html).toContain('Anel externo: pagos');
    expect(html).not.toContain('Conta inválida: R$');
  });
});
