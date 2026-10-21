import React from 'react';
import PagamentoRemessaPage from './shared/PagamentoRemessaPage';

export default function PagamentoPermissionariosPendentesApp() {
  return (
    <PagamentoRemessaPage
      title="Pendentes - Permissionários"
      apiBasePath="/pagamentos/pendentes/permissionarios"
      nomeColuna="Modal"
      permitirEdicaoValorBi
      mostrarBotoesRapidosData={false}
    />
  );
}
