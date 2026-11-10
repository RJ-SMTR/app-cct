import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import { api } from 'app/configs/api/api';
import { showMessage } from 'app/store/fuse/messageSlice';
import { CampoData } from './campos';
import { MAX_DIAS_SINCRONIZACAO, mensagemDeErro, validarPeriodoSincronizacao } from './auditoriaUtils';

const authHeaders = () => ({ Authorization: `Bearer ${window.localStorage.getItem('jwt_access_token')}` });

/**
 * Botão + janela para sincronizar com o BigQuery as ordens capturadas num período (data inicial e final).
 * Chama POST auditoria/sincronizar; a execução fica registrada na lista de Execuções (`onConcluir` recarrega a lista).
 */
export default function SincronizarOrdensDialog({ onConcluir }) {
  const dispatch = useDispatch();
  const [aberto, setAberto] = useState(false);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [resultado, setResultado] = useState(null);

  const fechar = () => {
    if (enviando) return;
    setAberto(false);
    setErro('');
    setResultado(null);
  };

  const sincronizar = async () => {
    const invalido = validarPeriodoSincronizacao(dataInicio, dataFim);
    if (invalido) {
      setErro(invalido);
      return;
    }
    setErro('');
    setResultado(null);
    setEnviando(true);
    try {
      const { data } = await api.post('auditoria/sincronizar', { dataInicio, dataFim }, { headers: authHeaders() });
      setResultado(data);
      dispatch(showMessage({ message: 'Sincronização concluída.', variant: 'success' }));
      onConcluir?.();
    } catch (error) {
      setErro(mensagemDeErro(error, 'Não foi possível sincronizar as ordens.'));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <Button variant="outlined" startIcon={<SyncIcon />} onClick={() => setAberto(true)}>
        Sincronizar período
      </Button>
      <Dialog open={aberto} onClose={fechar} maxWidth="xs" fullWidth>
        <DialogTitle>Sincronizar ordens do BigQuery</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Busca no BigQuery as ordens capturadas no período (datas inclusive, no máximo {MAX_DIAS_SINCRONIZACAO} dias). Grava só o que falta ou mudou;
            ordem com valor alterado vai para a quarentena. Não agrupa nem paga nada.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, mt: 1 }}>
            <CampoData rotulo="Data inicial" valor={dataInicio} onChange={setDataInicio} largura={170} />
            <CampoData rotulo="Data final" valor={dataFim} onChange={setDataFim} largura={170} />
          </Box>
          {erro && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {erro}
            </Alert>
          )}
          {resultado && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Execução #{resultado.execucaoId}: {resultado.encontradasNoBigQuery} no BigQuery, {resultado.inseridas} novas, {resultado.identicas} idênticas,{' '}
              {resultado.alteradas} alteradas ({resultado.contidas} contidas), {resultado.ignoradas} ignoradas, {resultado.erros} com erro.
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ display: 'flex' }}>
          <Button onClick={fechar} disabled={enviando}>
            Fechar
          </Button>
          <Button variant="contained" onClick={sincronizar} disabled={enviando}>
            {enviando ? 'Sincronizando…' : 'Sincronizar'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
