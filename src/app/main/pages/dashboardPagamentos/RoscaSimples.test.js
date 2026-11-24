import { renderToStaticMarkup } from 'react-dom/server';
import RoscaSimples, { COR_ROSCA_VAZIA } from './RoscaSimples';
import { montarRoscasPendencias } from './dashboardPagamentosUtils';

const semEspacoDuro = (html) => html.replace(/ /g, ' ');

describe('RoscaSimples', () => {
  it('sem pendência paga / pendência de pagamento (só aguardando): rosca cinza, sem fatias coloridas e com tudo zerado', () => {
    const conta = {
      conta: 'bilhetagem',
      grupos: [{ grupo: 'VLT', pago: { qtd: 0, valor: 0 }, naoPago: { qtd: 0, valor: 0 }, emAberto: { qtd: 3, valor: 90 } }],
      motivos: [{ situacao: 'emAberto', descricao: 'Aguardando pagamento', qtd: 3, valor: 90 }],
      naoPago: { qtd: 0, valor: 0 },
    };
    const { pendencias, erros } = montarRoscasPendencias(conta);
    const html = semEspacoDuro(
      renderToStaticMarkup(
        <>
          <RoscaSimples titulo="Pendências" fatias={pendencias.fatias} total={pendencias.total} />
          <RoscaSimples titulo="Erros" fatias={erros.fatias} total={erros.total} mostrarQtd />
        </>
      )
    );

    expect(html).not.toContain('Sem valores no período');
    // só o anel de fundo, na cor neutra, e nenhuma fatia clicável
    expect(html.match(/<circle/g)).toHaveLength(2);
    expect(html).toContain(`stroke="${COR_ROSCA_VAZIA}"`);
    expect(html).not.toContain('role="button"');
    // legenda com os itens zerados e sem as cores de status
    ['Pendência paga', 'Pendência de pagamento', 'Rejeitado', 'Estorno'].forEach((r) => expect(html).toContain(r));
    pendencias.fatias.concat(erros.fatias).forEach((f) => expect(html).not.toContain(f.cor));
    expect(html).toContain('R$ 0,00');
    expect(html).not.toMatch(/R\$ [1-9]/);
    expect(html).toContain('0,0%');
    expect(html).toContain('0 pag.');
  });

  it('com valores: desenha as fatias coloridas', () => {
    const fatias = [
      { id: 'a', rotulo: 'A', cor: '#42A5F5', valor: 75, qtd: 1, fracao: 0.75 },
      { id: 'b', rotulo: 'B', cor: '#E57373', valor: 25, qtd: 1, fracao: 0.25 },
    ];
    const html = renderToStaticMarkup(<RoscaSimples titulo="T" fatias={fatias} total={{ valor: 100, qtd: 2 }} />);
    expect(html.match(/role="button"/g)).toHaveLength(2);
    expect(html).toContain('stroke="#42A5F5"');
    expect(html).not.toContain(COR_ROSCA_VAZIA);
  });
});
