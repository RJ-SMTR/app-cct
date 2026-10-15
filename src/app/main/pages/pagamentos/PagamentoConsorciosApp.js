import React from 'react';
import PagamentoRemessaPage from './shared/PagamentoRemessaPage';

export default function PagamentoConsorciosApp() {
  return (
    <PagamentoRemessaPage
      title="Pagamentos - Consórcios"
      apiBasePath="/pagamentos/consorcios"
      nomeColuna="Nome do Consórcio"
      permitirEdicaoValorBi
    />
  );
}
