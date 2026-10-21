import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { Box, Chip, Tab, Tabs, Typography } from '@mui/material';
import { podeVerAuditoria } from 'app/configs/dashboardAccess';
import TabExecucoes from './tabs/TabExecucoes';
import TabOrdens from './tabs/TabOrdens';
import TabQuarentena from './tabs/TabQuarentena';
import TabReconciliacao from './tabs/TabReconciliacao';
import TabGuarda from './tabs/TabGuarda';
import TabSistema from './tabs/TabSistema';
import TabRequisicoes from './tabs/TabRequisicoes';

const ABAS = [
  { chave: 'execucoes', rotulo: 'Execuções' },
  { chave: 'ordens', rotulo: 'Ordens auditadas' },
  { chave: 'quarentena', rotulo: 'Quarentena' },
  { chave: 'reconciliacao', rotulo: 'Reconciliação diária' },
  { chave: 'guarda', rotulo: 'Guarda 1 ordem = 1 pagamento' },
  { chave: 'sistema', rotulo: 'Auditoria do sistema' },
  { chave: 'requisicoes', rotulo: 'Requisições' },
];

export default function AuditoriaApp() {
  const userId = useSelector(({ user }) => user?.id);
  const [aba, setAba] = useState('execucoes');
  // Permite que uma aba abra outra já filtrada (ex.: "ver ordens" de uma execução).
  const [filtroInicial, setFiltroInicial] = useState({});

  if (userId !== undefined && userId !== null && !podeVerAuditoria(userId)) {
    return <Navigate to="/" replace />;
  }

  const abrir = (chave, filtros = {}) => {
    setFiltroInicial(filtros);
    setAba(chave);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mb: 0.5 }}>
        <Typography variant="h5" fontWeight={600}>
          Auditoria
        </Typography>
        <Chip size="small" label="Acesso restrito" color="warning" variant="outlined" />
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Sincronismo de ordens do BigQuery (nova, idêntica, alterada, contida), quarentena, reconciliação diária e registro de tudo que foi
        inserido ou alterado no sistema. Os registros são somente de inclusão (não podem ser editados nem apagados).
      </Typography>

      <Tabs value={aba} onChange={(_, v) => abrir(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        {ABAS.map((a) => (
          <Tab key={a.chave} value={a.chave} label={a.rotulo} />
        ))}
      </Tabs>

      {aba === 'execucoes' && <TabExecucoes abrir={abrir} />}
      {aba === 'ordens' && <TabOrdens inicial={filtroInicial} />}
      {aba === 'quarentena' && <TabQuarentena inicial={filtroInicial} />}
      {aba === 'reconciliacao' && <TabReconciliacao />}
      {aba === 'guarda' && <TabGuarda />}
      {aba === 'sistema' && <TabSistema inicial={filtroInicial} />}
      {aba === 'requisicoes' && <TabRequisicoes />}
    </Box>
  );
}
