import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import Chart from 'react-apexcharts';
import RoscaSimples from './RoscaSimples';
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
  Tab,
  Tabs,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { api } from 'app/configs/api/api';
import { showMessage } from 'app/store/fuse/messageSlice';
import PeriodDatePicker, { periodRequiredRules } from 'app/shared-components/PeriodDatePicker';
import GraficosRotativo from './GraficosRotativo';
import {
  COR_SITUACAO,
  ROTULO_SITUACAO,
  SITUACOES,
  formatBRL,
  formatMetrica,
  formatQtd,
  abasGraficoBarras,
  agruparMotivosEmAberto,
  montarGraficoAguardando,
  montarGraficoGruposDuplo,
  montarRoscasPendencias,
  montarUrlDetalhe,
  periodoDaUrl,
  toIsoDate,
  usaGraficosRotativo,
} from './dashboardPagamentosUtils';

function authHeaders() {
  const token = window.localStorage.getItem('jwt_access_token');
  return { Authorization: `Bearer ${token}` };
}

/** Quadro de um total clicável (Pago / Não pago / Aguardando pagamento) de uma conta. */
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
  // Barras duplas: duas barras por consórcio/modal (Pago | Não pago), em duas escalas (eixo esquerdo e direito).
  // "Aguardando pagamento" fica num gráfico próprio; com os dois no período, cada gráfico vai numa aba.
  const motivosExibidos = useMemo(() => agruparMotivosEmAberto(conta.motivos), [conta]);
  const grafico = useMemo(() => montarGraficoGruposDuplo(conta, metrica), [conta, metrica]);
  const graficoAguardando = useMemo(() => montarGraficoAguardando(conta, metrica), [conta, metrica]);
  const abas = useMemo(() => abasGraficoBarras(grafico, graficoAguardando), [grafico, graficoAguardando]);
  const [abaEscolhida, setAbaEscolhida] = useState('pagos');
  // Se a aba escolhida não existe no período (ex.: só há aguardando), usa a primeira disponível.
  const aba = abas.some((a) => a.id === abaEscolhida) ? abaEscolhida : abas[0]?.id;
  // Roscas de "Situação e motivos": pendência paga x pendência de pagamento e, do não pago, rejeitado x estorno.
  const roscas = useMemo(() => montarRoscasPendencias(conta), [conta]);
  // Conta Rotativo (só o grupo Guardador): abas "Proporção" e "Por dia" no lugar das barras por consórcio/modal.
  const rotativo = usaGraficosRotativo(conta);
  // Com as duas abas, as roscas ficam só na aba de pago/não pago (na de aguardando pagamento não aparecem).
  // Na Conta Rotativo as roscas aparecem nas duas abas.
  const mostrarRoscas = rotativo || !(abas.length > 1 && aba === 'aguardando');
  const vazio = SITUACOES.every((s) => conta[s.key].qtd === 0);
  // Escalas do eixo Y: "dupla" (Pago no eixo esquerdo, Não pago no direito), "log" ou "linear". Com valores pequenos
  // (um pagamento não pago) ao lado de milhões, a linear esconde as barras menores.
  // O seletor de escala foi retirado da tela: o gráfico usa sempre "dupla". As opções "log" e "linear" continuam
  // suportadas abaixo para reativação futura (basta trocar o valor aqui ou voltar a expor o seletor).
  const escala = 'dupla';
  const escalaLog = escala === 'log';

  const nomeMetrica = metrica === 'valor' ? 'Valor (R$)' : 'Quantidade de pagamentos';
  const rotulosY = { formatter: (v) => formatMetrica(v, metrica) };
  const yaxisBarras =
    escala === 'dupla'
      ? [
          // Eixo esquerdo: barra de Pago (valores altos).
          { seriesName: grafico.series[0].name, min: 0, title: { text: `Pago – ${nomeMetrica}`, style: { color: COR_SITUACAO.pago } }, labels: { ...rotulosY, style: { colors: COR_SITUACAO.pago } } },
          // Eixo direito: barra de Não pago, escala própria e menor.
          { seriesName: grafico.series[1].name, opposite: true, min: 0, title: { text: `Não pago – ${nomeMetrica}`, style: { color: COR_SITUACAO.naoPago } }, labels: { ...rotulosY, style: { colors: COR_SITUACAO.naoPago } } },
        ]
      : {
          title: { text: `${nomeMetrica}${escalaLog ? ' – escala logarítmica' : ''}` },
          labels: rotulosY,
          ...(escalaLog ? { logarithmic: true, logBase: 10, min: 1 } : {}),
        };

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
    yaxis: yaxisBarras,
    dataLabels: { enabled: false },
    // Tooltip só da barra sob o mouse (cada barra tem séries diferentes).
    tooltip: { shared: false, y: { formatter: (v) => formatMetrica(v, metrica) } },
    legend: { position: 'top' },
    states: { active: { filter: { type: 'none' } } },
  };

  const opcoesAguardando = {
    chart: {
      type: 'bar',
      toolbar: { show: false },
      events: {
        // Clicar numa barra abre o detalhe daquele consórcio/modal em "Aguardando pagamento".
        dataPointSelection: (_event, _ctx, { dataPointIndex }) => {
          if (dataPointIndex < 0) return;
          onAbrirDetalhe({ conta: conta.conta, grupo: graficoAguardando.categorias[dataPointIndex], situacao: 'emAberto' });
        },
      },
    },
    colors: [COR_SITUACAO.emAberto],
    // Com poucos consórcios/modais a barra não ocupa a largura toda do gráfico.
    plotOptions: { bar: { columnWidth: graficoAguardando.categorias.length <= 2 ? '15%' : '50%' } },
    xaxis: { categories: graficoAguardando.categorias, labels: { rotate: -45, trim: true } },
    yaxis: { min: 0, title: { text: `Aguardando pagamento – ${nomeMetrica}` }, labels: rotulosY },
    dataLabels: { enabled: false },
    tooltip: { y: { formatter: (v) => formatMetrica(v, metrica) } },
    legend: { show: true, showForSingleSeries: true, position: 'top' },
    states: { active: { filter: { type: 'none' } } },
  };

  // Clicar numa fatia (ou na legenda) abre o detalhe com a situação/motivo daquela fatia.
  const abrirFatia = (fatia) => onAbrirDetalhe({ conta: conta.conta, ...fatia.detalhe });

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
          {rotativo ? (
            <Grid item xs={12}>
              <GraficosRotativo conta={conta} metrica={metrica} periodo={periodo} onAbrirDetalhe={onAbrirDetalhe} />
            </Grid>
          ) : (
            <Grid item xs={12}>
              {abas.length > 1 && (
                <Tabs value={aba} onChange={(_e, v) => setAbaEscolhida(v)} sx={{ mb: 1 }} aria-label="Gráficos de barras">
                  {abas.map((a) => (
                    <Tab key={a.id} value={a.id} label={a.rotulo} />
                  ))}
                </Tabs>
              )}
              <Typography variant="subtitle2" color="text.secondary">
                {conta.grupos.length > 1 ? 'Por consórcio / modal' : 'Por situação'} (clique numa barra para ver o detalhe)
              </Typography>
              {aba === 'aguardando' ? (
                <Chart key="aguardando" options={opcoesAguardando} series={graficoAguardando.series} type="bar" height={380} />
              ) : (
                <Chart key="pagos" options={opcoesBarras} series={grafico.series} type="bar" height={380} />
              )}
            </Grid>
          )}
          {/* Roscas lado a lado: pendência paga x pendência de pagamento e, do não pago, rejeitado x estorno. */}
          {mostrarRoscas && (
            <>
              <Grid item xs={12} md={6}>
                <RoscaSimples titulo="Pendência paga x pendência de pagamento" fatias={roscas.pendencias.fatias} total={roscas.pendencias.total} onSelecionar={abrirFatia} />
              </Grid>
              <Grid item xs={12} md={6}>
                <RoscaSimples titulo="Não pagos: rejeitado x estorno" fatias={roscas.erros.fatias} total={roscas.erros.total} mostrarQtd onSelecionar={abrirFatia} />
              </Grid>
            </>
          )}
        </Grid>
      )}

      {motivosExibidos.length > 0 && (
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
              {motivosExibidos.map((m) => (
                <TableRow
                  hover
                  key={`${m.situacao}-${m.codigo ?? 'todos'}`}
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
    // O filtro pode trazer um dia específico (gráfico "Por dia"), que vale sobre o período do dashboard; o período
    // do dashboard vai junto para o "Voltar" do detalhe.
    const voltar = filtro.dataInicio ? { voltarInicio: intervalo.dataInicio, voltarFim: intervalo.dataFim } : {};
    navigate(montarUrlDetalhe({ ...intervalo, ...filtro, ...voltar }));
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
