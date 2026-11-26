import { useMemo, useState } from 'react';
import { Box, Tab, Tabs, Typography } from '@mui/material';
import BarrasHorizontais from './BarrasHorizontais';
import {
  ABAS_ROTATIVO,
  COR_SITUACAO,
  escalaEixo,
  formatCompacto,
  formatMetrica,
  montarGraficoPorDia,
  montarGraficoSituacoes,
} from './dashboardPagamentosUtils';

const pct = (fracao) => `${(fracao * 100).toFixed(1).replace('.', ',')}%`;

/** Acima disso a lista "Por dia" rola dentro do quadro. */
const ALTURA_MAXIMA_POR_DIA = 640;

/**
 * Gráficos da Conta Rotativo (um grupo só, Guardador), em duas abas, ambos em barras horizontais numa escala só
 * com o valor escrito logo depois da ponta de cada barra:
 * - "Proporção": uma linha por situação (Pago, Não pago e, embaixo, Aguardando pagamento), com valor e % do total.
 * - "Por dia": uma linha por dia de vencimento com pagamento, com uma barra por situação que teve valor no dia.
 * Clicar numa barra abre o detalhe daquela situação (no "Por dia", só daquele dia).
 */
export default function GraficosRotativo({ conta, metrica, periodo, onAbrirDetalhe, abaInicial = 'proporcao' }) {
  const [aba, setAba] = useState(abaInicial);
  const nomeMetrica = metrica === 'valor' ? 'Valor (R$)' : 'Quantidade de pagamentos';
  const inteiro = metrica !== 'valor';

  const situacoes = useMemo(() => {
    const g = montarGraficoSituacoes(conta, metrica);
    return {
      escala: escalaEixo(g.maior, { passoInteiro: inteiro }),
      linhas: g.linhas.map((l) => ({
        id: l.key,
        rotulo: l.rotulo,
        barras: [
          {
            key: l.key,
            cor: COR_SITUACAO[l.key],
            desenhado: l.desenhado,
            texto: `${formatMetrica(l.valor, metrica)} • ${pct(l.fracao)}`,
            dica: `${l.rotulo}: ${formatMetrica(l.valor, metrica)} (${pct(l.fracao)}) – clique para ver o detalhe`,
            onClick: () => onAbrirDetalhe({ conta: conta.conta, situacao: l.key }),
          },
        ],
      })),
    };
  }, [conta, metrica, inteiro, onAbrirDetalhe]);

  const porDia = useMemo(() => {
    const g = montarGraficoPorDia(conta, metrica, periodo, { somenteDiasComPagamento: true });
    return {
      escala: escalaEixo(g.maior, { folga: 1.3, passoInteiro: inteiro }),
      linhas: g.dias.map((dia, i) => ({
        id: dia,
        rotulo: g.categorias[i],
        barras: g.series
          .filter((s) => s.data[i] > 0)
          .map((s) => ({
            key: s.key,
            cor: COR_SITUACAO[s.key],
            desenhado: s.desenhado[i],
            texto: formatMetrica(s.data[i], metrica),
            dica: `${g.categorias[i]} – ${s.name}: ${formatMetrica(s.data[i], metrica)} – clique para ver o detalhe do dia`,
            onClick: () => onAbrirDetalhe({ conta: conta.conta, situacao: s.key, dataInicio: dia, dataFim: dia }),
          })),
      })),
      situacoes: g.series.map((s) => ({ key: s.key, name: s.name })),
    };
  }, [conta, metrica, periodo, inteiro, onAbrirDetalhe]);

  return (
    <>
      <Tabs value={aba} onChange={(_e, v) => setAba(v)} sx={{ mb: 1 }} aria-label="Gráficos da Conta Rotativo">
        {ABAS_ROTATIVO.map((a) => (
          <Tab key={a.id} value={a.id} label={a.rotulo} />
        ))}
      </Tabs>
      {aba === 'proporcao' ? (
        <>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            {nomeMetrica} por situação – {conta.nome} (clique numa barra para ver o detalhe)
          </Typography>
          <BarrasHorizontais
            ariaLabel={`${nomeMetrica} por situação`}
            linhas={situacoes.linhas}
            escala={situacoes.escala}
            formatarEixo={formatCompacto}
            tituloEixo={nomeMetrica}
          />
        </>
      ) : (
        <>
          <Typography variant="subtitle2" color="text.secondary">
            {nomeMetrica} por dia de vencimento (clique numa barra para ver o detalhe do dia)
          </Typography>
          {porDia.linhas.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
              Nenhum pagamento por dia para exibir no período.
            </Typography>
          ) : (
            <>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center', my: 1 }}>
                {porDia.situacoes.map((s) => (
                  <Box key={s.key} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '2px', bgcolor: COR_SITUACAO[s.key] }} />
                    <Typography variant="caption">{s.name}</Typography>
                  </Box>
                ))}
              </Box>
              <Box sx={{ maxHeight: ALTURA_MAXIMA_POR_DIA, overflowY: 'auto' }}>
                <BarrasHorizontais
                  ariaLabel={`${nomeMetrica} por dia de vencimento`}
                  linhas={porDia.linhas}
                  escala={porDia.escala}
                  formatarEixo={formatCompacto}
                  tituloEixo={nomeMetrica}
                  larguraRotulo={60}
                  alturaBarra={16}
                  tamanhoTexto={12}
                  espacoLinha={0.75}
                />
              </Box>
            </>
          )}
        </>
      )}
    </>
  );
}
