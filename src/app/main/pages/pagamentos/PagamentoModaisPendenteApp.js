import React from 'react';
import PagamentoRemessaPage from './shared/PagamentoRemessaPage';

export default function PagamentoModaisPendenteApp() {
  return (
    <PagamentoRemessaPage
      title="Pendente - Modais"
      apiBasePath="/pagamentos/pendente/modais"
      nomeColuna="Nome do Modal"
      permitirEdicaoValorBi={false}
      listaGrande
      comBuscaPorNome
      preparoAssincrono
      mostrarTotalPorGrupo
    />
  );
}
