import { renderToStaticMarkup } from 'react-dom/server';
import GraficosRotativo from './GraficosRotativo';

const semEspacoDuro = (html) => html.split(String.fromCharCode(160)).join(' ');

const conta = {
  conta: 'rotativo',
  nome: 'Conta Rotativo',
  pago: { qtd: 50, valor: 377067.58 },
  naoPago: { qtd: 2, valor: 1246 },
  emAberto: { qtd: 0, valor: 0 },
  porDia: [
    { data: '2026-11-03', pago: { qtd: 30, valor: 200000 }, naoPago: { qtd: 2, valor: 1246 }, emAberto: { qtd: 0, valor: 0 } },
    { data: '2026-11-05', pago: { qtd: 20, valor: 177067.58 }, naoPago: { qtd: 0, valor: 0 }, emAberto: { qtd: 0, valor: 0 } },
  ],
};
const periodo = { dataInicio: '2026-11-01', dataFim: '2026-11-07' };
const render = (props) =>
  semEspacoDuro(renderToStaticMarkup(<GraficosRotativo conta={conta} metrica="valor" periodo={periodo} onAbrirDetalhe={() => {}} {...props} />));

describe('GraficosRotativo', () => {
  it('Proporção: uma linha por situação, com valor e % logo depois da barra, e eixo em marcas redondas', () => {
    const html = render();
    expect(html).toContain('Pago');
    expect(html).toContain('Não pago');
    expect(html).toContain('R$ 377.067,58 • 99,7%');
    expect(html).toContain('R$ 1.246,00 • 0,3%');
    expect(html).toContain('600 mil');
    // sem valor aguardando: a linha de Aguardando pagamento não aparece; uma barra clicável para Pago e Não pago
    expect(html).not.toContain('Aguardando pagamento');
    expect(html).not.toContain('R$ 0,00 • 0,0%');
    expect(html.match(/role="button"/g)).toHaveLength(2);
  });

  it('Proporção: com valor aguardando, a linha de Aguardando pagamento aparece embaixo', () => {
    const html = render({ conta: { ...conta, emAberto: { qtd: 1, valor: 15800 } } });
    expect(html).toContain('Aguardando pagamento');
    expect(html).toContain('R$ 15.800,00 • 4,0%');
    expect(html.indexOf('Não pago')).toBeLessThan(html.indexOf('Aguardando pagamento'));
    expect(html.match(/role="button"/g)).toHaveLength(3);
  });

  it('Por dia: só os dias com pagamento, com uma barra por situação que teve valor no dia', () => {
    const html = render({ abaInicial: 'porDia' });
    expect(html).toContain('03/11');
    expect(html).toContain('05/11');
    expect(html).not.toContain('04/11');
    expect(html).toContain('R$ 200.000,00');
    expect(html).toContain('R$ 1.246,00');
    expect(html).toContain('R$ 177.067,58');
    // 03/11 tem pago e não pago; 05/11 só pago
    expect(html.match(/role="button"/g)).toHaveLength(3);
  });

  it('Por dia sem dados de dia (API antiga): mostra aviso em vez do gráfico', () => {
    const html = render({ abaInicial: 'porDia', conta: { ...conta, porDia: undefined } });
    expect(html).toContain('Nenhum pagamento por dia para exibir no período.');
  });
});
