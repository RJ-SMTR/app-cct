import React, { useState } from 'react';
import { Button, Chip, Typography } from '@mui/material';
import ListagemAuditoria from '../ListagemAuditoria';
import { CampoSelecao } from '../campos';
import { COR_STATUS_EXECUCAO, ROTULO_STATUS_EXECUCAO, formatData, formatDataHora } from '../auditoriaUtils';

export default function TabExecucoes({ abrir }) {
  const [filtros, setFiltros] = useState({});

  return (
    <ListagemAuditoria
      endpoint="auditoria/execucoes"
      filtrosAplicados={filtros}
      onFiltrar={setFiltros}
      campos={(f, set) => (
        <>
          <CampoSelecao
            rotulo="Origem"
            valor={f.origem}
            onChange={(origem) => set({ origem })}
            opcoes={[
              { valor: 'cron', rotulo: 'Automática (cron)' },
              { valor: 'manual', rotulo: 'Manual' },
            ]}
          />
          <CampoSelecao
            rotulo="Status"
            valor={f.status}
            onChange={(status) => set({ status })}
            opcoes={Object.entries(ROTULO_STATUS_EXECUCAO).map(([valor, rotulo]) => ({ valor, rotulo }))}
          />
        </>
      )}
      colunas={[
        { titulo: '#', render: (l) => l.id },
        { titulo: 'Início', render: (l) => formatDataHora(l.iniciada_em) },
        { titulo: 'Fim', render: (l) => formatDataHora(l.finalizada_em) },
        { titulo: 'Origem', render: (l) => (l.origem === 'manual' ? `Manual (usuário ${l.usuario_id ?? '—'})` : 'Cron') },
        { titulo: 'Janela', render: (l) => `${formatData(l.janela_inicio)} a ${formatData(l.janela_fim)}` },
        {
          titulo: 'Status',
          render: (l) => <Chip size="small" color={COR_STATUS_EXECUCAO[l.status] || 'default'} label={ROTULO_STATUS_EXECUCAO[l.status] || l.status} />,
        },
        { titulo: 'BigQuery', align: 'right', render: (l) => l.encontradas },
        { titulo: 'Novas', align: 'right', render: (l) => l.novas },
        { titulo: 'Idênticas', align: 'right', render: (l) => l.identicas },
        { titulo: 'Alteradas', align: 'right', render: (l) => l.alteradas },
        { titulo: 'Contidas', align: 'right', render: (l) => l.contidas },
        { titulo: 'Ignoradas', align: 'right', render: (l) => l.ignoradas },
        { titulo: 'Erros', align: 'right', render: (l) => l.erros },
        {
          titulo: '',
          render: (l) => (
            <Button size="small" onClick={() => abrir('ordens', { execucaoId: String(l.id) })}>
              Ver ordens
            </Button>
          ),
        },
      ]}
      linhaExpandida={(l) =>
        l.observacao ? (
          <Typography variant="body2" color="error">
            {l.observacao}
          </Typography>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Consórcios: {(l.consorcios || []).join(', ') || '—'} {l.forcar ? '· comparação forçada' : ''}
          </Typography>
        )
      }
    />
  );
}
