import { useMemo, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { formatBRL, formatQtd } from './dashboardPagamentosUtils';

export const CORES_ROSCA = ['#008FFB', '#00E396', '#FEB019', '#FF4560', '#775DD0', '#3F51B5', '#546E7A', '#D4526E', '#8D5B4C', '#F86624'];

/** Fração (0..1) de cada valor no total. Total zero devolve tudo zerado. */
export function calcularFracoes(valores) {
  const nums = valores.map((v) => Math.max(Number(v) || 0, 0));
  const total = nums.reduce((a, b) => a + b, 0);
  return nums.map((v) => (total > 0 ? v / total : 0));
}

const TAMANHO = 300;
const CENTRO = TAMANHO / 2;
const ESPESSURA = 38;
const FOLGA = 6;
const RAIO_EXTERNO = CENTRO - ESPESSURA / 2 - 4;
const RAIO_INTERNO = RAIO_EXTERNO - ESPESSURA - FOLGA;

function Anel({ raio, fracoes, cores, ativo, onAtivar, onSelecionar, rotuloAnel, rotulos }) {
  const perimetro = 2 * Math.PI * raio;
  let acumulado = 0;
  return (
    <g transform={`rotate(-90 ${CENTRO} ${CENTRO})`}>
      <circle cx={CENTRO} cy={CENTRO} r={raio} fill="none" stroke="rgba(128,128,128,0.15)" strokeWidth={ESPESSURA} />
      {fracoes.map((fracao, i) => {
        if (fracao <= 0) return null;
        const comprimento = fracao * perimetro;
        const inicio = acumulado;
        acumulado += comprimento;
        const esmaecer = ativo !== null && ativo !== i;
        return (
          <circle
            key={i}
            cx={CENTRO}
            cy={CENTRO}
            r={raio}
            fill="none"
            stroke={cores[i % cores.length]}
            strokeWidth={ativo === i ? ESPESSURA + 6 : ESPESSURA}
            strokeDasharray={`${comprimento} ${perimetro - comprimento}`}
            strokeDashoffset={-inicio}
            opacity={esmaecer ? 0.35 : 1}
            style={{ cursor: 'pointer', transition: 'opacity .15s, stroke-width .15s' }}
            tabIndex={0}
            role="button"
            aria-label={`${rotuloAnel}: ${rotulos[i]}`}
            onMouseEnter={() => onAtivar(i)}
            onMouseLeave={() => onAtivar(null)}
            onFocus={() => onAtivar(i)}
            onBlur={() => onAtivar(null)}
            onClick={() => onSelecionar(i)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelecionar(i);
              }
            }}
          />
        );
      })}
    </g>
  );
}

const pct = (f) => `${(f * 100).toFixed(1).replace('.', ',')}%`;

/**
 * Rosca com duas escalas: anel externo por valor (R$) e anel interno por quantidade.
 * `motivos`: [{ descricao, valor, qtd }]. `onSelecionar(motivo)` é chamado ao clicar numa fatia ou numa linha da legenda.
 */
export default function RoscaDoisAneis({ motivos, onSelecionar }) {
  const [ativo, setAtivo] = useState(null);
  const { fracoesValor, fracoesQtd, totalValor, totalQtd } = useMemo(
    () => ({
      fracoesValor: calcularFracoes(motivos.map((m) => m.valor)),
      fracoesQtd: calcularFracoes(motivos.map((m) => m.qtd)),
      totalValor: motivos.reduce((s, m) => s + (Number(m.valor) || 0), 0),
      totalQtd: motivos.reduce((s, m) => s + (Number(m.qtd) || 0), 0),
    }),
    [motivos],
  );
  const rotulos = motivos.map((m) => m.descricao);
  const selecionar = (i) => onSelecionar?.(motivos[i]);
  const m = ativo !== null ? motivos[ativo] : null;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <svg viewBox={`0 0 ${TAMANHO} ${TAMANHO}`} width="100%" style={{ maxWidth: 340 }} role="group" aria-label="Motivos dos não pagos: anel externo por valor, anel interno por quantidade">
          <Anel raio={RAIO_EXTERNO} fracoes={fracoesValor} cores={CORES_ROSCA} ativo={ativo} onAtivar={setAtivo} onSelecionar={selecionar} rotuloAnel="Valor" rotulos={rotulos} />
          <Anel raio={RAIO_INTERNO} fracoes={fracoesQtd} cores={CORES_ROSCA} ativo={ativo} onAtivar={setAtivo} onSelecionar={selecionar} rotuloAnel="Quantidade" rotulos={rotulos} />
          <g textAnchor="middle" fill="currentColor" style={{ pointerEvents: 'none' }}>
            {m ? (
              <>
                <text x={CENTRO} y={CENTRO - 14} fontSize="11" opacity="0.7">{m.descricao.length > 22 ? `${m.descricao.slice(0, 21)}…` : m.descricao}</text>
                <text x={CENTRO} y={CENTRO + 4} fontSize="14" fontWeight="600">{formatBRL(m.valor)}</text>
                <text x={CENTRO} y={CENTRO + 22} fontSize="12">{formatQtd(m.qtd)} pagamento(s)</text>
              </>
            ) : (
              <>
                <text x={CENTRO} y={CENTRO - 14} fontSize="11" opacity="0.7">Total</text>
                <text x={CENTRO} y={CENTRO + 4} fontSize="14" fontWeight="600">{formatBRL(totalValor)}</text>
                <text x={CENTRO} y={CENTRO + 22} fontSize="12">{formatQtd(totalQtd)} pagamento(s)</text>
              </>
            )}
          </g>
        </svg>
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mb: 1 }}>
        Anel externo: valor (R$) · Anel interno: quantidade
      </Typography>
      <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
        {motivos.map((mt, i) => (
          <Box
            component="li"
            key={i}
            onMouseEnter={() => setAtivo(i)}
            onMouseLeave={() => setAtivo(null)}
            onClick={() => selecionar(i)}
            sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5, px: 1, cursor: 'pointer', borderRadius: 1, bgcolor: ativo === i ? 'action.hover' : 'transparent' }}
          >
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', flexShrink: 0, bgcolor: CORES_ROSCA[i % CORES_ROSCA.length] }} />
            <Typography variant="body2" sx={{ flex: 1, minWidth: 0 }} noWrap title={mt.descricao}>{mt.descricao}</Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
              {formatBRL(mt.valor)} ({pct(fracoesValor[i])})
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
              · {formatQtd(mt.qtd)} ({pct(fracoesQtd[i])})
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
