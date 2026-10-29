import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Grid,
  InputAdornment,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { api } from 'app/configs/api/api';
import { showMessage } from 'app/store/fuse/messageSlice';
import { baixarPlanilha, formatBRL, formatCpfCnpj, formatData, nomeArquivo, ROTULO_SITUACAO } from './pagamentosIndevidosUtils';

const BUSCA_MINIMA = 2;

const authHeaders = () => ({ Authorization: `Bearer ${window.localStorage.getItem('jwt_access_token')}` });

function Quadro({ titulo, valor, detalhe, cor }) {
  return (
    <Box sx={{ borderLeft: `6px solid ${cor}`, borderRadius: 1, p: 1.5, bgcolor: 'action.hover', height: '100%' }}>
      <Typography variant="caption" color="text.secondary">
        {titulo}
      </Typography>
      <Typography variant="h6" sx={{ lineHeight: 1.2 }}>
        {valor}
      </Typography>
      {detalhe && (
        <Typography variant="body2" color="text.secondary">
          {detalhe}
        </Typography>
      )}
    </Box>
  );
}

const VAZIO = { total: 0, totais: { quantidade: 0, devendo: 0, valorIndevido: '0', valorDebitado: '0', saldoDevedor: '0' }, itens: [] };

export default function PagamentosIndevidosApp() {
  const dispatch = useDispatch();
  const [busca, setBusca] = useState('');
  const [situacao, setSituacao] = useState('devendo');
  const [aplicado, setAplicado] = useState({ busca: '', situacao: 'devendo' });
  const [erroBusca, setErroBusca] = useState(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [carregando, setCarregando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [resultado, setResultado] = useState(VAZIO);

  const buscar = (event) => {
    event?.preventDefault();
    const termo = busca.trim();
    if (termo && termo.length < BUSCA_MINIMA) {
      setErroBusca(`Digite ao menos ${BUSCA_MINIMA} caracteres.`);
      return;
    }
    setErroBusca(null);
    setPage(0);
    setAplicado({ busca: termo, situacao });
  };

  const parametros = useCallback(() => ({ busca: aplicado.busca || undefined, situacao: aplicado.situacao || undefined }), [aplicado]);

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    api
      .get('pagamentos-indevidos/guardadores', { headers: authHeaders(), params: { ...parametros(), page: page + 1, pageSize } })
      .then((res) => !cancelado && setResultado(res.data))
      .catch((error) => {
        if (cancelado) return;
        setResultado(VAZIO);
        dispatch(showMessage({ message: error?.response?.data?.error || 'Não foi possível carregar os pagamentos indevidos.', variant: 'error' }));
      })
      .finally(() => !cancelado && setCarregando(false));
    return () => {
      cancelado = true;
    };
  }, [dispatch, parametros, page, pageSize]);

  const exportar = async () => {
    setExportando(true);
    try {
      const { data } = await api.get('pagamentos-indevidos/guardadores/exportar', { headers: authHeaders(), params: parametros() });
      baixarPlanilha(data.itens, nomeArquivo());
      dispatch(showMessage({ message: `${data.itens.length} linha(s) exportada(s).`, variant: 'success' }));
    } catch (error) {
      dispatch(showMessage({ message: error?.response?.data?.error || 'Não foi possível exportar para o Excel.', variant: 'error' }));
    } finally {
      setExportando(false);
    }
  };

  const { totais } = resultado;

  return (
    <Box className="p-24 pt-10">
      <Card sx={{ p: 3, mt: 4, mb: 3 }}>
        <Typography variant="h5" className="font-semibold">
          Indevidos Guardadores
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Valores pagos a mais aos guardadores: quanto foi pago indevidamente, quanto já foi debitado e quanto o guardador ainda deve.
        </Typography>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Quadro titulo="Pago indevidamente" valor={formatBRL(totais.valorIndevido)} detalhe={`${totais.quantidade} registro(s)`} cor="#ed6c02" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Quadro titulo="Já debitado" valor={formatBRL(totais.valorDebitado)} detalhe={`${totais.quantidade - totais.devendo} guardador(es) quitado(s)`} cor="#2e7d32" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Quadro titulo="Deve (saldo devedor)" valor={formatBRL(totais.saldoDevedor)} detalhe={`${totais.devendo} guardador(es) devendo`} cor="#d32f2f" />
          </Grid>
        </Grid>

        <Box component="form" noValidate onSubmit={buscar} className="flex flex-wrap items-start gap-16">
          <TextField
            label="Guardador (nome ou CPF/CNPJ)"
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
          <TextField select label="Situação" value={situacao} onChange={(e) => setSituacao(e.target.value)} sx={{ minWidth: 180 }}>
            <MenuItem value="">Todas</MenuItem>
            <MenuItem value="devendo">Devendo</MenuItem>
            <MenuItem value="quitado">Quitado</MenuItem>
          </TextField>
          <Button type="submit" variant="contained" color="secondary" sx={{ height: 56 }}>
            Buscar
          </Button>
          <Button
            variant="outlined"
            sx={{ height: 56 }}
            startIcon={exportando ? <CircularProgress size={18} /> : <FileDownloadIcon />}
            disabled={exportando || carregando || !resultado.total}
            onClick={exportar}
          >
            {exportando ? 'Exportando...' : 'Exportar Excel'}
          </Button>
        </Box>
      </Card>

      <Card sx={{ p: 2 }}>
        {!carregando && resultado.itens.length === 0 ? (
          <Alert severity="info">Nenhum pagamento indevido encontrado para o filtro.</Alert>
        ) : (
          <TableContainer sx={{ maxHeight: 'calc(100vh - 560px)', minHeight: 320 }}>
            <Table size="small" stickyHeader sx={{ opacity: carregando ? 0.6 : 1 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Guardador</TableCell>
                  <TableCell>CPF/CNPJ</TableCell>
                  <TableCell>Referência</TableCell>
                  <TableCell align="right">Indevido</TableCell>
                  <TableCell align="right">Já debitado</TableCell>
                  <TableCell align="right">Deve</TableCell>
                  <TableCell>Situação</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {resultado.itens.map((i) => (
                  <TableRow key={i.id} hover>
                    <TableCell>{i.guardador}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatCpfCnpj(i.cpfCnpj)}</TableCell>
                    <TableCell>{formatData(i.dataReferencia)}</TableCell>
                    <TableCell align="right">{formatBRL(i.valorIndevido)}</TableCell>
                    <TableCell align="right" sx={{ color: '#2e7d32', fontWeight: 500 }}>
                      {formatBRL(i.valorDebitado)}
                    </TableCell>
                    <TableCell align="right" sx={{ color: Number(i.saldoDevedor) > 0 ? '#d32f2f' : undefined, fontWeight: 600 }}>
                      {formatBRL(i.saldoDevedor)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={ROTULO_SITUACAO[i.situacao] ?? i.situacao}
                        sx={{ bgcolor: i.situacao === 'devendo' ? '#d32f2f' : '#2e7d32', color: '#fff', fontWeight: 500 }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        <TablePagination
          component="div"
          count={resultado.total}
          page={page}
          rowsPerPage={pageSize}
          rowsPerPageOptions={[25, 50, 100]}
          onPageChange={(_e, nova) => setPage(nova)}
          onRowsPerPageChange={(e) => {
            setPageSize(Number(e.target.value));
            setPage(0);
          }}
          labelRowsPerPage="Linhas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
          showFirstButton
          showLastButton
        />
      </Card>
    </Box>
  );
}
