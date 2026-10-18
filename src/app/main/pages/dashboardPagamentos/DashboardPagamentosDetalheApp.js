import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Alert, Box, Button, Card, Chip, InputAdornment, TextField, Typography } from '@mui/material';
import { DataGrid, ptBR as pt } from '@mui/x-data-grid';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import dayjs from 'dayjs';
import { api } from 'app/configs/api/api';
import { showMessage } from 'app/store/fuse/messageSlice';
import PeriodDatePicker, { periodRequiredRules } from 'app/shared-components/PeriodDatePicker';
import {
  COR_SITUACAO,
  ROTA_DASHBOARD,
  ROTULO_CONTA,
  ROTULO_SITUACAO,
  formatBRL,
  formatQtd,
  lerFiltrosDetalhe,
  toIsoDate,
} from './dashboardPagamentosUtils';

const BUSCA_MINIMA = 2;

function authHeaders() {
  const token = window.localStorage.getItem('jwt_access_token');
  return { Authorization: `Bearer ${token}` };
}

const formatarData = (iso) => (iso ? dayjs(iso).format('DD/MM/YYYY') : '');

const COLUNAS = [
  { field: 'data', headerName: 'Data de pagamento', width: 150, valueFormatter: ({ value }) => formatarData(value) },
  { field: 'favorecido', headerName: 'Favorecido', flex: 1, minWidth: 240, valueGetter: ({ row }) => row.favorecido || '(não identificado)' },
  { field: 'cpfCnpj', headerName: 'CPF/CNPJ', width: 160 },
  { field: 'grupo', headerName: 'Consórcio / Grupo', width: 150 },
  {
    field: 'situacao',
    headerName: 'Situação',
    width: 120,
    renderCell: ({ value }) => (
      <Chip size="small" label={ROTULO_SITUACAO[value] ?? value} sx={{ bgcolor: COR_SITUACAO[value], color: '#fff', fontWeight: 500 }} />
    ),
  },
  { field: 'motivoDescricao', headerName: 'Motivo', flex: 1, minWidth: 220 },
  { field: 'valor', headerName: 'Valor', width: 140, align: 'right', headerAlign: 'right', valueFormatter: ({ value }) => formatBRL(value) },
  {
    field: 'contaBancaria',
    headerName: 'Banco / Agência / Conta',
    width: 200,
    sortable: false,
    valueGetter: ({ row }) => [row.banco, row.agencia, row.conta].filter(Boolean).join(' / '),
  },
  { field: 'remessaId', headerName: 'Remessa', width: 100 },
];

export default function DashboardPagamentosDetalheApp() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const filtros = useMemo(() => lerFiltrosDetalhe(searchParams), [searchParams]);

  // Campos do filtro (favorecido e período). Só valem depois de "Buscar", que grava tudo na URL.
  const paraData = (iso) => (iso ? dayjs(iso).toDate() : null);
  const [busca, setBusca] = useState(filtros.busca ?? '');
  const [periodo, setPeriodo] = useState([paraData(filtros.dataInicio), paraData(filtros.dataFim)]);
  const [erroPeriodo, setErroPeriodo] = useState(null);
  const [erroBusca, setErroBusca] = useState(null);

  // Mantém os campos iguais à URL (voltar/avançar do navegador ou clique em outro ponto do gráfico).
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
    const proximo = { ...filtros, busca: termo || undefined, dataInicio: toIsoDate(periodo[0]), dataFim: toIsoDate(periodo[1]) };
    setSearchParams(Object.fromEntries(Object.entries(proximo).filter(([, valor]) => valor)));
  };

  const [paginacao, setPaginacao] = useState({ page: 0, pageSize: 50 });
  const [carregando, setCarregando] = useState(false);
  const [resultado, setResultado] = useState({ total: 0, valorTotal: 0, itens: [] });

  const filtrosValidos = Boolean(filtros.conta && filtros.dataInicio && filtros.dataFim);

  // Mudou o ponto do gráfico clicado: volta para a primeira página.
  useEffect(() => {
    setPaginacao((atual) => ({ ...atual, page: 0 }));
  }, [filtros]);

  useEffect(() => {
    if (!filtrosValidos) return undefined;
    let cancelado = false;
    setCarregando(true);
    api
      .get('dashboard/pagamentos/detalhe', {
        headers: authHeaders(),
        params: { ...filtros, page: paginacao.page + 1, pageSize: paginacao.pageSize },
      })
      .then((response) => !cancelado && setResultado(response.data))
      .catch((error) => {
        if (cancelado) return;
        setResultado({ total: 0, valorTotal: 0, itens: [] });
        dispatch(showMessage({ message: error?.response?.data?.error || 'Não foi possível carregar o detalhe dos pagamentos.' }));
      })
      .finally(() => !cancelado && setCarregando(false));
    return () => {
      cancelado = true;
    };
  }, [dispatch, filtros, filtrosValidos, paginacao.page, paginacao.pageSize]);

  const voltar = () => navigate(`${ROTA_DASHBOARD}?dataInicio=${filtros.dataInicio ?? ''}&dataFim=${filtros.dataFim ?? ''}`);

  const chips = [
    ['Conta', ROTULO_CONTA[filtros.conta] ?? filtros.conta],
    ['Grupo', filtros.grupo],
    ['Situação', ROTULO_SITUACAO[filtros.situacao] ?? filtros.situacao],
    ['Motivo', resultado.itens[0]?.motivo === filtros.motivo ? resultado.itens[0]?.motivoDescricao : filtros.motivo],
    ['Favorecido', filtros.busca],
    ['Período', filtros.dataInicio && `${formatarData(filtros.dataInicio)} a ${formatarData(filtros.dataFim)}`],
  ].filter(([, valor]) => valor);

  return (
    <Box className="p-24 pt-10">
      <Card sx={{ p: 3, mt: 4, mb: 3 }}>
        <Box className="flex flex-wrap items-center justify-between" sx={{ mb: 2 }}>
          <Typography variant="h5" className="font-semibold">
            Detalhe dos pagamentos
          </Typography>
          <Button startIcon={<ArrowBackIcon />} onClick={voltar}>
            Voltar ao dashboard
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
              label="Favorecido (nome ou CPF/CNPJ)"
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setErroBusca(null);
              }}
              error={Boolean(erroBusca)}
              helperText={erroBusca}
              sx={{ minWidth: 340 }}
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
                Limpar favorecido
              </Button>
            )}
          </Box>
        )}
        {filtrosValidos && (
          <Typography variant="body1" sx={{ mt: 2 }}>
            <strong>{formatQtd(resultado.total)}</strong> pagamento(s) · <strong>{formatBRL(resultado.valorTotal)}</strong>
          </Typography>
        )}
      </Card>

      {!filtrosValidos ? (
        <Alert severity="warning">Abra esta tela a partir de um gráfico do dashboard (faltam conta e período).</Alert>
      ) : (
        <Card sx={{ p: 2 }}>
          <DataGrid
            autoHeight
            rows={resultado.itens}
            columns={COLUNAS}
            getRowId={(row) => row.detalheAId}
            loading={carregando}
            rowCount={resultado.total}
            paginationMode="server"
            paginationModel={paginacao}
            onPaginationModelChange={setPaginacao}
            pageSizeOptions={[25, 50, 100, 200]}
            disableRowSelectionOnClick
            localeText={pt.components.MuiDataGrid.defaultProps.localeText}
          />
        </Card>
      )}
    </Box>
  );
}
