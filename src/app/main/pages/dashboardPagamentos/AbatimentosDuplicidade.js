import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Card,
  Chip,
  CircularProgress,
  Grid,
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
import { api } from 'app/configs/api/api';
import { formatBRL, formatQtd } from './dashboardPagamentosUtils';

export const SITUACAO_ABATIMENTO = {
  pago: { rotulo: 'Pago', cor: 'success' },
  quitado: { rotulo: 'Quitado pelo abatimento', cor: 'secondary' },
  aguardando: { rotulo: 'Aguardando banco', cor: 'info' },
  rejeitado: { rotulo: 'Rejeitado', cor: 'error' },
  aPagar: { rotulo: 'A pagar', cor: 'default' },
};

const COR_ABATIMENTO = '#7b1fa2';

export function formatarData(dataIso) {
  const [ano, mes, dia] = String(dataIso || '').split('-');
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : '-';
}

const semAcento = (texto) =>
  String(texto || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/** Filtra por parte do nome (sem diferenciar acento e maiúsculas) ou do CPF/CNPJ. */
export function filtrarAbatimentos(itens, busca) {
  const termo = semAcento(busca).trim();
  if (!termo) return itens;
  const digitos = termo.replace(/\D/g, '');
  return itens.filter(
    (i) => semAcento(i.guardador).includes(termo) || (digitos.length >= 3 && String(i.cpfCnpj || '').replace(/\D/g, '').includes(digitos))
  );
}

function Total({ rotulo, valor, detalhe, cor }) {
  return (
    <Box sx={{ borderLeft: `6px solid ${cor}`, borderRadius: 1, p: 1.5, bgcolor: 'action.hover', height: '100%' }}>
      <Typography variant="caption" color="text.secondary">
        {rotulo}
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

/** Quadro do Dashboard de Pagamentos: todos os pagamentos do período com abatimento por duplicidade (guardadores). */
export default function AbatimentosDuplicidade({ periodo }) {
  const { dataInicio, dataFim } = periodo;
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState(null);
  const [busca, setBusca] = useState('');
  const [pagina, setPagina] = useState(0);
  const [porPagina, setPorPagina] = useState(10);

  useEffect(() => {
    let ativo = true;
    setDados(null);
    setErro(null);
    setPagina(0);
    const token = window.localStorage.getItem('jwt_access_token');
    api
      .get('pagamentos-indevidos/guardadores/abatimentos', {
        headers: { Authorization: `Bearer ${token}` },
        params: { dataInicio, dataFim },
      })
      .then((response) => ativo && setDados(response.data))
      .catch((error) => ativo && setErro(error?.response?.data?.error || 'Não foi possível carregar os abatimentos por duplicidade.'));
    return () => {
      ativo = false;
    };
  }, [dataInicio, dataFim]);

  const filtrados = useMemo(() => filtrarAbatimentos(dados?.itens || [], busca), [dados, busca]);
  const visiveis = filtrados.slice(pagina * porPagina, pagina * porPagina + porPagina);
  const totais = dados?.totais;

  let conteudo;
  if (erro) {
    conteudo = <Alert severity="error">{erro}</Alert>;
  } else if (!dados) {
    conteudo = (
      <Box className="flex items-center justify-center" sx={{ py: 4 }}>
        <CircularProgress />
      </Box>
    );
  } else if (!dados.itens?.length) {
    conteudo = (
      <Alert severity="info">
        Nenhum pagamento com abatimento por duplicidade entre {formatarData(dataInicio)} e {formatarData(dataFim)}.
      </Alert>
    );
  } else {
    conteudo = (
      <>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Total
              rotulo="Pagamentos com abatimento"
              valor={formatQtd(totais.quantidade)}
              detalhe={`${formatQtd(totais.guardadores)} guardador(es)`}
              cor="#546E7A"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Total rotulo="Valor devido" valor={formatBRL(totais.valorDevido)} cor="#42A5F5" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Total rotulo="Valor abatido" valor={formatBRL(totais.valorAbatido)} cor={COR_ABATIMENTO} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Total rotulo="Valor pago" valor={formatBRL(totais.valorPago)} cor="#2E7D32" />
          </Grid>
        </Grid>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
          Os totais consideram os pagamentos pagos e os quitados pelo abatimento. A lista mostra todas as situações.
        </Typography>

        <TextField
          size="small"
          label="Buscar guardador (nome ou CPF)"
          value={busca}
          onChange={(e) => {
            setBusca(e.target.value);
            setPagina(0);
          }}
          sx={{ mb: 1, width: { xs: '100%', sm: 360 } }}
        />

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Data do pagamento</TableCell>
                <TableCell>Guardador</TableCell>
                <TableCell>CPF/CNPJ</TableCell>
                <TableCell align="right">Valor devido</TableCell>
                <TableCell align="right">Abatimento</TableCell>
                <TableCell align="right">Valor pago</TableCell>
                <TableCell align="center">Situação</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visiveis.map((i) => {
                const situacao = SITUACAO_ABATIMENTO[i.situacao] || SITUACAO_ABATIMENTO.aPagar;
                return (
                  <TableRow hover key={i.detalheAId}>
                    <TableCell>{formatarData(i.data)}</TableCell>
                    <TableCell>{i.guardador}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{i.cpfCnpj || '-'}</TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      {formatBRL(i.valorDevido)}
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap', color: COR_ABATIMENTO }}>
                      - {formatBRL(i.valorAbatido)}
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      {formatBRL(i.valorPago)}
                    </TableCell>
                    <TableCell align="center">
                      <Chip size="small" color={situacao.cor} label={situacao.rotulo} />
                    </TableCell>
                  </TableRow>
                );
              })}
              {!visiveis.length && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    Nenhum guardador encontrado para a busca.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={filtrados.length}
          page={pagina}
          onPageChange={(_e, nova) => setPagina(nova)}
          rowsPerPage={porPagina}
          rowsPerPageOptions={[10, 25, 50, 100]}
          onRowsPerPageChange={(e) => {
            setPorPagina(Number(e.target.value));
            setPagina(0);
          }}
          labelRowsPerPage="Linhas por página"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      </>
    );
  }

  return (
    <Card sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" className="font-semibold">
        Abatimento por duplicidade
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Pagamentos de guardadores com vencimento no período em que foi descontado valor pago em duplicidade.
      </Typography>
      {conteudo}
    </Card>
  );
}
