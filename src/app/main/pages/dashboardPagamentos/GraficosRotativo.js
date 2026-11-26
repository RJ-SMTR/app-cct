import { useMemo } from 'react';
import { Tab, Tabs, Typography } from '@mui/material';
import BarrasHorizontais from './BarrasHorizontais';
import {
  COR_SITUACAO,
  escalaEixo,
  formatCompacto,
  formatMetrica,
  montarGraficoAguardandoRotativo,
  montarGraficoSituacoes,
} from './dashboardPagamentosUtils';

const pct = (fracao) => `${(fracao * 100).toFixed(1).replace('.', ',')}%`;

/**
 * Gráficos da Conta Rotativo (um grupo só, Guardador), em barras horizontais numa escala só com o valor escrito
 * logo depois da ponta de cada barra. Mesma regra de abas das demais contas (`abas`, ver `abasRotativo`):
 * - "Pago / Não pago": uma linha para cada, com valor e % de Pago + Não pago.
 * - "Aguardando pagamento" (só com valor aguardando): uma linha com o valor aguardando.
 * Com uma aba só, a barra de abas não aparece. A aba é controlada por quem usa (`aba`, `onMudarAba`), para o
 * quadro esconder as roscas na de aguardando. Clicar numa barra abre o detalhe daquela situação.
 */
export default function GraficosRotativo({ conta, metrica, onAbrirDetalhe, abas, aba, onMudarAba }) {
  const nomeMetrica = metrica === 'valor' ? 'Valor (R$)' : 'Quantidade de pagamentos';
  const inteiro = metrica !== 'valor';

  const pagos = useMemo(() => {
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

  const aguardando = useMemo(() => {
    const g = montarGraficoAguardandoRotativo(conta, metrica);
    return {
      escala: escalaEixo(g.maior, { folga: 1.3, passoInteiro: inteiro }),
      linhas: g.linhas.map((l) => ({
        id: l.key,
        rotulo: l.rotulo,
        barras: [
          {
            key: l.key,
            cor: COR_SITUACAO[l.key],
            desenhado: l.desenhado,
            texto: formatMetrica(l.valor, metrica),
            dica: `${l.rotulo}: ${formatMetrica(l.valor, metrica)} – clique para ver o detalhe`,
            onClick: () => onAbrirDetalhe({ conta: conta.conta, situacao: l.key }),
          },
        ],
      })),
    };
  }, [conta, metrica, inteiro, onAbrirDetalhe]);

  return (
    <>
      {abas.length > 1 && (
        <Tabs value={aba} onChange={(_e, v) => onMudarAba?.(v)} sx={{ mb: 1 }} aria-label="Gráficos da Conta Rotativo">
          {abas.map((a) => (
            <Tab key={a.id} value={a.id} label={a.rotulo} />
          ))}
        </Tabs>
      )}

      {aba === 'pagos' && (
        <>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            {nomeMetrica} – Pago / Não pago – {conta.nome} (clique numa barra para ver o detalhe)
          </Typography>
          <BarrasHorizontais
            ariaLabel={`${nomeMetrica}: pago e não pago`}
            linhas={pagos.linhas}
            escala={pagos.escala}
            formatarEixo={formatCompacto}
            tituloEixo={nomeMetrica}
          />
        </>
      )}

      {aba === 'aguardando' && (
        <>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            {nomeMetrica} – Aguardando pagamento – {conta.nome} (clique na barra para ver o detalhe)
          </Typography>
          <BarrasHorizontais
            ariaLabel={`${nomeMetrica}: aguardando pagamento`}
            linhas={aguardando.linhas}
            escala={aguardando.escala}
            formatarEixo={formatCompacto}
            tituloEixo={nomeMetrica}
          />
        </>
      )}
    </>
  );
}
