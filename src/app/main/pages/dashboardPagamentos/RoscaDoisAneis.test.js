import { renderToStaticMarkup } from 'react-dom/server';
import RoscaDoisAneis, { calcularFracoes } from './RoscaDoisAneis';

describe('calcularFracoes', () => {
  it('divide cada valor pelo total', () => {
    expect(calcularFracoes([1, 1, 2])).toEqual([0.25, 0.25, 0.5]);
  });

  it('total zero ou valor inválido não gera NaN', () => {
    expect(calcularFracoes([0, 0])).toEqual([0, 0]);
    expect(calcularFracoes([undefined, 'x', -3, 2])).toEqual([0, 0, 0, 1]);
  });
});

describe('RoscaDoisAneis', () => {
  const motivos = [
    { descricao: 'Conta inválida', valor: 300, qtd: 1, codigo: 'AB' },
    { descricao: 'Saldo insuficiente', valor: 100, qtd: 3, codigo: 'CD' },
  ];

  it('desenha dois anéis com uma fatia por motivo em cada um e mostra valor e quantidade na legenda', () => {
    const html = renderToStaticMarkup(<RoscaDoisAneis motivos={motivos} onSelecionar={() => {}} />);
    expect(html.match(/role="button"/g)).toHaveLength(4);
    expect(html).toContain('Conta inválida');
    expect(html).toContain('75,0%');
    expect(html).toContain('25,0%');
    expect(html).toContain('Anel externo: valor');
  });

  it('um único motivo ocupa o anel inteiro', () => {
    const html = renderToStaticMarkup(<RoscaDoisAneis motivos={[motivos[0]]} onSelecionar={() => {}} />);
    expect(html.match(/role="button"/g)).toHaveLength(2);
    expect(html).toContain('100,0%');
  });
});
