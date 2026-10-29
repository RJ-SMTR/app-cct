import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { api } from 'app/configs/api/api';
import { showMessage } from 'app/store/fuse/messageSlice';
import {
  corpoDoFormulario,
  formatBRL,
  formatData,
  formularioDe,
  formularioNovo,
  idManual,
  ORIGEM_ROTULO,
  STATUS_OPCOES,
} from './controleRemessaErroUtils';

const authHeaders = () => ({ Authorization: `Bearer ${window.localStorage.getItem('jwt_access_token')}` });

const VAZIO = { total: 0, totais: { quantidade: 0, automaticos: 0, manuais: 0, valorPagar: 0, valorPagoJuizo: 0, valorTotalPago: 0 }, itens: [] };

const hojeIso = () => new Date().toISOString().slice(0, 10);
const diasAtrasIso = (dias) => new Date(Date.now() - dias * 86400000).toISOString().slice(0, 10);

const corDoStatus = (status) => {
  if (status === 'Pago') return { bgcolor: '#2e7d32', color: '#fff' };
  if (status === 'Não Pago' || status === 'FRAUDE') return { bgcolor: '#d32f2f', color: '#fff' };
  if (status === 'Pago parcial' || status === 'Pgto. Pendentes') return { bgcolor: '#ed6c02', color: '#fff' };
  return { bgcolor: '#9ca3af', color: '#000' };
};

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

