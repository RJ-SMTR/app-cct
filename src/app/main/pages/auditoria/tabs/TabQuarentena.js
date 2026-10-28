import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from '@mui/material';
import { api } from 'app/configs/api/api';
import { showMessage } from 'app/store/fuse/messageSlice';
import ListagemAuditoria from '../ListagemAuditoria';
import { CampoSelecao, CampoTexto } from '../campos';
import { TabelaDiferencas } from './TabOrdens';
import { formatDataHora, mensagemDeErro } from '../auditoriaUtils';

const ROTULO_STATUS = { pendente: 'Pendente', aprovada: 'Aprovada', rejeitada: 'Rejeitada' };
const COR_STATUS = { pendente: 'warning', aprovada: 'success', rejeitada: 'error' };

const authHeaders = () => ({ Authorization: `Bearer ${window.localStorage.getItem('jwt_access_token')}` });

/** Valores atuais x valores do BigQuery só dos campos que ficaram contidos. */
function diffQuarentena(l) {
  const campos = l.campos_divergentes || [];
  const pegar = (dados) => Object.fromEntries(campos.map((c) => [c, dados?.[c]]));
  return <TabelaDiferencas antes={pegar(l.dados_atuais)} depois={pegar(l.dados_bq)} />;
}

export default function TabQuarentena({ inicial = {} }) {
  const dispatch = useDispatch();
  const [filtros, setFiltros] = useState({ status: 'pendente', ...inicial });
  const [revisao, setRevisao] = useState(null); // { item, decisao }
  const [observacao, setObservacao] = useState('');
  const [enviando, setEnviando] = useState(false);

  const fechar = () => {
    setRevisao(null);
    setObservacao('');
  };

  const confirmar = async () => {
    const { item, decisao } = revisao;
    if (decisao === 'rejeitar' && !observacao.trim()) {
      dispatch(showMessage({ message: 'Informe o motivo da rejeição.', variant: 'warning' }));
      return;
    }
    setEnviando(true);
    try {
      await api.post(`auditoria/quarentena/${item.id}/${decisao}`, { observacao: observacao.trim() || undefined }, { headers: authHeaders() });
      dispatch(showMessage({ message: decisao === 'aprovar' ? 'Alteração aprovada e aplicada à ordem.' : 'Alteração rejeitada.', variant: 'success' }));
      fechar();
      setFiltros((atual) => ({ ...atual })); // nova identidade -> recarrega a lista
    } catch (error) {
      dispatch(showMessage({ message: mensagemDeErro(error), variant: 'error' }));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <ListagemAuditoria
        endpoint="auditoria/quarentena"
        filtrosAplicados={filtros}
        onFiltrar={setFiltros}
        vazio="Nenhum item na quarentena."
        campos={(f, set, filtrar) => (
          <>
            <CampoSelecao
              rotulo="Situação"
              valor={f.status}
              onChange={(status) => set({ status })}
              opcoes={Object.entries(ROTULO_STATUS).map(([valor, rotulo]) => ({ valor, rotulo }))}
            />
            <CampoTexto rotulo="bqId" valor={f.bqId} onChange={(bqId) => set({ bqId })} onEnter={filtrar} largura={130} />
          </>
        )}
        colunas={[
          { titulo: 'Entrada', render: (l) => formatDataHora(l.criado_em) },
          { titulo: 'bqId', render: (l) => l.bq_id },
          { titulo: 'Ordem', render: (l) => l.ordem_pagamento_id ?? '—' },
          { titulo: 'Operadora', render: (l) => l.nome_operadora ?? '—' },
          { titulo: 'Campos', render: (l) => (l.campos_divergentes || []).join(', ') },
          { titulo: 'Situação', render: (l) => <Chip size="small" color={COR_STATUS[l.status] || 'default'} label={ROTULO_STATUS[l.status] || l.status} /> },
          {
            titulo: '',
            render: (l) =>
              l.status === 'pendente' ? (
                <Box sx={{ display: 'flex', gap: 1 }} onClick={(e) => e.stopPropagation()}>
                  <Button size="small" variant="contained" color="success" onClick={() => setRevisao({ item: l, decisao: 'aprovar' })}>
                    Aprovar
                  </Button>
                  <Button size="small" variant="outlined" color="error" onClick={() => setRevisao({ item: l, decisao: 'rejeitar' })}>
                    Rejeitar
                  </Button>
                </Box>
              ) : (
                `por ${l.revisado_por ?? '—'} em ${formatDataHora(l.revisado_em)}`
              ),
          },
        ]}
        linhaExpandida={(l) => (
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {l.motivo}
            </Typography>
            {diffQuarentena(l)}
            {l.observacao_revisao && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Observação da revisão: {l.observacao_revisao}
              </Typography>
            )}
          </Box>
        )}
      />

      <Dialog open={Boolean(revisao)} onClose={enviando ? undefined : fechar} fullWidth maxWidth="sm">
        <DialogTitle>{revisao?.decisao === 'aprovar' ? 'Aprovar alteração' : 'Rejeitar alteração'}</DialogTitle>
        <DialogContent>
          {revisao && (
            <>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Ordem {revisao.item.ordem_pagamento_id} (bqId {revisao.item.bq_id}).{' '}
                {revisao.decisao === 'aprovar'
                  ? 'Os valores do BigQuery abaixo serão aplicados à ordem, mesmo ela já estando em agrupamento/pagamento.'
                  : 'A ordem continua como está e esta versão do BigQuery não volta para a quarentena.'}
              </Typography>
              {diffQuarentena(revisao.item)}
              <TextField
                autoFocus
                fullWidth
                multiline
                minRows={2}
                sx={{ mt: 2 }}
                label={revisao.decisao === 'rejeitar' ? 'Motivo da rejeição (obrigatório)' : 'Observação (opcional)'}
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
              />
            </>
          )}
        </DialogContent>
        {/* o tema global esconde DialogActions (por causa dos seletores de data); aqui os botões precisam aparecer */}
        <DialogActions sx={{ display: 'flex' }}>
          <Button onClick={fechar} disabled={enviando}>
            Cancelar
          </Button>
          <Button variant="contained" color={revisao?.decisao === 'aprovar' ? 'success' : 'error'} onClick={confirmar} disabled={enviando}>
            {revisao?.decisao === 'aprovar' ? 'Aprovar e aplicar' : 'Rejeitar'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
