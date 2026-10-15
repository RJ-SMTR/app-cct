import React from 'react';
import PagamentoRemessaPage from './shared/PagamentoRemessaPage';

export default function PagamentoModaisApp() {
  return (
    <PagamentoRemessaPage
      title="Pagamentos - Modais"
      apiBasePath="/pagamentos/modais"
      nomeColuna="Nome do Modal"
      permitirEdicaoValorBi={false}
      listaGrande
      comBuscaPorNome
      preparoAssincrono
      mostrarTotalPorGrupo
      permitirGratuidade
    />
  );
}
