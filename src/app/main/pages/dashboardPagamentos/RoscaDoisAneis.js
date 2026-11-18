import { useMemo, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { formatMetrica } from './dashboardPagamentosUtils';

const TAMANHO = 300;
const CENTRO = TAMANHO / 2;
const ESPESSURA = 36;
const FOLGA = 8;
const RAIO_EXTERNO = CENTRO - ESPESSURA / 2 - 4;
const RAIO_INTERNO = RAIO_EXTERNO - ESPESSURA - FOLGA;

const numero = (v) => Math.max(Number(v) || 0, 0);
const pct = (f) => `${(f * 100).toFixed(1).replace('.', ',')}%`;

/** Clareia uma cor #rrggbb misturando com branco (fração 0..1). */
function clarear(hex, fracao) {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c) => Math.round(c + (255 - c) * fracao);
  const r = mix((n >> 16) & 255);
  const g = mix((n >> 8) & 255);
  const b = mix(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

/** Fatias de um conjunto de situações: uma por motivo; o que a situação tem a mais que seus motivos vira uma fatia da própria situação. */
function fatiasDeSituacoes(situacoes, motivos, campo) {
  const fatias = [];
  situacoes.forEach((s) => {
    const dela = motivos.filter((m) => m.situacao === s.key && numero(m[campo]) > 0);
    let i = 0;
    dela.forEach((m) => {
      fatias.push({ id: `m:${s.key}:${m.codigo}`, rotulo: m.descricao, cor: clarear(s.color, Math.min(i * 0.22, 0.66)), valor: numero(m[campo]), situacao: s.key, motivo: m });
      i += 1;
    });
    const resto = numero(s[campo]) - dela.reduce((a, m) => a + numero(m[campo]), 0);
    if (resto > 0) {
      fatias.push({ id: `s:${s.key}`, rotulo: dela.length ? `${s.label} (sem motivo)` : s.label, cor: clarear(s.color, Math.min(i * 0.22, 0.66)), valor: resto, situacao: s.key });
    }
  });
  const total = fatias.reduce((a, f) => a + f.valor, 0);
  return { total, fatias: fatias.map((f) => ({ ...f, fracao: total > 0 ? f.valor / total : 0 })) };
}

/**
 * Monta os dois anéis. Anel externo: os pagos, uma fatia por motivo. Anel interno: os não pagos e aguardando pagamento (em aberto), uma fatia
 * por motivo. Cada anel fecha o seu próprio total (100%). Função pura, exportada para teste.
 */
export function montarAneis(situacoes, motivos, metrica) {
  const campo = metrica === 'valor' ? 'valor' : 'qtd';
  const pagos = fatiasDeSituacoes(situacoes.filter((s) => s.key === 'pago'), motivos, campo);
  const pendentes = fatiasDeSituacoes(situacoes.filter((s) => s.key !== 'pago'), motivos, campo);
  return { totalPagos: pagos.total, totalPendentes: pendentes.total, externo: pagos.fatias, interno: pendentes.fatias };
}

function Anel({ raio, fatias, ativo, onAtivar, onSelecionar, nomeAnel }) {
  const perimetro = 2 * Math.PI * raio;
  let acumulado = 0;
  return (
    <g transform={`rotate(-90 ${CENTRO} ${CENTRO})`}>
      <circle cx={CENTRO} cy={CENTRO} r={raio} fill="none" stroke="rgba(128,128,128,0.15)" strokeWidth={ESPESSURA} />
      {fatias.map((f) => {
        const comprimento = f.fracao * perimetro;
        const inicio = acumulado;
        acumulado += comprimento;
        if (f.fracao <= 0) return null;
        const esmaecer = ativo !== null && ativo !== f.id;
        return (
          <circle
            key={f.id}
            cx={CENTRO}
            cy={CENTRO}
            r={raio}
            fill="none"
            stroke={f.cor}
            strokeWidth={ativo === f.id ? ESPESSURA + 6 : ESPESSURA}
            strokeDasharray={`${comprimento} ${perimetro - comprimento}`}
            strokeDashoffset={-inicio}
            opacity={esmaecer ? 0.35 : 1}
            style={{ cursor: 'pointer', transition: 'opacity .15s, stroke-width .15s' }}
            tabIndex={0}
            role="button"
            aria-label={`${nomeAnel}: ${f.rotulo}`}
            onMouseEnter={() => onAtivar(f.id)}
            onMouseLeave={() => onAtivar(null)}
            onFocus={() => onAtivar(f.id)}
            onBlur={() => onAtivar(null)}
            onClick={() => onSelecionar(f)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelecionar(f);
              }
            }}
          />
        );
      })}
    </g>
  );
}

