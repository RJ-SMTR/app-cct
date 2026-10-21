import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import Chart from 'react-apexcharts';
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  Grid,
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
  COR_TIPO,
  ROTULO_TIPO,
  TIPOS,
  formatBRL,
  formatData,
  formatMetrica,
  formatQtd,
  montarGraficoDias,
  montarGraficoHistoricos,
  montarUrlDetalhe,
  periodoDaUrl,
  toIsoDate,
} from './extratoUtils';

function authHeaders() {
  const token = window.localStorage.getItem('jwt_access_token');
  return { Authorization: `Bearer ${token}` };
}

/** Quadro de um total clicável (entradas / saídas / resultado) de uma conta. */
function Indicador({ titulo, valor, detalhe, cor, onClick }) {
  return (
    <Box
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => onClick && (e.key === 'Enter' || e.key === ' ') && onClick()}
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        borderLeft: `6px solid ${cor}`,
        borderRadius: 1,
        p: 1.5,
        bgcolor: 'action.hover',
        height: '100%',
        '&:hover': onClick ? { bgcolor: 'action.selected' } : undefined,
      }}
    >
      <Typography variant="caption" color="text.secondary">
        {titulo}
      </Typography>
      <Typography variant="h6" sx={{ lineHeight: 1.2 }}>
        {valor}
      </Typography>
      {detalhe && (
        <Typography variant="body2" color="text.secondary">
          {detalhe}
        </Typography>
      )}
    </Box>
  );
}

