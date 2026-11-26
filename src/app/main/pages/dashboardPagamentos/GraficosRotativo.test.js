import { renderToStaticMarkup } from 'react-dom/server';
import GraficosRotativo from './GraficosRotativo';
import { abasRotativo } from './dashboardPagamentosUtils';

const semEspacoDuro = (html) => html.split(String.fromCharCode(160)).join(' ');

const conta = {
  conta: 'rotativo',
  nome: 'Conta Rotativo',
  pago: { qtd: 50, valor: 377067.58 },
  naoPago: { qtd: 2, valor: 1246 },
  emAberto: { qtd: 0, valor: 0 },
};
const comAguardando = { ...conta, emAberto: { qtd: 3, valor: 15800 } };

const render = ({ c = conta, aba = 'pagos', metrica = 'valor' } = {}) =>
  semEspacoDuro(
    renderToStaticMarkup(
      <GraficosRotativo conta={c} metrica={metrica} onAbrirDetalhe={() => {}} abas={abasRotativo(c, metrica)} aba={aba} onMudarAba={() => {}} />,
    ),
  );

describe('GraficosRotativo', () => {
  it('sem aguardando: só o gráfico de Pago / Não pago, sem barra de abas', () => {
    const html = render();
    expect(html).not.toContain('role="tablist"');
    expect(html).not.toContain('Aguardando pagamento');
    expect(html).not.toContain('Por dia');
    expect(html).toContain('R$ 377.067,58 • 99,7%');
    expect(html).toContain('R$ 1.246,00 • 0,3%');
    expect(html).toContain('600 mil');
    // uma barra clicável para Pago e outra para Não pago
    expect(html.match(/role="button"/g)).toHaveLength(2);
  });

  it('com aguardando: abas "Pago / Não pago" e "Aguardando pagamento"; a primeira mostra só pago e não pago', () => {
    const html = render({ c: comAguardando });
    expect(html).toContain('role="tablist"');
    expect(html).toContain('Pago / Não pago');
    expect(html).toContain('Aguardando pagamento');
    expect(html).not.toContain('Por dia');
    // a % continua sobre Pago + Não pago
    expect(html).toContain('R$ 377.067,58 • 99,7%');
    expect(html).not.toContain('R$ 15.800,00');
    expect(html.match(/role="button"/g)).toHaveLength(2);
  });

  it('aba "Aguardando pagamento": uma barra com o valor aguardando na frente', () => {
    const html = render({ c: comAguardando, aba: 'aguardando' });
    expect(html).toContain('R$ 15.800,00');
    expect(html).not.toContain('R$ 377.067,58');
    expect(html.match(/role="button"/g)).toHaveLength(1);
  });
});
