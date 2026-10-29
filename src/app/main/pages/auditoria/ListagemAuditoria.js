import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { api } from 'app/configs/api/api';
import { showMessage } from 'app/store/fuse/messageSlice';
import { limparFiltros, mensagemDeErro } from './auditoriaUtils';

function authHeaders() {
  const token = window.localStorage.getItem('jwt_access_token');
  return { Authorization: `Bearer ${token}` };
}

const OPCOES_LINHAS = [25, 50, 100, 200];

/**
 * Busca paginada no servidor. `filtros` só é aplicado ao clicar em Filtrar (ou ao trocar de página), para
 * não consultar a cada tecla digitada.
 */
export function useListagem(endpoint, filtrosAplicados) {
  const dispatch = useDispatch();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [dados, setDados] = useState({ itens: [], total: 0 });
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const requisicao = useRef(0);

  const carregar = useCallback(() => {
    const atual = ++requisicao.current;
    setCarregando(true);
    setErro('');
    api
      .get(endpoint, { headers: authHeaders(), params: { ...limparFiltros(filtrosAplicados), page: page + 1, pageSize } })
      .then((res) => {
        if (atual === requisicao.current) setDados(res.data);
      })
      .catch((error) => {
        if (atual !== requisicao.current) return;
        const mensagem = mensagemDeErro(error, 'Não foi possível carregar os dados.');
        setErro(mensagem);
        dispatch(showMessage({ message: mensagem, variant: 'error' }));
      })
      .finally(() => {
        if (atual === requisicao.current) setCarregando(false);
      });
  }, [endpoint, filtrosAplicados, page, pageSize, dispatch]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return { dados, carregando, erro, page, setPage, pageSize, setPageSize, recarregar: carregar };
}

/** Barra de filtros + tabela paginada. `colunas`: [{ titulo, render(linha), align? }]. */
export default function ListagemAuditoria({
  endpoint,
  filtrosAplicados,
  onFiltrar,
  campos,
  colunas,
  chave = 'id',
  vazio = 'Nenhum registro encontrado.',
  extra,
  linhaExpandida,
}) {
  const [rascunho, setRascunho] = useState(filtrosAplicados);
  const [aberta, setAberta] = useState(null);
  const proprio = useListagem(endpoint, filtrosAplicados);
  const { dados, carregando, erro, page, setPage, pageSize, setPageSize } = proprio;

  const filtrar = () => {
    setPage(0);
    onFiltrar(rascunho);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'flex-end', mb: 2 }}>
        {campos(rascunho, (parcial) => setRascunho((atual) => ({ ...atual, ...parcial })), filtrar)}
        <Button variant="contained" startIcon={<SearchIcon />} onClick={filtrar} disabled={carregando}>
          Filtrar
        </Button>
        {extra}
      </Box>

      {erro && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {erro}
        </Alert>
      )}

      <Paper variant="outlined">
        <TableContainer sx={{ maxHeight: '60vh' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {colunas.map((c) => (
                  <TableCell key={c.titulo} align={c.align} sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {c.titulo}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {carregando && dados.itens.length === 0 && (
                <TableRow>
                  <TableCell colSpan={colunas.length} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              )}
              {!carregando && dados.itens.length === 0 && (
                <TableRow>
                  <TableCell colSpan={colunas.length} align="center">
                    <Typography color="text.secondary" variant="body2">
                      {vazio}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              {dados.itens.map((linha) => {
                const id = linha[chave];
                const expandivel = Boolean(linhaExpandida);
                return (
                  <React.Fragment key={id}>
                    <TableRow
                      hover
                      onClick={expandivel ? () => setAberta(aberta === id ? null : id) : undefined}
                      sx={{ cursor: expandivel ? 'pointer' : 'default', opacity: carregando ? 0.6 : 1 }}
                    >
                      {colunas.map((c) => (
                        <TableCell key={c.titulo} align={c.align} sx={c.nowrap === false ? undefined : { whiteSpace: 'nowrap' }}>
                          {c.render(linha)}
                        </TableCell>
                      ))}
                    </TableRow>
                    {expandivel && aberta === id && (
                      <TableRow>
                        <TableCell colSpan={colunas.length} sx={{ bgcolor: 'action.hover' }}>
                          {linhaExpandida(linha)}
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={dados.total}
          page={page}
          rowsPerPage={pageSize}
          rowsPerPageOptions={OPCOES_LINHAS}
          onPageChange={(_, nova) => setPage(nova)}
          onRowsPerPageChange={(e) => {
            setPageSize(Number(e.target.value));
            setPage(0);
          }}
          labelRowsPerPage="Linhas por página"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      </Paper>
    </Box>
  );
}
