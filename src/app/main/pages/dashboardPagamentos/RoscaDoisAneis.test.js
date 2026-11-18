import { renderToStaticMarkup } from 'react-dom/server';
import RoscaDoisAneis, { montarAneis } from './RoscaDoisAneis';

const situacoes = [
  { key: 'pago', label: 'Pago', color: '#2e7d32', valor: 600, qtd: 6 },
  { key: 'naoPago', label: 'Não pago', color: '#d32f2f', valor: 300, qtd: 3 },
  { key: 'emAberto', label: 'Em aberto', color: '#ed6c02', valor: 100, qtd: 1 },
];
const motivos = [
  { situacao: 'naoPago', codigo: 'AB', descricao: 'Conta inválida', valor: 200, qtd: 2 },
  { situacao: 'naoPago', codigo: 'CD', descricao: 'Saldo insuficiente', valor: 50, qtd: 1 },
  { situacao: 'emAberto', codigo: 'EF', descricao: 'Aguardando', valor: 100, qtd: 1 },
];

describe('montarAneis', () => {
  it('anel externo por situação e interno por motivo, na mesma proporção do total', () => {
    const { total, externo, interno } = montarAneis(situacoes, motivos, 'valor');
    expect(total).toBe(1000);
    expect(externo.map((x) => x.fracao)).toEqual([0.6, 0.3, 0.1]);
    // pago não tem motivo (espaço vazio de 0,6), depois os dois motivos de não pago + resto 0,05, e o de em aberto
    expect(interno.map((x) => [x.id, x.fracao, !!x.vazio])).toEqual([
      ['v:pago', 0.6, true],
      ['m:naoPago:AB', 0.2, false],
      ['m:naoPago:CD', 0.05, false],
      ['v:naoPago', 0.05, true],
      ['m:emAberto:EF', 0.1, false],
    ]);
  });

  it('usa a quantidade quando a métrica é qtd e não gera NaN com total zero', () => {
    expect(montarAneis(situacoes, motivos, 'qtd').total).toBe(10);
    const zerado = montarAneis(situacoes.map((s) => ({ ...s, valor: 0, qtd: 0 })), [], 'valor');
    expect(zerado.externo.every((x) => x.fracao === 0)).toBe(true);
  });
});

describe('RoscaDoisAneis', () => {
  it('desenha uma fatia por situação e uma por motivo, com o total no centro e sem legenda', () => {
    const html = renderToStaticMarkup(<RoscaDoisAneis situacoes={situacoes} motivos={motivos} metrica="valor" />);
    expect(html.match(/role="button"/g)).toHaveLength(3 + 3);
    expect(html).toContain('Motivo: Conta inválida');
    expect(html).not.toContain('Conta inválida: R$');
    expect(html).toContain('Anel externo: situação');
    expect(html).toContain('Total (valor)');
  });
});