/**
 * Rosca dupla: anel externo com os pagos e anel interno com os não pagos e aguardando pagamento (em aberto), ambos por motivo.
 * `situacoes`: [{ key, label, color, valor, qtd }]; `motivos`: [{ situacao, codigo, descricao, valor, qtd }].
 */
export default function RoscaDoisAneis({ situacoes, motivos, metrica = 'valor', onSelecionarSituacao, onSelecionarMotivo }) {
  const [ativo, setAtivo] = useState(null);
  const { totalPagos, totalPendentes, externo, interno } = useMemo(() => montarAneis(situacoes, motivos, metrica), [situacoes, motivos, metrica]);
  const f = ativo ? [...externo, ...interno].find((x) => x.id === ativo) : null;

  const selecionar = (fatia) => {
    if (fatia.motivo) onSelecionarMotivo?.(fatia.motivo);
    else onSelecionarSituacao?.(fatia.situacao);
  };
  const cortar = (t) => (t.length > 24 ? `${t.slice(0, 23)}…` : t);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <svg viewBox={`0 0 ${TAMANHO} ${TAMANHO}`} width="100%" style={{ maxWidth: 340 }} role="group" aria-label="Pagamentos: anel externo com os pagos, anel interno com os não pagos e aguardando pagamento">
          <Anel raio={RAIO_EXTERNO} fatias={externo} ativo={ativo} onAtivar={setAtivo} onSelecionar={selecionar} nomeAnel="Pagos" />
          <Anel raio={RAIO_INTERNO} fatias={interno} ativo={ativo} onAtivar={setAtivo} onSelecionar={selecionar} nomeAnel="Não pagos e aguardando pagamento" />
          <g textAnchor="middle" fill="currentColor" style={{ pointerEvents: 'none' }}>
            {f ? (
              <>
                <text x={CENTRO} y={CENTRO - 14} fontSize="11" opacity="0.7">{cortar(f.rotulo)}</text>
                <text x={CENTRO} y={CENTRO + 6} fontSize="15" fontWeight="600">{formatMetrica(f.valor, metrica)}</text>
                <text x={CENTRO} y={CENTRO + 24} fontSize="12">{pct(f.fracao)}</text>
              </>
            ) : (
              // Totais zerados não são exibidos.
              [
                { rotulo: 'Pagos', total: totalPagos },
                { rotulo: 'Não pagos / aguardando', total: totalPendentes },
              ]
                .filter((t) => t.total > 0)
                .map((t, i, lista) => {
                  const topo = CENTRO - (lista.length === 2 ? 16 : 6) + i * 32;
                  return (
                    <g key={t.rotulo}>
                      <text x={CENTRO} y={topo} fontSize="10" opacity="0.7">{t.rotulo}</text>
                      <text x={CENTRO} y={topo + 14} fontSize="13" fontWeight="600">{formatMetrica(t.total, metrica)}</text>
                    </g>
                  );
                })
            )}
          </g>
        </svg>
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
        Anel externo: pagos · Anel interno: não pagos e aguardando pagamento (clique para ver o detalhe)
      </Typography>
    </Box>
  );
}
