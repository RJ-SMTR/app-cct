import React, { useEffect, useMemo } from 'react';
import { Card, Typography } from '@mui/material';
import { Box } from '@mui/system';
import { useDispatch, useSelector } from 'react-redux';
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import { MRT_Localization_PT_BR } from 'material-react-table/locales/pt-BR';
import {
  MRT_ShowHideColumnsButton,
  MRT_ToggleDensePaddingButton,
} from 'material-react-table';
import { getBookings } from 'app/store/automationSlice';
import { format } from 'date-fns';

const formatDateTime = (value) => {
  if (!value) return '-';
  try {
    return format(new Date(value), 'dd/MM/yyyy HH:mm');
  } catch {
    return '-';
  }
};

const formatDate = (value) => {
  if (!value) return '-';
  try {
    return format(new Date(value), 'dd/MM/yyyy');
  } catch {
    return '-';
  }
};

const getUserName = (user) => user?.fullName || user?.name || user?.email || '-';

const getAprovacaoLabel = (row) => {
  if (row?.aprovacao === false) return 'Livre de aprovacao';
  if (row?.aprovacaoPagamento?.status === 1) return 'Aprovado';
  return 'Pendente aprovacao';
};

const getPagamentoFeitoLabel = (row) => {
  const aprovado = row?.aprovacaoPagamento?.status === 1;
  const dataAprovacao = row?.aprovacaoPagamento?.dataAprovacao;
  return aprovado && dataAprovacao ? 'Sim' : 'Nao';
};

function RemessaHistoricoApp() {
  const dispatch = useDispatch();
  const bookings = useSelector((state) => state.automation.bookings) || [];

  useEffect(() => {
    dispatch(getBookings());
  }, [dispatch]);

  const data = useMemo(
    () =>
      bookings.map((row) => ({
        id: row?.id,
        beneficiario: row?.beneficiarioUsuario?.fullName || '-',
        tipoPagamento: row?.tipoPagamento || '-',
        valor: row?.aprovacaoPagamento?.valorAprovado ?? row?.valorPagamentoUnico ?? null,
        dataPagamento: formatDate(row?.dataPagamentoUnico),
        aprovacaoStatus: getAprovacaoLabel(row),
        aprovadoPor: getUserName(row?.aprovacaoPagamento?.aprovador),
        dataAprovacao: formatDateTime(row?.aprovacaoPagamento?.dataAprovacao),
        criadoPor: getUserName(row?.cadastrador),
        criadoEm: formatDateTime(row?.createdAt),
        editadoPor: getUserName(row?.modificador),
        ativo: row?.status ? 'Sim' : 'Nao',
        pagamentoFeito: getPagamentoFeitoLabel(row),
      })),
    [bookings]
  );

  const columns = useMemo(
    () => [
      { accessorKey: 'id', header: 'ID', size: 80 },
      { accessorKey: 'beneficiario', header: 'Beneficiario', size: 220 },
      { accessorKey: 'tipoPagamento', header: 'Tipo Pagamento', size: 120 },
      {
        accessorKey: 'valor',
        header: 'Valor',
        size: 120,
        Cell: ({ cell }) => {
          const value = cell.getValue();
          if (value === null || value === undefined || value === '') return '-';
          return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));
        },
      },
      { accessorKey: 'dataPagamento', header: 'Data Pagamento', size: 120 },
      { accessorKey: 'aprovacaoStatus', header: 'Status Aprovacao', size: 170 },
      { accessorKey: 'aprovadoPor', header: 'Aprovado por', size: 180 },
      { accessorKey: 'dataAprovacao', header: 'Data Aprovacao', size: 160 },
      { accessorKey: 'pagamentoFeito', header: 'Pagamento feito', size: 140 },
      { accessorKey: 'criadoPor', header: 'Cadastrado por', size: 180 },
      { accessorKey: 'criadoEm', header: 'Criado em', size: 160 },
      { accessorKey: 'editadoPor', header: 'Editado por', size: 180 },
      { accessorKey: 'ativo', header: 'Ativo', size: 90 },
    ],
    []
  );

  const table = useMaterialReactTable({
    columns,
    data,
    localization: MRT_Localization_PT_BR,
    enableColumnOrdering: true,
    enableColumnActions: false,
    enableColumnFilters: false,
    enableDensityToggle: true,
    enableGlobalFilter: true,
    enableTopToolbar: false,
    renderTopToolbarCustom: ({ table }) => (
      <div className="w-full flex justify-end gap-10 my-20">
        <MRT_ShowHideColumnsButton table={table} />
        <MRT_ToggleDensePaddingButton table={table} />
      </div>
    ),
    initialState: {
      density: 'compact',
      sorting: [{ id: 'id', desc: true }],
      pagination: { pageSize: 20, pageIndex: 0 },
    },
    muiTableBodyRowProps: { sx: { height: 42 } },
    muiTableContainerProps: {
      sx: { height: '45vh', overflowY: 'auto', backgroundColor: '#fff', boxShadow: 'none' },
    },
    muiTableBodyCellProps: { sx: { backgroundColor: '#fff', boxShadow: 'none', fontSize: '1.1rem' } },
    muiTableHeadRowProps: { sx: { backgroundColor: '#fff', boxShadow: 'none' } },
    muiTableHeadCellProps: { sx: { fontSize: '1.1rem' } },
    muiTablePaperProps: { elevation: 0, sx: { backgroundColor: '#fff', boxShadow: 'none' } },
  });

  return (
    <div className="p-1 pt-10">
      <Typography className="font-medium text-3xl">Historico de Remessas</Typography>
      <Box className="flex flex-col justify-around w-full md:mx-9 p-24 relative mt-16">
        <Card className="w-full md:mx-9 p-24 relative mt-16">
          <header className="flex justify-between items-center mb-24">
            <h3 className="font-semibold">Historico de alteracoes e aprovacoes</h3>
          </header>
          <MaterialReactTable table={table} />
        </Card>
      </Box>
    </div>
  );
}

export default RemessaHistoricoApp;
