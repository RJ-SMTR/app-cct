import { useMemo, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { formatMetrica } from './dashboardPagamentosUtils';

export const CORES_MOTIVOS = ['#3f8f5b', '#e5a23c', '#775DD0', '#00A3C4', '#D4526E', '#8D5B4C', '#546E7A', '#3F51B5', '#F86624', '#9CCC65'];

const TAMANHO = 300;
const CENTRO = TAMANHO / 2;
const ESPESSURA = 36;
const FOLGA = 8;
const RAIO_EXTERNO = CENTRO - ESPESSURA / 2 - 4;
const RAIO_INTERNO = RAIO_EXTERNO - ESPESSURA - FOLGA;

const numero = (v) => Math.max(Number(v) || 0, 0);
const pct = (f) => `${(f * 100).toFixed(1).replace('.', ',')}%`;

/**
 * Monta os dois anéis. Anel externo: uma fatia por situação. Anel interno: uma fatia por motivo, na ordem das situações,
 * ocupando o mesmo ângulo da situação a que pertence (o que sobra da situação sem motivo fica como espaço vazio).
 * Função pura, exportada para teste.
 */
export function montarAneis(situacoes, motivos, metrica) {
  const campo = metrica === 'valor' ? 'valor' : 'qtd';
  const total = situacoes.reduce((s, x) => s + numero(x[campo]), 0);
  const frac = (v) => (total > 0 ? numero(v) / total : 0);

  const externo = situacoes.map((s) => ({ id: `s:${s.key}`, rotulo: s.label, cor: s.color, valor: numero(s[campo]), fracao: frac(s[campo]), situacao: s.key }));

  const interno = [];
  let indiceCor = 0;
  situacoes.forEach((s) => {
    const dela = motivos.filter((m) => m.situacao === s.key && numero(m[campo]) > 0);
    dela.forEach((m) => {
      interno.push({ id: `m:${s.key}:${m.codigo}`, rotulo: m.descricao, cor: CORES_MOTIVOS[indiceCor % CORES_MOTIVOS.length], valor: numero(m[campo]), fracao: frac(m[campo]), situacao: s.key, motivo: m });
      indiceCor += 1;
    });
    const resto = numero(s[campo]) - dela.reduce((a, m) => a + numero(m[campo]), 0);
    if (resto > 0) interno.push({ id: `v:${s.key}`, vazio: true, fracao: frac(resto), valor: resto, situacao: s.key });
  });

  return { total, externo, interno };
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
        if (f.vazio || f.fracao <= 0) return null;
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
 * Rosca dupla: anel externo por situação (pago / não pago / em aberto) e anel interno por motivo, total no centro.
 * `situacoes`: [{ key, label, color, valor, qtd }]; `motivos`: [{ situacao, codigo, descricao, valor, qtd }].
 */
export default function RoscaDoisAneis({ situacoes, motivos, metrica = 'valor', onSelecionarSituacao, onSelecionarMotivo }) {
  const [ativo, setAtivo] = useState(null);
  const { total, externo, interno } = useMemo(() => montarAneis(situacoes, motivos, metrica), [situacoes, motivos, metrica]);
  const todas = [...externo, ...interno];
  const f = ativo ? todas.find((x) => x.id === ativo) : null;

  const selecionar = (fatia) => {
    if (fatia.motivo) onSelecionarMotivo?.(fatia.motivo);
    else onSelecionarSituacao?.(fatia.situacao);
  };
  const rotuloMetrica = metrica === 'valor' ? 'Valor' : 'Pagamentos';

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <svg viewBox={`0 0 ${TAMANHO} ${TAMANHO}`} width="100%" style={{ maxWidth: 340 }} role="group" aria-label="Pagamentos: anel externo por situação, anel interno por motivo">
          <Anel raio={RAIO_EXTERNO} fatias={externo} ativo={ativo} onAtivar={setAtivo} onSelecionar={selecionar} nomeAnel="Situação" />
          <Anel raio={RAIO_INTERNO} fatias={interno} ativo={ativo} onAtivar={setAtivo} onSelecionar={selecionar} nomeAnel="Motivo" />
          <g textAnchor="middle" fill="currentColor" style={{ pointerEvents: 'none' }}>
            <text x={CENTRO} y={CENTRO - 14} fontSize="11" opacity="0.7">
              {f && !f.vazio ? (f.rotulo.length > 22 ? `${f.rotulo.slice(0, 21)}…` : f.rotulo) : `Total (${rotuloMetrica.toLowerCase()})`}
            </text>
            <text x={CENTRO} y={CENTRO + 6} fontSize="15" fontWeight="600">
              {formatMetrica(f && !f.vazio ? f.valor : total, metrica)}
            </text>
            {f && !f.vazio && (
              <text x={CENTRO} y={CENTRO + 24} fontSize="12">{pct(total > 0 ? f.valor / total : 0)}</text>
            )}
          </g>
        </svg>
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
        Anel externo: situação · Anel interno: motivo (clique para ver o detalhe)
      </Typography>
    </Box>
  );
}
