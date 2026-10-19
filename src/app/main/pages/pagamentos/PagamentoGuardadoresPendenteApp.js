import React from 'react';
import PagamentoRemessaPage from './shared/PagamentoRemessaPage';

export default function PagamentoGuardadoresPendenteApp() {
  return (
    <PagamentoRemessaPage
      title="Pendente - Guardadores"
      apiBasePath="/pagamentos/pendente/guardador"
      nomeColuna="Tipo"
      comBuscaPorNome
      permitirEdicaoValorBi
      botoesDataUsarHoje
    />
  );
}
