import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Alert, Box, Button, Card, Chip, CircularProgress, Grid, InputAdornment, TablePagination, TextField, Typography } from '@mui/material';
import { DataGrid, ptBR as pt } from '@mui/x-data-grid';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import dayjs from 'dayjs';
import { api } from 'app/configs/api/api';
import { showMessage } from 'app/store/fuse/messageSlice';
import PeriodDatePicker, { periodRequiredRules } from 'app/shared-components/PeriodDatePicker';
import {
  COR_TIPO,
  ROTA_EXTRATO,
  ROTULO_CONTA,
  ROTULO_TIPO,
  baixarPlanilha,
  formatBRL,
  formatData,
  formatQtd,
  lerFiltrosDetalhe,
  nomeArquivoExportacao,
  toIsoDate,
} from './extratoUtils';

const BUSCA_MINIMA = 2;

function authHeaders() {
  const token = window.localStorage.getItem('jwt_access_token');
  return { Authorization: `Bearer ${token}` };
}

const COLUNAS = [
  { field: 'data', headerName: 'Data', width: 110, valueFormatter: ({ value }) => formatData(value) },
  {
    field: 'tipo',
    headerName: 'Tipo',
    width: 110,
    renderCell: ({ value }) => <Chip size="small" label={ROTULO_TIPO[value] ?? value} sx={{ bgcolor: COR_TIPO[value], color: '#fff', fontWeight: 500 }} />,
  },
  {
    field: 'valor',
    headerName: 'Valor',
    width: 160,
    align: 'right',
    headerAlign: 'right',
    valueFormatter: ({ value }) => formatBRL(value),
  },
  { field: 'descricao', headerName: 'Histórico', flex: 1, minWidth: 220 },
  { field: 'numeroDocumento', headerName: 'Documento', width: 170 },
  { field: 'numeroInscricao', headerName: 'CNPJ/CPF', width: 150 },
  { field: 'numeroConta', headerName: 'Conta', width: 140 },
  { field: 'nsr', headerName: 'NSR', width: 80 },
];

const VAZIO = { total: 0, entradas: 0, saidas: 0, itens: [] };

