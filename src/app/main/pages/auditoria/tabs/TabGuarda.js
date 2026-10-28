import React, { useState } from 'react';
import { Alert } from '@mui/material';
import ListagemAuditoria from '../ListagemAuditoria';
import { CampoData } from '../campos';
import { formatBRL, formatData } from '../auditoriaUtils';

const trintaDiasAtras = () => new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

export default function TabGuarda() {
  const [filtros, setFiltros] = useState({ desde: trintaDiasAtras() });

  return (
    <>
      <Alert severity="info" sx={{ mb: 2 }}>
        Guarda do agrupamento: cada ordem deve estar ligada a <strong>um único pagamento</strong> efetivado. Abaixo, as ordens ligadas a mais de um
        pagamento efetivado (confira cada caso antes de agir).
      </Alert>
      <ListagemAuditoria
        endpoint="auditoria/guarda"
        filtrosAplicados={filtros}
        onFiltrar={setFiltros}
        chave="ordem_id"
        vazio="Nenhuma ordem com mais de um pagamento no período."
        campos={(f, set) => <CampoData rotulo="Capturadas desde" valor={f.desde} onChange={(desde) => set({ desde })} />}
        colunas={[
          { titulo: 'Ordem', render: (l) => l.ordem_id },
          { titulo: 'bqId', render: (l) => l.bq_id ?? '—' },
          { titulo: 'Consórcio', render: (l) => l.nome_consorcio },
          { titulo: 'Operadora', render: (l) => l.nome_operadora },
          { titulo: 'Captura', render: (l) => formatData(l.data_captura) },
          { titulo: 'Valor da ordem', align: 'right', render: (l) => formatBRL(l.valor) },
          { titulo: 'Pagamentos', align: 'right', render: (l) => l.pagamentos },
          { titulo: 'Detalhes A', render: (l) => (l.detalhe_a_ids || []).join(', ') },
          { titulo: 'Soma dos lançamentos', align: 'right', render: (l) => formatBRL(l.soma_lancamentos) },
        ]}
      />
    </>
  );
}