function QuadroConta({ conta, metrica, periodo, onAbrirDetalhe }) {
  const dias = useMemo(() => montarGraficoDias(conta), [conta]);
  const roscaEntradas = useMemo(() => montarGraficoHistoricos(conta, 'C', metrica), [conta, metrica]);
  const roscaSaidas = useMemo(() => montarGraficoHistoricos(conta, 'D', metrica), [conta, metrica]);
  const vazio = conta.entradas.qtd === 0 && conta.saidas.qtd === 0;

  const opcoesDias = {
    chart: {
      type: 'bar',
      toolbar: { show: false },
      events: {
        // Clicar numa barra abre os lançamentos daquele dia (entradas ou saídas, conforme a série).
        dataPointSelection: (_event, _ctx, { seriesIndex, dataPointIndex }) => {
          if (seriesIndex < 0 || dataPointIndex < 0) return;
          onAbrirDetalhe({ conta: conta.conta, tipo: TIPOS[seriesIndex].key, dia: dias.categorias[dataPointIndex] });
        },
      },
    },
    colors: TIPOS.map((t) => t.color),
    plotOptions: { bar: { columnWidth: '70%' } },
    xaxis: { categories: dias.categorias.map((d) => formatData(d).slice(0, 5)), labels: { rotate: -45, trim: true } },
    yaxis: { labels: { formatter: (v) => formatBRL(v) } },
    dataLabels: { enabled: false },
    tooltip: { y: { formatter: (v) => formatBRL(v) } },
    legend: { position: 'top' },
    states: { active: { filter: { type: 'none' } } },
  };

  const opcoesRosca = (rosca, tipo) => ({
    chart: {
      type: 'donut',
      events: {
        // Clicar numa fatia abre os lançamentos daquele histórico bancário.
        dataPointSelection: (_event, _ctx, { dataPointIndex }) => {
          const h = rosca.historicos[dataPointIndex];
          if (h) onAbrirDetalhe({ conta: conta.conta, tipo, descricao: h.descricao });
        },
      },
    },
    labels: rosca.rotulos,
    legend: { position: 'bottom' },
    dataLabels: { enabled: false },
    tooltip: { y: { formatter: (v) => formatMetrica(v, metrica) } },
  });

  return (
    <Card sx={{ p: 3, mb: 3 }}>
      <Box className="flex flex-wrap items-center justify-between" sx={{ mb: 2 }}>
        <Typography variant="h6" className="font-semibold">
          {conta.nome}
        </Typography>
        <Button size="small" onClick={() => onAbrirDetalhe({ conta: conta.conta })}>
          Ver extrato completo
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={4}>
          <Indicador
            titulo="Entradas"
            valor={formatBRL(conta.entradas.valor)}
            detalhe={`${formatQtd(conta.entradas.qtd)} lançamento(s)`}
            cor={COR_TIPO.C}
            onClick={() => onAbrirDetalhe({ conta: conta.conta, tipo: 'C' })}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Indicador
            titulo="Saídas"
            valor={formatBRL(conta.saidas.valor)}
            detalhe={`${formatQtd(conta.saidas.qtd)} lançamento(s)`}
            cor={COR_TIPO.D}
            onClick={() => onAbrirDetalhe({ conta: conta.conta, tipo: 'D' })}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Indicador
            titulo="Resultado do período (entradas − saídas)"
            valor={formatBRL(conta.resultado)}
            detalhe={conta.resultado >= 0 ? 'Entrou mais do que saiu' : 'Saiu mais do que entrou'}
            cor={conta.resultado >= 0 ? '#1565c0' : '#ed6c02'}
          />
        </Grid>
      </Grid>

      {vazio ? (
        <Alert severity="info">
          Nenhum lançamento entre {formatData(periodo.dataInicio)} e {formatData(periodo.dataFim)} nesta conta.
        </Alert>
      ) : (
        <>
          <Typography variant="subtitle2" color="text.secondary">
            Movimento por dia (clique numa barra para ver os lançamentos do dia)
          </Typography>
          <Chart options={opcoesDias} series={dias.series} type="bar" height={320} />

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary">
                Entradas por histórico (clique numa fatia)
              </Typography>
              {roscaEntradas.valores.length ? (
                <Chart options={opcoesRosca(roscaEntradas, 'C')} series={roscaEntradas.valores} type="donut" height={320} />
              ) : (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Sem entradas no período.
                </Alert>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary">
                Saídas por histórico (clique numa fatia)
              </Typography>
              {roscaSaidas.valores.length ? (
                <Chart options={opcoesRosca(roscaSaidas, 'D')} series={roscaSaidas.valores} type="donut" height={320} />
              ) : (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Sem saídas no período.
                </Alert>
              )}
            </Grid>
          </Grid>

          <Box sx={{ mt: 2, overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Histórico</TableCell>
                  <TableCell align="right">Lançamentos</TableCell>
                  <TableCell align="right">Valor</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {conta.porHistorico.map((h) => (
                  <TableRow
                    hover
                    key={`${h.tipo}-${h.descricao}`}
                    sx={{ cursor: 'pointer' }}
                    onClick={() => onAbrirDetalhe({ conta: conta.conta, tipo: h.tipo, descricao: h.descricao })}
                  >
                    <TableCell sx={{ color: COR_TIPO[h.tipo], fontWeight: 500 }}>{ROTULO_TIPO[h.tipo]}</TableCell>
                    <TableCell>{h.descricao}</TableCell>
                    <TableCell align="right">{formatQtd(h.qtd)}</TableCell>
                    <TableCell align="right">{formatBRL(h.valor)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </>
      )}
    </Card>
  );
}

export default function StatementsApp() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [periodo, setPeriodo] = useState(() => periodoDaUrl(searchParams));
  const [erroPeriodo, setErroPeriodo] = useState(null);
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
        .get('extrato/dashboard/resumo', { headers: authHeaders(), params })
        .then((response) => setDados(response.data))
        .catch((error) => {
          setDados(null);
          dispatch(showMessage({ message: error?.response?.data?.error || 'Não foi possível carregar o extrato das contas.', variant: 'error' }));
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
    const intervalo = dados ? { dataInicio: dados.dataInicio, dataFim: dados.dataFim } : { dataInicio: toIsoDate(periodo[0]), dataFim: toIsoDate(periodo[1]) };
    navigate(montarUrlDetalhe({ ...filtro, ...intervalo }));
  };

  // "Outras contas" só aparece se houver lançamento (contas fora do cadastro conhecido).
  const contas = (dados?.contas ?? []).filter((c) => c.conta !== 'outras' || c.entradas.qtd + c.saidas.qtd > 0);

  return (
    <Box className="p-24 pt-10">
      <Card sx={{ p: 3, mt: 4, mb: 3 }}>
        <Typography variant="h5" className="font-semibold" sx={{ mb: 0.5 }}>
          Extrato das Contas
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Entradas e saídas de cada conta pelo extrato bancário (CNAB), por data de lançamento. Clique nos gráficos para abrir o detalhamento.
        </Typography>

        <Box className="flex flex-wrap items-start gap-16">
          <PeriodDatePicker required value={periodo} onChange={setPeriodo} error={Boolean(erroPeriodo)} helperText={erroPeriodo} />
          <ToggleButtonGroup exclusive size="small" value={metrica} onChange={(_e, v) => v && setMetrica(v)} aria-label="Métrica das rosquinhas">
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

      {!carregando && contas.map((conta) => <QuadroConta key={conta.conta} conta={conta} metrica={metrica} periodo={dados} onAbrirDetalhe={abrirDetalhe} />)}
    </Box>
  );
}
