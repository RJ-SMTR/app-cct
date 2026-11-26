import { useMemo, useState } from 'react';
import Chart from 'react-apexcharts';
import { Tab, Tabs, Typography } from '@mui/material';
import { ABAS_ROTATIVO, COR_SITUACAO, formatMetrica, montarGraficoPorDia, montarGraficoProporcao } from './dashboardPagamentosUtils';

const pct = (fracao) => `${(fracao * 100).toFixed(1).replace('.', ',')}%`;

/** Abaixo disso o rótulo não cabe dentro do segmento; o valor continua no tooltip. */
const FRACAO_MINIMA_ROTULO = 0.05;

/** Acima disso o eixo X mostra só parte das datas, para os rótulos não se sobreporem. */
const MAX_ROTULOS_DIAS = 31;

/**
 * Gráficos da Conta Rotativo (um grupo só, Guardador), em duas abas:
 * - "Proporção": barra horizontal 100% empilhada com Pago, Não pago e Aguardando pagamento, numa escala só.
 * - "Por dia": colunas empilhadas por dia de vencimento.
 * Clicar num segmento abre o detalhe daquela situação (no "Por dia", só daquele dia).
 */
export default function GraficosRotativo({ conta, metrica, periodo, onAbrirDetalhe }) {
  const [aba, setAba] = useState('proporcao');
  const proporcao = useMemo(() => montarGraficoProporcao(conta, metrica), [conta, metrica]);
  const porDia = useMemo(() => montarGraficoPorDia(conta, metrica, periodo), [conta, metrica, periodo]);
  const nomeMetrica = metrica === 'valor' ? 'Valor (R$)' : 'Quantidade de pagamentos';

  const opcoesProporcao = {
    chart: {
      type: 'bar',
      stacked: true,
      stackType: '100%',
      toolbar: { show: false },
      events: {
        dataPointSelection: (_event, _ctx, { seriesIndex }) => {
          if (seriesIndex < 0) return;
          onAbrirDetalhe({ conta: conta.conta, situacao: proporcao.series[seriesIndex].key });
        },
      },
    },
    colors: proporcao.series.map((s) => COR_SITUACAO[s.key]),
    plotOptions: { bar: { horizontal: true, barHeight: '55%' } },
    xaxis: { categories: [conta.nome], labels: { formatter: (v) => `${v}%` } },
    yaxis: { labels: { show: false } },
    dataLabels: {
      enabled: true,
      formatter: (_v, { seriesIndex }) => {
        const fracao = proporcao.series[seriesIndex]?.fracao ?? 0;
        return fracao >= FRACAO_MINIMA_ROTULO ? pct(fracao) : '';
      },
    },
    tooltip: {
      y: { formatter: (v, { seriesIndex }) => `${formatMetrica(v, metrica)} (${pct(proporcao.series[seriesIndex]?.fracao ?? 0)})` },
    },
    legend: { position: 'top' },
    grid: { padding: { left: 8, right: 8 } },
    states: { active: { filter: { type: 'none' } } },
  };

  const opcoesPorDia = {
    chart: {
      type: 'bar',
      stacked: true,
      toolbar: { show: false },
      events: {
        dataPointSelection: (_event, _ctx, { seriesIndex, dataPointIndex }) => {
          if (seriesIndex < 0 || dataPointIndex < 0) return;
          const dia = porDia.dias[dataPointIndex];
          onAbrirDetalhe({ conta: conta.conta, situacao: porDia.series[seriesIndex].key, dataInicio: dia, dataFim: dia });
        },
      },
    },
    colors: porDia.series.map((s) => COR_SITUACAO[s.key]),
    plotOptions: { bar: { columnWidth: porDia.dias.length <= 7 ? '35%' : '70%' } },
    xaxis: {
      categories: porDia.categorias,
      tickAmount: porDia.dias.length > MAX_ROTULOS_DIAS ? MAX_ROTULOS_DIAS : undefined,
      labels: { rotate: -45, hideOverlappingLabels: true },
    },
    yaxis: { min: 0, forceNiceScale: true, title: { text: nomeMetrica }, labels: { formatter: (v) => formatMetrica(v, metrica) } },
    dataLabels: { enabled: false },
    // Tooltip só do segmento sob o mouse: o clique abre o detalhe daquela situação naquele dia.
    tooltip: { shared: false, y: { formatter: (v) => formatMetrica(v, metrica) } },
    legend: { position: 'top', showForSingleSeries: true },
    states: { active: { filter: { type: 'none' } } },
  };

  return (
    <>
      <Tabs value={aba} onChange={(_e, v) => setAba(v)} sx={{ mb: 1 }} aria-label="Gráficos da Conta Rotativo">
        {ABAS_ROTATIVO.map((a) => (
          <Tab key={a.id} value={a.id} label={a.rotulo} />
        ))}
      </Tabs>
      {aba === 'proporcao' ? (
        <>
          <Typography variant="subtitle2" color="text.secondary">
            Proporção por situação – {nomeMetrica} (clique num segmento para ver o detalhe)
          </Typography>
          <Chart key="proporcao" options={opcoesProporcao} series={proporcao.series} type="bar" height={170} />
        </>
      ) : (
        <>
          <Typography variant="subtitle2" color="text.secondary">
            Por dia de vencimento (clique numa coluna para ver o detalhe do dia)
          </Typography>
          <Chart key="porDia" options={opcoesPorDia} series={porDia.series} type="bar" height={380} />
        </>
      )}
    </>
  );
}