export default function StatementsDetalheApp() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const filtros = useMemo(() => lerFiltrosDetalhe(searchParams), [searchParams]);

  const paraData = (iso) => (iso ? dayjs(iso).toDate() : null);
  const [busca, setBusca] = useState(filtros.busca ?? '');
  const [periodo, setPeriodo] = useState([paraData(filtros.dataInicio), paraData(filtros.dataFim)]);
  const [erroPeriodo, setErroPeriodo] = useState(null);
  const [erroBusca, setErroBusca] = useState(null);

  // Mantém os campos iguais à URL (voltar/avançar do navegador ou clique em outro ponto do dashboard).
  useEffect(() => {
    setBusca(filtros.busca ?? '');
    setPeriodo([paraData(filtros.dataInicio), paraData(filtros.dataFim)]);
    setErroPeriodo(null);
    setErroBusca(null);
  }, [filtros]);

  const aplicarFiltros = (event, { limparBusca = false } = {}) => {
    event?.preventDefault();
    const validacao = periodRequiredRules.validate(periodo);
    if (validacao !== true) {
      setErroPeriodo(validacao);
      return;
    }
    const termo = limparBusca ? '' : busca.trim();
    if (termo && termo.length < BUSCA_MINIMA) {
      setErroBusca(`Digite ao menos ${BUSCA_MINIMA} caracteres.`);
      return;
    }
    setErroPeriodo(null);
    setErroBusca(null);
    // Mudar o período invalida o "dia" escolhido num gráfico.
    const proximo = { ...filtros, busca: termo || undefined, dataInicio: toIsoDate(periodo[0]), dataFim: toIsoDate(periodo[1]) };
    if (proximo.dia && (proximo.dia < proximo.dataInicio || proximo.dia > proximo.dataFim)) delete proximo.dia;
    setSearchParams(Object.fromEntries(Object.entries(proximo).filter(([, valor]) => valor)));
  };

  const [paginacao, setPaginacao] = useState({ page: 0, pageSize: 50 });
  const [carregando, setCarregando] = useState(false);
  const [resultado, setResultado] = useState(VAZIO);
  const filtrosValidos = Boolean(filtros.conta && filtros.dataInicio && filtros.dataFim);

  useEffect(() => {
    setPaginacao((atual) => ({ ...atual, page: 0 }));
  }, [filtros]);

  useEffect(() => {
    if (!filtrosValidos) return undefined;
    let cancelado = false;
    setCarregando(true);
    api
      .get('extrato/dashboard/detalhe', { headers: authHeaders(), params: { ...filtros, page: paginacao.page + 1, pageSize: paginacao.pageSize } })
      .then((response) => !cancelado && setResultado(response.data))
      .catch((error) => {
        if (cancelado) return;
        setResultado(VAZIO);
        dispatch(showMessage({ message: error?.response?.data?.error || 'Não foi possível carregar o detalhe do extrato.', variant: 'error' }));
      })
      .finally(() => !cancelado && setCarregando(false));
    return () => {
      cancelado = true;
    };
  }, [dispatch, filtros, filtrosValidos, paginacao.page, paginacao.pageSize]);

  const [exportando, setExportando] = useState(false);
  const exportarExcel = async () => {
    setExportando(true);
    try {
      const { data } = await api.get('extrato/dashboard/exportar', { headers: authHeaders(), params: filtros });
      baixarPlanilha(data.itens, nomeArquivoExportacao(filtros));
      dispatch(showMessage({ message: `${formatQtd(data.itens.length)} lançamento(s) exportado(s).`, variant: 'success' }));
    } catch (error) {
      dispatch(showMessage({ message: error?.response?.data?.error || 'Não foi possível exportar o extrato para o Excel.', variant: 'error' }));
    } finally {
      setExportando(false);
    }
  };

  const voltar = () => navigate(`${ROTA_EXTRATO}?dataInicio=${filtros.dataInicio ?? ''}&dataFim=${filtros.dataFim ?? ''}`);

  const chips = [
    ['Conta', ROTULO_CONTA[filtros.conta] ?? filtros.conta],
    ['Tipo', ROTULO_TIPO[filtros.tipo]],
    ['Histórico', filtros.descricao],
    ['Dia', filtros.dia && formatData(filtros.dia)],
    ['Busca', filtros.busca],
    ['Período', filtros.dataInicio && `${formatData(filtros.dataInicio)} a ${formatData(filtros.dataFim)}`],
  ].filter(([, valor]) => valor);

  return (
    <Box className="p-24 pt-10">
      <Card sx={{ p: 3, mt: 4, mb: 3 }}>
        <Box className="flex flex-wrap items-center justify-between" sx={{ mb: 2 }}>
          <Typography variant="h5" className="font-semibold">
            Detalhamento do extrato
          </Typography>
          <Button startIcon={<ArrowBackIcon />} onClick={voltar}>
            Voltar ao extrato
          </Button>
        </Box>
        <Box className="flex flex-wrap items-center gap-8" sx={{ mb: 1 }}>
          {chips.map(([rotulo, valor]) => (
            <Chip key={rotulo} variant="outlined" label={`${rotulo}: ${valor}`} />
          ))}
        </Box>
        {filtros.conta && (
          <Box component="form" noValidate onSubmit={aplicarFiltros} className="flex flex-wrap items-start gap-16" sx={{ mt: 2 }}>
            <PeriodDatePicker required value={periodo} onChange={setPeriodo} error={Boolean(erroPeriodo)} helperText={erroPeriodo} />
            <TextField
              label="Histórico, documento ou CNPJ/CPF"
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setErroBusca(null);
              }}
              error={Boolean(erroBusca)}
              helperText={erroBusca}
              sx={{ minWidth: 320 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            <Button type="submit" variant="contained" color="secondary" sx={{ height: 56 }}>
              Buscar
            </Button>
            {filtros.busca && (
              <Button sx={{ height: 56 }} onClick={(event) => aplicarFiltros(event, { limparBusca: true })}>
                Limpar busca
              </Button>
            )}
            <Button
              variant="outlined"
              sx={{ height: 56 }}
              startIcon={exportando ? <CircularProgress size={18} /> : <FileDownloadIcon />}
              disabled={exportando || carregando || !filtrosValidos || !resultado.total}
              onClick={exportarExcel}
            >
              {exportando ? 'Exportando...' : 'Exportar Excel'}
            </Button>
          </Box>
        )}
        {filtrosValidos && (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm="auto">
              <Typography variant="body1">
                <strong>{formatQtd(resultado.total)}</strong> lançamento(s)
              </Typography>
            </Grid>
            <Grid item xs={12} sm="auto">
              <Typography variant="body1" sx={{ color: COR_TIPO.C }}>
                Entradas: <strong>{formatBRL(resultado.entradas)}</strong>
              </Typography>
            </Grid>
            <Grid item xs={12} sm="auto">
              <Typography variant="body1" sx={{ color: COR_TIPO.D }}>
                Saídas: <strong>{formatBRL(resultado.saidas)}</strong>
              </Typography>
            </Grid>
          </Grid>
        )}
      </Card>

      {!filtrosValidos ? (
        <Alert severity="warning">Abra esta tela a partir do dashboard do extrato (faltam conta e período).</Alert>
      ) : (
        <Card sx={{ p: 2 }}>
          <Box sx={{ height: 'calc(100vh - 570px)', minHeight: 360 }}>
            <DataGrid
              rows={resultado.itens}
              columns={COLUNAS}
              getRowId={(row) => row.id}
              loading={carregando}
              rowCount={resultado.total}
              paginationMode="server"
              paginationModel={paginacao}
              hideFooter
              disableRowSelectionOnClick
              localeText={pt.components.MuiDataGrid.defaultProps.localeText}
            />
          </Box>
          {/* O CSS global esconde a paginação interna do DataGrid; por isso ela fica fora dele. */}
          <TablePagination
            component="div"
            count={resultado.total}
            page={paginacao.page}
            rowsPerPage={paginacao.pageSize}
            rowsPerPageOptions={[25, 50, 100]}
            onPageChange={(_event, page) => setPaginacao((atual) => ({ ...atual, page }))}
            onRowsPerPageChange={(event) => setPaginacao({ page: 0, pageSize: Number(event.target.value) })}
            labelRowsPerPage="Linhas por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
            showFirstButton
            showLastButton
          />
        </Card>
      )}
    </Box>
  );
}
