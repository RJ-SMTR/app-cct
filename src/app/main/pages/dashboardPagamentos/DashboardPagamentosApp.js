import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import Chart from 'react-apexcharts';
import RoscaDoisAneis from './RoscaDoisAneis';
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  FormControlLabel,
  Grid,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { api } from 'app/configs/api/api';
import { showMessage } from 'app/store/fuse/messageSlice';
import PeriodDatePicker, { periodRequiredRules } from 'app/shared-components/PeriodDatePicker';
import {
  COR_SITUACAO,
  ROTULO_SITUACAO,
  SITUACOES,
  formatBRL,
  formatMetrica,
  formatQtd,
  montarGraficoGruposDuplo,
  montarUrlDetalhe,
  periodoDaUrl,
  toIsoDate,
} from './dashboardPagamentosUtils';

function authHeaders() {
  const token = window.localStorage.getItem('jwt_access_token');
  return { Authorization: `Bearer ${token}` };
}

/** Quadro de um total clicável (Pago / Não pago / Em aberto) de uma conta. */
function Indicador({ situacao, totais, onClick }) {
  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
      sx={{
        cursor: 'pointer',
        borderLeft: `6px solid ${COR_SITUACAO[situacao]}`,
        borderRadius: 1,
        p: 1.5,
        bgcolor: 'action.hover',
        '&:hover': { bgcolor: 'action.selected' },
      }}
    >
      <Typography variant="caption" color="text.secondary">
        {ROTULO_SITUACAO[situacao]}
      </Typography>
      <Typography variant="h6" sx={{ lineHeight: 1.2 }}>
        {formatBRL(totais.valor)}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {formatQtd(totais.qtd)} pagamento(s)
      </Typography>
    </Box>
  );
}

