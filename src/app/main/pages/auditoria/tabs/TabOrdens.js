import React, { useState } from 'react';
import { Chip, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import ListagemAuditoria from '../ListagemAuditoria';
import { CampoData, CampoSelecao, CampoTexto } from '../campos';
import { COR_ACAO, ROTULO_ACAO, diferencas, formatDataHora } from '../auditoriaUtils';

export function TabelaDiferencas({ antes, depois }) {
  const linhas = diferencas(antes, depois);
  if (linhas.length === 0) return <Typography variant="body2">Sem diferenças registradas.</Typography>;
  return (
    <Table size="small" sx={{ maxWidth: 720 }}>
      <TableHead>
        <TableRow>
          <TableCell>Campo</TableCell>
          <TableCell>Antes</TableCell>
          <TableCell>Depois</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {linhas.map((l) => (
          <TableRow key={l.campo}>
            <TableCell>{l.campo}</TableCell>
            <TableCell>{l.antes === null || l.antes === undefined ? '—' : String(l.antes)}</TableCell>
            <TableCell>{l.depois === null || l.depois === undefined ? '—' : String(l.depois)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function TabOrdens({ inicial = {} }) {
  const [filtros, setFiltros] = useState({ ...inicial });

  return (
    <ListagemAuditoria
      endpoint="auditoria/ordens"
      filtrosAplicados={filtros}
      onFiltrar={setFiltros}
      campos={(f, set, filtrar) => (
        <>
          <CampoSelecao
            rotulo="Ação"
            valor={f.acao}
            onChange={(acao) => set({ acao })}
            opcoes={Object.entries(ROTULO_ACAO).map(([valor, rotulo]) => ({ valor, rotulo }))}
          />
          <CampoTexto rotulo="bqId" valor={f.bqId} onChange={(bqId) => set({ bqId })} onEnter={filtrar} largura={130} />
          <CampoTexto rotulo="Ordem (id)" valor={f.ordemId} onChange={(ordemId) => set({ ordemId })} onEnter={filtrar} largura={130} />
          <CampoTexto rotulo="Execução" valor={f.execucaoId} onChange={(execucaoId) => set({ execucaoId })} onEnter={filtrar} largura={110} />
          <CampoData rotulo="De" valor={f.dataInicio} onChange={(dataInicio) => set({ dataInicio })} />
          <CampoData rotulo="Até" valor={f.dataFim} onChange={(dataFim) => set({ dataFim })} />
        </>
      )}
      colunas={[
        { titulo: 'Data', render: (l) => formatDataHora(l.criado_em) },
        { titulo: 'Ação', render: (l) => <Chip size="small" color={COR_ACAO[l.acao] || 'default'} label={ROTULO_ACAO[l.acao] || l.acao} /> },
        { titulo: 'bqId', render: (l) => l.bq_id ?? '—' },
        { titulo: 'Ordem', render: (l) => l.ordem_pagamento_id ?? '—' },
        { titulo: 'Execução', render: (l) => l.execucao_id ?? '—' },
        { titulo: 'Usuário', render: (l) => l.usuario_id ?? '—' },
        { titulo: 'Motivo', nowrap: false, render: (l) => l.motivo },
      ]}
      linhaExpandida={(l) => <TabelaDiferencas antes={l.antes} depois={l.depois} />}
    />
  );
}
