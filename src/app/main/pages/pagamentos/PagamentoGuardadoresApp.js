import React from 'react';
import PagamentoRemessaPage from './shared/PagamentoRemessaPage';

export default function PagamentoGuardadoresApp() {
  return (
    <PagamentoRemessaPage
      title="Pagamentos - Guardadores"
      apiBasePath="/pagamentos/guardador"
      nomeColuna="Tipo"
      comBuscaPorNome
      permitirEdicaoValorBi
      mostrarBotoesRapidosData={false}
    />
  );
}