export default function ControleRemessaErroApp() {
  const dispatch = useDispatch();
  const [dataInicio, setDataInicio] = useState(diasAtrasIso(90));
  const [dataFim, setDataFim] = useState(hojeIso());
  const [busca, setBusca] = useState('');
  const [origem, setOrigem] = useState('');
  const [status, setStatus] = useState('');
  const [aplicado, setAplicado] = useState({ dataInicio: diasAtrasIso(90), dataFim: hojeIso(), busca: '', origem: '', status: '' });
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [carregando, setCarregando] = useState(false);
  const [resultado, setResultado] = useState(VAZIO);
  const [recarregar, setRecarregar] = useState(0);

  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(formularioNovo());
  const [erroForm, setErroForm] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(null);

  const buscar = (event) => {
    event?.preventDefault();
    setPage(0);
    setAplicado({ dataInicio, dataFim, busca: busca.trim(), origem, status });
  };

  const parametros = useCallback(
    () => ({
      dataInicio: aplicado.dataInicio || undefined,
      dataFim: aplicado.dataFim || undefined,
      busca: aplicado.busca || undefined,
      origem: aplicado.origem || undefined,
      status: aplicado.status || undefined,
    }),
    [aplicado],
  );

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    api
      .get('controle-remessa-erros', { headers: authHeaders(), params: { ...parametros(), page: page + 1, pageSize } })
      .then((res) => !cancelado && setResultado(res.data))
      .catch((error) => {
        if (cancelado) return;
        setResultado(VAZIO);
        dispatch(showMessage({ message: error?.response?.data?.error || 'Não foi possível carregar o controle de remessas.', variant: 'error' }));
      })
      .finally(() => !cancelado && setCarregando(false));
    return () => {
      cancelado = true;
    };
  }, [dispatch, parametros, page, pageSize, recarregar]);

  const abrirNovo = () => {
    setEditando('novo');
    setForm(formularioNovo());
    setErroForm(null);
  };

  const abrirEdicao = (item) => {
    setEditando(item);
    setForm(formularioDe(item));
    setErroForm(null);
  };

  const campo = (nome) => ({
    value: form[nome],
    onChange: (e) => {
      setForm((atual) => ({ ...atual, [nome]: e.target.value }));
      setErroForm(null);
    },
  });

  const salvar = async () => {
    const { erro, corpo } = corpoDoFormulario(form);
    if (erro) {
      setErroForm(erro);
      return;
    }
    setSalvando(true);
    try {
      if (editando === 'novo') {
        await api.post('controle-remessa-erros', corpo, { headers: authHeaders() });
      } else {
        await api.patch(`controle-remessa-erros/${idManual(editando.id)}`, corpo, { headers: authHeaders() });
      }
      dispatch(showMessage({ message: 'Lançamento salvo', variant: 'success' }));
      setEditando(null);
      setRecarregar((n) => n + 1);
    } catch (error) {
      setErroForm(error?.response?.data?.error || 'Não foi possível salvar o lançamento.');
    } finally {
      setSalvando(false);
    }
  };

  const excluir = async () => {
    setSalvando(true);
    try {
      await api.delete(`controle-remessa-erros/${idManual(excluindo.id)}`, { headers: authHeaders() });
      dispatch(showMessage({ message: 'Lançamento excluído', variant: 'success' }));
      setExcluindo(null);
      setRecarregar((n) => n + 1);
    } catch (error) {
      dispatch(showMessage({ message: error?.response?.data?.error || 'Não foi possível excluir o lançamento.', variant: 'error' }));
    } finally {
      setSalvando(false);
    }
  };

  const { totais } = resultado;

  return (
    <Box className="p-24 pt-10">
      <Card sx={{ p: 3, mt: 4, mb: 3 }}>
        <Box className="flex flex-wrap items-start justify-between gap-16" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h5" className="font-semibold">
              Controle Remessa Erros
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Remessas com pagamentos não efetivados entram automaticamente. Use Novo lançamento para registrar ocorrências manuais.
            </Typography>
          </Box>
          <Button variant="contained" color="secondary" startIcon={<AddIcon />} onClick={abrirNovo}>
            Novo lançamento
          </Button>
        </Box>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Quadro titulo="Registros" valor={totais.quantidade} detalhe={`${totais.automaticos} automático(s) · ${totais.manuais} manual(is)`} cor="#ed6c02" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Quadro titulo="Valor p/ pgto" valor={formatBRL(totais.valorPagar)} cor="#185fa5" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Quadro titulo="Valor total pago" valor={formatBRL(totais.valorTotalPago)} cor="#2e7d32" />
          </Grid>
        </Grid>

        <Box component="form" noValidate onSubmit={buscar} className="flex flex-wrap items-start gap-16">
          <TextField label="Geração de" type="date" InputLabelProps={{ shrink: true }} value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
          <TextField label="Geração até" type="date" InputLabelProps={{ shrink: true }} value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
          <TextField label="Remessa, favorecido ou ocorrência" value={busca} onChange={(e) => setBusca(e.target.value)} sx={{ minWidth: 300 }} />
          <TextField select label="Origem" value={origem} onChange={(e) => setOrigem(e.target.value)} sx={{ minWidth: 150 }}>
            <MenuItem value="">Todas</MenuItem>
            <MenuItem value="automatico">Automático</MenuItem>
            <MenuItem value="manual">Manual</MenuItem>
          </TextField>
          <TextField select label="Status" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 190 }}>
            <MenuItem value="">Todos</MenuItem>
            {STATUS_OPCOES.map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </TextField>
          <Button type="submit" variant="contained" color="secondary" sx={{ height: 56 }}>
            Buscar
          </Button>
        </Box>
      </Card>

      <Card sx={{ p: 2 }}>
        {!carregando && resultado.itens.length === 0 ? (
          <Alert severity="info">Nenhum registro encontrado para o filtro.</Alert>
        ) : (
          <TableContainer sx={{ maxHeight: 'calc(100vh - 460px)', minHeight: 320 }}>
            <Table size="small" stickyHeader sx={{ opacity: carregando ? 0.6 : 1 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Data geração</TableCell>
                  <TableCell>Data pagamento</TableCell>
                  <TableCell>Nome remessa</TableCell>
                  <TableCell>Favorecido/Consórcio</TableCell>
                  <TableCell align="right">Valor p/ pgto</TableCell>
                  <TableCell align="right">Pago em juízo</TableCell>
                  <TableCell align="right">Total pago</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell sx={{ minWidth: 260 }}>Ocorrência</TableCell>
                  <TableCell>Origem</TableCell>
                  <TableCell align="center">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {resultado.itens.map((i) => (
                  <TableRow key={i.id} hover>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatData(i.dataGeracao)}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatData(i.dataPagamento)}</TableCell>
                    <TableCell sx={{ wordBreak: 'break-all' }}>{i.nomeRemessa || '—'}</TableCell>
                    <TableCell>{i.favorecido || '—'}</TableCell>
                    <TableCell align="right">{formatBRL(i.valorPagar)}</TableCell>
                    <TableCell align="right">{formatBRL(i.valorPagoJuizo)}</TableCell>
                    <TableCell align="right">{formatBRL(i.valorTotalPago)}</TableCell>
                    <TableCell>{i.status ? <Chip size="small" label={i.status} sx={{ ...corDoStatus(i.status), fontWeight: 500 }} /> : '—'}</TableCell>
                    <TableCell sx={{ whiteSpace: 'pre-line' }}>{i.ocorrencia || '—'}</TableCell>
                    <TableCell>
                      <Chip size="small" variant="outlined" label={ORIGEM_ROTULO[i.origem]} />
                    </TableCell>
                    <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                      {i.origem === 'manual' ? (
                        <>
                          <Tooltip title="Editar">
                            <IconButton size="small" aria-label="Editar" onClick={() => abrirEdicao(i)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Excluir">
                            <IconButton size="small" aria-label="Excluir" onClick={() => setExcluindo(i)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      ) : (
                        '—'
                      )}
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

      <Dialog open={Boolean(editando)} onClose={() => !salvando && setEditando(null)} maxWidth="md" fullWidth>
        <DialogTitle>{editando === 'novo' ? 'Novo lançamento' : 'Editar lançamento'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth required label="Data geração remessa" type="date" InputLabelProps={{ shrink: true }} {...campo('dataGeracao')} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Data pagamento" type="date" InputLabelProps={{ shrink: true }} {...campo('dataPagamento')} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Nome remessa" {...campo('nomeRemessa')} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Favorecido/Consórcio" {...campo('favorecido')} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Valor p/ pgto" placeholder="0,00" {...campo('valorPagar')} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Valor pago em juízo" placeholder="0,00" {...campo('valorPagoJuizo')} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Valor total pago" placeholder="0,00" {...campo('valorTotalPago')} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth select label="Status" {...campo('status')}>
                <MenuItem value="">Sem status</MenuItem>
                {STATUS_OPCOES.map((s) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline minRows={3} label="Ocorrência" {...campo('ocorrencia')} />
            </Grid>
            {erroForm && (
              <Grid item xs={12}>
                <Alert severity="error">{erroForm}</Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ display: 'flex', px: 3, pb: 2 }}>
          <Button onClick={() => setEditando(null)} disabled={salvando}>
            Cancelar
          </Button>
          <Button variant="contained" color="secondary" onClick={salvar} disabled={salvando} startIcon={salvando ? <CircularProgress size={18} /> : null}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(excluindo)} onClose={() => !salvando && setExcluindo(null)}>
        <DialogTitle>Excluir lançamento</DialogTitle>
        <DialogContent>
          <Typography>Excluir o lançamento de {excluindo ? formatData(excluindo.dataGeracao) : ''}? Essa ação não pode ser desfeita.</Typography>
        </DialogContent>
        <DialogActions sx={{ display: 'flex', px: 3, pb: 2 }}>
          <Button onClick={() => setExcluindo(null)} disabled={salvando}>
            Cancelar
          </Button>
          <Button variant="contained" color="error" onClick={excluir} disabled={salvando}>
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
