import React, { useEffect, useState } from 'react';
import { Box, Button, Grid, Paper, TextField, Typography } from '@mui/material';
import { DataGrid, ptBR as pt } from '@mui/x-data-grid';
import { DateRangePicker } from 'rsuite';
import dayjs from 'dayjs';
import { useDispatch } from 'react-redux';
import { api } from 'app/configs/api/api';
import { showMessage } from 'app/store/fuse/messageSlice';

const DEFAULT_PAGE_SIZE = 25;
const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function buildEmptyTextFilterValues(textFilters) {
  return Object.fromEntries(textFilters.map((filter) => [filter.name, '']));
}

// Tela genérica de listagem paginada (server-side) de ordens de pagamento,
// reaproveitada pelas telas de Permissionário e Guardador — só mudam
// título, endpoint, colunas e os filtros de texto digitáveis.
export default function OrdemPagamentoListPage({
  title,
  endpoint,
  columns,
  getRowId,
  textFilters = [],
  headerActions = null,
  refreshToken = 0,
}) {
  const dispatch = useDispatch();
  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [valorTotal, setValorTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: DEFAULT_PAGE_SIZE });
  const [dateRange, setDateRange] = useState([]);
  const [textFilterValues, setTextFilterValues] = useState(() => buildEmptyTextFilterValues(textFilters));
  const [appliedFilters, setAppliedFilters] = useState({ dateRange: [], textFilterValues: {} });

  useEffect(() => {
    const token = window.localStorage.getItem('jwt_access_token');
    setIsLoading(true);

    const params = { page: paginationModel.page + 1, limit: paginationModel.pageSize };

    if (appliedFilters.dateRange?.[0]) {
      params.dataOrdemInicio = dayjs(appliedFilters.dateRange[0]).format('YYYY-MM-DD');
    }
    if (appliedFilters.dateRange?.[1]) {
      params.dataOrdemFim = dayjs(appliedFilters.dateRange[1]).format('YYYY-MM-DD');
    }
    Object.entries(appliedFilters.textFilterValues || {}).forEach(([key, value]) => {
      if (value) params[key] = value;
    });

    api
      .get(endpoint, { params, headers: { Authorization: `Bearer ${token}` } })
      .then((response) => {
        setRows(response.data?.data ?? []);
        setRowCount(response.data?.count ?? 0);
        setValorTotal(response.data?.valorTotal ?? 0);
      })
      .catch(() => {
        dispatch(showMessage({ message: 'Erro ao carregar as ordens de pagamento.' }));
      })
      .finally(() => setIsLoading(false));
  }, [dispatch, endpoint, paginationModel, appliedFilters, refreshToken]);

  const handleSearch = () => {
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
    setAppliedFilters({ dateRange, textFilterValues });
  };

  const handleClear = () => {
    const emptyTextFilters = buildEmptyTextFilterValues(textFilters);
    setDateRange([]);
    setTextFilterValues(emptyTextFilters);
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
    setAppliedFilters({ dateRange: [], textFilterValues: emptyTextFilters });
  };

  return (
    <div className="p-24 pt-10">
      <Box className="flex justify-between items-center mb-24">
        <Typography className="font-medium text-3xl">{title}</Typography>
        {headerActions}
      </Box>

      <Paper className="p-24 rounded-2xl mb-24">
        <Typography className="font-semibold text-lg mb-16">Filtros de Pesquisa</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <DateRangePicker
              placeholder="Data Ordem"
              format="dd/MM/yy"
              character=" - "
              className="w-full"
              value={dateRange}
              onChange={setDateRange}
            />
          </Grid>
          {textFilters.map((filter) => (
            <Grid item xs={12} sm={6} md={4} key={filter.name}>
              <TextField
                fullWidth
                label={filter.label}
                value={textFilterValues[filter.name] || ''}
                onChange={(event) =>
                  setTextFilterValues((prev) => ({ ...prev, [filter.name]: event.target.value }))
                }
              />
            </Grid>
          ))}
        </Grid>
        <Box className="flex gap-10 mt-24">
          <Button variant="contained" color="secondary" onClick={handleSearch}>
            Pesquisar
          </Button>
          <Button variant="outlined" onClick={handleClear}>
            Limpar Filtros
          </Button>
        </Box>
      </Paper>

      <Paper className="p-12 rounded-2xl">
        <div style={{ height: '65vh', width: '100%' }}>
          <DataGrid
            localeText={pt.components.MuiDataGrid.defaultProps.localeText}
            rows={rows}
            columns={columns}
            getRowId={getRowId}
            paginationMode="server"
            rowCount={rowCount}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[10, 25, 50, 100]}
            loading={isLoading}
            disableRowSelectionOnClick
          />
        </div>
        <Box className="flex justify-end mt-16">
          <span className="font-bold mr-8">Valor Total:</span>
          <span className="font-bold">{formatter.format(valorTotal)}</span>
        </Box>
      </Paper>
    </div>
  );
}
