import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Button, Chip, FormControlLabel, Switch } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { api } from 'app/configs/api/api';
import { showMessage } from 'app/store/fuse/messageSlice';
import ListagemAuditoria from '../ListagemAuditoria';
import { CampoData } from '../campos';
import { formatBRL, formatData, formatDataHora, mensagemDeErro } from '../auditoriaUtils';

const authHeaders = () => ({ Authorization: `Bearer ${window.localStorage.getItem('jwt_access_token')}` });

export default function TabReconciliacao() {
  const dispatch = useDispatch();
  const [filtros, setFiltros] = useState({ somenteDivergentes: true });
  const [recalculando, setRecalculando] = useState(false);

  const recalcular = async (aplicados) => {
    if (!aplicados.dataInicio || !aplicados.dataFim) {
      dispatch(showMessage({ message: 'Informe o período (De e Até) para recalcular.', variant: 'warning' }));
      return;
    }
    setRecalculando(true);
    try {
      const { data } = await api.post('auditoria/reconciliacao/recalcular', { dataInicio: aplicados.dataInicio, dataFim: aplicados.dataFim }, { headers: authHeaders() });
      dispatch(showMessage({ message: `${data.atualizadas} dia(s) recalculado(s).`, variant: 'success' }));
      setFiltros((atual) => ({ ...atual }));
    } catch (error) {
      dispatch(showMessage({ message: mensagemDeErro(error), variant: 'error' }));
    } finally {
      setRecalculando(false);
    }
  };

  const diferenca = (qtd, valor) => qtd !== 0 || Number(valor) !== 0;

  return (
    <ListagemAuditoria
      endpoint="auditoria/reconciliacao"
      filtrosAplicados={filtros}
      onFiltrar={setFiltros}
      vazio="Nenhum dia reconciliado no filtro."
      campos={(f, set) => (
        <>
          <CampoData rotulo="De" valor={f.dataInicio} onChange={(dataInicio) => set({ dataInicio })} />
          <CampoData rotulo="Até" valor={f.dataFim} onChange={(dataFim) => set({ dataFim })} />
          <FormControlLabel
            control={<Switch checked={Boolean(f.somenteDivergentes)} onChange={(e) => set({ somenteDivergentes: e.target.checked })} />}
            label="Só divergentes"
          />
          <Button variant="outlined" startIcon={<RefreshIcon />} disabled={recalculando} onClick={() => recalcular(f)}>
            Recalcular banco
          </Button>
        </>
      )}
      chave="data"
      colunas={[
        { titulo: 'Dia', render: (l) => formatData(l.data) },
        { titulo: 'BigQuery (qtd)', align: 'right', render: (l) => l.bq_qtd },
        { titulo: 'Banco (qtd)', align: 'right', render: (l) => l.bd_qtd },
        { titulo: 'Dif. (qtd)', align: 'right', render: (l) => l.dif_qtd },
        { titulo: 'BigQuery (soma)', align: 'right', render: (l) => formatBRL(l.bq_valor) },
        { titulo: 'Banco (soma)', align: 'right', render: (l) => formatBRL(l.bd_valor) },
        { titulo: 'Dif. (soma)', align: 'right', render: (l) => formatBRL(l.dif_valor) },
        {
          titulo: 'Situação',
          render: (l) =>
            diferenca(l.dif_qtd, l.dif_valor) ? <Chip size="small" color="error" label="Divergente" /> : <Chip size="small" color="success" label="Conferido" />,
        },
        { titulo: 'Calculado em', render: (l) => formatDataHora(l.calculado_em) },
        { titulo: 'Execução', render: (l) => l.execucao_id ?? '—' },
      ]}
    />
  );
}
