import React from 'react';
import PagamentoRemessaPage from './shared/PagamentoRemessaPage';

export default function PagamentoConsorciosPendenteApp() {
  return (
    <PagamentoRemessaPage
      title="Pendente - Consórcios"
      apiBasePath="/pagamentos/pendente/consorcios"
      nomeColuna="Nome do Consórcio"
      permitirEdicaoValorBi
    />
  );
}
