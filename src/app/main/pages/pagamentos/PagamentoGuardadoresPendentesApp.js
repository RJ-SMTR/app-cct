import React from 'react';
import PagamentoRemessaPage from './shared/PagamentoRemessaPage';

export default function PagamentoGuardadoresPendentesApp() {
  return (
    <PagamentoRemessaPage
      title="Pendentes - Guardadores"
      apiBasePath="/pagamentos/pendentes/guardadores"
      nomeColuna="Tipo"
      comBuscaPorNome
      permitirEdicaoValorBi
      mostrarBotoesRapidosData={false}
    />
  );
}