function QuadroConta({ conta, metrica, periodo, onAbrirDetalhe }) {
  // Barras duplas: duas barras por consórcio/modal (Pago | Não pago + Em aberto), na escala escolhida no seletor.
  const grafico = useMemo(() => montarGraficoGruposDuplo(conta, metrica), [conta, metrica]);
  const situacoesRosca = useMemo(() => SITUACOES.map((s) => ({ ...s, valor: conta[s.key].valor, qtd: conta[s.key].qtd })), [conta]);
  const vazio = SITUACOES.every((s) => conta[s.key].qtd === 0);
  // Escala logarítmica no eixo Y: valores pequenos (um pagamento não pago) continuam visíveis ao lado de milhões.
  const [escalaLog, setEscalaLog] = useState(true);
  const seriesBarras = useMemo(
    () => (escalaLog ? grafico.series.map((s) => ({ ...s, data: s.data.map((v) => (v > 0 ? v : null)) })) : grafico.series),
    [grafico, escalaLog],
  );

  const opcoesBarras = {
    chart: {
      type: 'bar',
      stacked: true,
      toolbar: { show: false },
      events: {
        // Clicar numa barra abre o detalhe daquele consórcio/modal naquela situação.
        dataPointSelection: (_event, _ctx, { seriesIndex, dataPointIndex }) => {
          if (seriesIndex < 0 || dataPointIndex < 0) return;
          onAbrirDetalhe({ conta: conta.conta, grupo: grafico.categorias[dataPointIndex], situacao: grafico.series[seriesIndex].key });
        },
      },
    },
    colors: grafico.series.map((s) => COR_SITUACAO[s.key]),
    plotOptions: { bar: { columnWidth: '70%' } },
    xaxis: { categories: grafico.categorias, labels: { rotate: -45, trim: true } },
    yaxis: {
      title: { text: `${metrica === 'valor' ? 'Valor (R$)' : 'Quantidade de pagamentos'}${escalaLog ? ' – escala logarítmica' : ''}` },
      labels: { formatter: (v) => formatMetrica(v, metrica) },
      ...(escalaLog ? { logarithmic: true, logBase: 10, min: 1 } : {}),
    },
    dataLabels: { enabled: false },
    // Tooltip só da barra sob o mouse (cada barra tem séries diferentes).
    tooltip: { shared: false, y: { formatter: (v) => formatMetrica(v, metrica) } },
    legend: { position: 'top' },
    states: { active: { filter: { type: 'none' } } },
  };

  const abrirSituacao = (situacao) => onAbrirDetalhe({ conta: conta.conta, situacao });
  // Clicar numa fatia do anel interno (ou na legenda) abre o detalhe dos pagamentos com aquele motivo.
  const abrirMotivo = (motivo) => {
    if (motivo) onAbrirDetalhe({ conta: conta.conta, situacao: motivo.situacao, motivo: motivo.codigo });
  };

  return (
    <Card sx={{ p: 3, mb: 3 }}>
      <Box className="flex flex-wrap items-center justify-between" sx={{ mb: 2 }}>
        <Typography variant="h6" className="font-semibold">
          {conta.nome}
        </Typography>
        <Button size="small" onClick={() => onAbrirDetalhe({ conta: conta.conta })}>
          Ver todos os pagamentos
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        {SITUACOES.map((s) => (
          <Grid item xs={12} sm={4} key={s.key}>
            <Indicador situacao={s.key} totais={conta[s.key]} onClick={() => onAbrirDetalhe({ conta: conta.conta, situacao: s.key })} />
          </Grid>
        ))}
      </Grid>

      {vazio ? (
        <Alert severity="info">Nenhum pagamento com vencimento entre {periodo.dataInicio} e {periodo.dataFim} nesta conta.</Alert>
      ) : (
        <Grid container spacing={2}>
          <Grid item xs={12} lg={8}>
            <Box className="flex flex-wrap items-center justify-between">
              <Typography variant="subtitle2" color="text.secondary">
                {conta.grupos.length > 1 ? 'Por consórcio / modal' : 'Por situação'} (clique numa barra para ver o detalhe)
              </Typography>
              <FormControlLabel
                control={<Switch size="small" checked={escalaLog} onChange={(e) => setEscalaLog(e.target.checked)} />}
                label={<Typography variant="caption">Escala logarítmica</Typography>}
              />
            </Box>
            <Chart options={opcoesBarras} series={seriesBarras} type="bar" height={380} />
          </Grid>
          <Grid item xs={12} lg={4}>
            <Typography variant="subtitle2" color="text.secondary">
              Situação e motivos
            </Typography>
            <RoscaDoisAneis situacoes={situacoesRosca} motivos={conta.motivos} metrica={metrica} onSelecionarSituacao={abrirSituacao} onSelecionarMotivo={abrirMotivo} />
          </Grid>
        </Grid>
      )}

      {conta.motivos.length > 0 && (
        <Box sx={{ mt: 2, overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Situação</TableCell>
                <TableCell>Motivo</TableCell>
                <TableCell align="right">Pagamentos</TableCell>
                <TableCell align="right">Valor</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {conta.motivos.map((m) => (
                <TableRow
                  hover
                  key={`${m.situacao}-${m.codigo}`}
                  sx={{ cursor: 'pointer' }}
                  onClick={() => onAbrirDetalhe({ conta: conta.conta, situacao: m.situacao, motivo: m.codigo })}
                >
                  <TableCell sx={{ color: COR_SITUACAO[m.situacao], fontWeight: 500 }}>{ROTULO_SITUACAO[m.situacao]}</TableCell>
                  <TableCell>{m.descricao}</TableCell>
                  <TableCell align="right">{formatQtd(m.qtd)}</TableCell>
                  <TableCell align="right">{formatBRL(m.valor)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}
    </Card>
  );
}

export default function DashboardPagamentosApp() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [periodo, setPeriodo] = useState(() => periodoDaUrl(searchParams));
  const [erroPeriodo, setErroPeriodo] = useState(null);
  // Por valor por padrão: os consórcios têm poucos pagamentos de valor alto e somem no gráfico por quantidade.
  const [metrica, setMetrica] = useState('valor');
  const [carregando, setCarregando] = useState(false);
  const [dados, setDados] = useState(null);

  const consultar = useCallback(
    (intervalo) => {
      const validacao = periodRequiredRules.validate(intervalo);
      if (validacao !== true) {
        setErroPeriodo(validacao);
        return;
      }
      setErroPeriodo(null);
      const params = { dataInicio: toIsoDate(intervalo[0]), dataFim: toIsoDate(intervalo[1]) };
      // O período fica na URL: ao voltar do detalhe o dashboard reaparece no mesmo período.
      setSearchParams(params, { replace: true });
      setCarregando(true);
      api
        .get('dashboard/pagamentos/resumo', { headers: authHeaders(), params })
        .then((response) => setDados(response.data))
        .catch((error) => {
          setDados(null);
          dispatch(showMessage({ message: error?.response?.data?.error || 'Não foi possível carregar o dashboard de pagamentos.' }));
        })
        .finally(() => setCarregando(false));
    },
    [dispatch, setSearchParams],
  );

  useEffect(() => {
    consultar(periodo);
    // Só a carga inicial; as próximas consultas vêm do botão Atualizar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const abrirDetalhe = (filtro) => {
    const intervalo = dados?.periodo ?? { dataInicio: toIsoDate(periodo[0]), dataFim: toIsoDate(periodo[1]) };
    navigate(montarUrlDetalhe({ ...filtro, ...intervalo }));
  };

  return (
    <Box className="p-24 pt-10">
      <Card sx={{ p: 3, mt: 4, mb: 3 }}>
        <Typography variant="h5" className="font-semibold" sx={{ mb: 0.5 }}>
          Dashboard de Pagamentos
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Pagamentos com vencimento no período, por conta. Clique nos gráficos para abrir o detalhe.
        </Typography>

        <Box className="flex flex-wrap items-start gap-16">
          <PeriodDatePicker
            required
            value={periodo}
            onChange={setPeriodo}
            error={Boolean(erroPeriodo)}
            helperText={erroPeriodo}
          />
          <ToggleButtonGroup exclusive size="small" value={metrica} onChange={(_e, v) => v && setMetrica(v)} aria-label="Métrica do gráfico">
            <ToggleButton value="qtd">Quantidade</ToggleButton>
            <ToggleButton value="valor">Valor (R$)</ToggleButton>
          </ToggleButtonGroup>
          <Button variant="contained" color="secondary" startIcon={<RefreshIcon />} disabled={carregando} onClick={() => consultar(periodo)}>
            Atualizar
          </Button>
        </Box>
      </Card>

      {carregando && (
        <Box className="flex items-center justify-center" sx={{ py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {!carregando && !dados && <Alert severity="warning">Sem dados para exibir. Ajuste o período e clique em Atualizar.</Alert>}

      {!carregando &&
        dados?.contas?.map((conta) => (
          <QuadroConta key={conta.conta} conta={conta} metrica={metrica} periodo={dados.periodo} onAbrirDetalhe={abrirDetalhe} />
        ))}
    </Box>
  );
}
