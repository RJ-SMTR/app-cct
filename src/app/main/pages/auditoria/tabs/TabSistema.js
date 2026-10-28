import React, { useEffect, useState } from 'react';
import { Box, Chip, Typography } from '@mui/material';
import { api } from 'app/configs/api/api';
import ListagemAuditoria from '../ListagemAuditoria';
import { CampoData, CampoSelecao, CampoTexto } from '../campos';
import { TabelaDiferencas } from './TabOrdens';
import { COR_OPERACAO, ROTULO_OPERACAO, formatDataHora, resumirJson } from '../auditoriaUtils';

const authHeaders = () => ({ Authorization: `Bearer ${window.localStorage.getItem('jwt_access_token')}` });

export default function TabSistema({ inicial = {} }) {
  const [filtros, setFiltros] = useState({ ...inicial });
  const [tabelas, setTabelas] = useState([]);

  useEffect(() => {
    api
      .get('auditoria/sistema/tabelas', { headers: authHeaders() })
      .then((res) => setTabelas(res.data))
      .catch(() => setTabelas([]));
  }, []);

  return (
    <ListagemAuditoria
      endpoint="auditoria/sistema"
      filtrosAplicados={filtros}
      onFiltrar={setFiltros}
      campos={(f, set, filtrar) => (
        <>
          <CampoSelecao
            rotulo="Tabela"
            valor={f.tabela}
            onChange={(tabela) => set({ tabela })}
            largura={240}
            opcoes={tabelas.map((t) => ({ valor: t.tabela, rotulo: `${t.tabela} (${t.ultimas24h} em 24h)` }))}
          />
          <CampoSelecao
            rotulo="Operação"
            valor={f.operacao}
            onChange={(operacao) => set({ operacao })}
            largura={150}
            opcoes={Object.entries(ROTULO_OPERACAO).map(([valor, rotulo]) => ({ valor, rotulo }))}
          />
          <CampoTexto rotulo="Registro (id)" valor={f.registroId} onChange={(registroId) => set({ registroId })} onEnter={filtrar} largura={130} />
          <CampoTexto rotulo="Usuário (id)" valor={f.usuarioId} onChange={(usuarioId) => set({ usuarioId })} onEnter={filtrar} largura={120} />
          <CampoData rotulo="De" valor={f.dataInicio} onChange={(dataInicio) => set({ dataInicio })} />
          <CampoData rotulo="Até" valor={f.dataFim} onChange={(dataFim) => set({ dataFim })} />
          <CampoTexto rotulo="Contém o texto" valor={f.texto} onChange={(texto) => set({ texto })} onEnter={filtrar} largura={200} />
        </>
      )}
      colunas={[
        { titulo: 'Data', render: (l) => formatDataHora(l.criado_em) },
        { titulo: 'Tabela', render: (l) => l.tabela },
        { titulo: 'Operação', render: (l) => <Chip size="small" color={COR_OPERACAO[l.operacao] || 'default'} label={ROTULO_OPERACAO[l.operacao] || l.operacao} /> },
        { titulo: 'Registro', render: (l) => l.registro_id ?? '—' },
        { titulo: 'Colunas', nowrap: false, render: (l) => (l.colunas_alteradas || []).join(', ') || '—' },
        { titulo: 'Usuário', render: (l) => l.usuario_app_id ?? l.usuario_db },
        { titulo: 'Resumo', nowrap: false, render: (l) => resumirJson(l.depois ?? l.antes, 90) },
      ]}
      linhaExpandida={(l) =>
        l.operacao === 'U' ? (
          <TabelaDiferencas antes={l.antes} depois={l.depois} />
        ) : (
          <Box>
            <Typography variant="caption" color="text.secondary">
              {l.operacao === 'I' ? 'Registro inserido' : 'Registro excluído'}
            </Typography>
            <Box component="pre" sx={{ m: 0, fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 280, overflow: 'auto' }}>
              {JSON.stringify(l.depois ?? l.antes, null, 2)}
            </Box>
          </Box>
        )
      }
    />
  );
}
