import React, { useState } from 'react';
import { Box, Chip } from '@mui/material';
import ListagemAuditoria from '../ListagemAuditoria';
import { CampoData, CampoSelecao, CampoTexto } from '../campos';
import { formatDataHora } from '../auditoriaUtils';

const corStatus = (status) => (status >= 500 ? 'error' : status >= 400 ? 'warning' : 'success');

export default function TabRequisicoes() {
  const [filtros, setFiltros] = useState({});

  return (
    <ListagemAuditoria
      endpoint="auditoria/requisicoes"
      filtrosAplicados={filtros}
      onFiltrar={setFiltros}
      campos={(f, set, filtrar) => (
        <>
          <CampoTexto rotulo="Usuário (id)" valor={f.usuarioId} onChange={(usuarioId) => set({ usuarioId })} onEnter={filtrar} largura={120} />
          <CampoSelecao
            rotulo="Método"
            valor={f.metodo}
            onChange={(metodo) => set({ metodo })}
            largura={130}
            opcoes={['POST', 'PUT', 'PATCH', 'DELETE'].map((m) => ({ valor: m, rotulo: m }))}
          />
          <CampoTexto rotulo="Rota contém" valor={f.rota} onChange={(rota) => set({ rota })} onEnter={filtrar} largura={200} />
          <CampoData rotulo="De" valor={f.dataInicio} onChange={(dataInicio) => set({ dataInicio })} />
          <CampoData rotulo="Até" valor={f.dataFim} onChange={(dataFim) => set({ dataFim })} />
        </>
      )}
      colunas={[
        { titulo: 'Data', render: (l) => formatDataHora(l.criado_em) },
        { titulo: 'Usuário', render: (l) => l.usuario_id ?? '—' },
        { titulo: 'Método', render: (l) => l.metodo },
        { titulo: 'Rota', nowrap: false, render: (l) => l.rota },
        { titulo: 'Status', render: (l) => <Chip size="small" color={corStatus(l.status_http)} label={l.status_http ?? '—'} /> },
        { titulo: 'Duração', align: 'right', render: (l) => (l.duracao_ms != null ? `${l.duracao_ms} ms` : '—') },
        { titulo: 'IP', render: (l) => l.ip ?? '—' },
      ]}
      linhaExpandida={(l) => (
        <Box component="pre" sx={{ m: 0, fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 280, overflow: 'auto' }}>
          {l.corpo ? JSON.stringify(l.corpo, null, 2) : 'Sem corpo.'}
        </Box>
      )}
    />
  );
}
