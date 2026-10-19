import React from 'react';
import jwtServiceConfig from 'src/app/auth/services/jwtService/jwtServiceConfig';
import OrdemPagamentoListPage from './shared/OrdemPagamentoListPage';
import formatDateOnly from './shared/formatDateOnly';

const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const columns = [
  { field: 'id', headerName: 'Id Ordem', width: 140 },
  {
    field: 'dataOrdem',
    headerName: 'Data Ordem',
    width: 140,
    valueFormatter: (params) => formatDateOnly(params.value),
  },
  { field: 'nomeConsorcio', headerName: 'Nome Consórcio', flex: 1, minWidth: 220 },
  { field: 'nomeOperadora', headerName: 'Nome Operadora', flex: 1, minWidth: 220 },
  {
    field: 'valor',
    headerName: 'Valor',
    width: 160,
    valueFormatter: (params) => formatter.format(params.value ?? 0),
  },
];

const textFilters = [
  { name: 'nomeConsorcio', label: 'Nome Consórcio' },
  { name: 'nomeOperadora', label: 'Nome Operadora' },
];

export default function OrdemPagamentoPermissionarioApp() {
  return (
    <OrdemPagamentoListPage
      title="Ordens de Pagamento - Permissionário"
      endpoint={jwtServiceConfig.odpPermissionarioLista}
      columns={columns}
      getRowId={(row) => row.id}
      textFilters={textFilters}
    />
  );
}
