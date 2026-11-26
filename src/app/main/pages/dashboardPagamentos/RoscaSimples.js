import { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { formatBRL, formatQtd } from './dashboardPagamentosUtils';

const TAMANHO = 220;
const CENTRO = TAMANHO / 2;
const ESPESSURA = 34;
const RAIO = CENTRO - ESPESSURA / 2 - 6;

const pct = (f) => `${(f * 100).toFixed(1).replace('.', ',')}%`;

/** Cor neutra do anel e das bolinhas da legenda quando não há valores no período. */
export const COR_ROSCA_VAZIA = 'rgba(128,128,128,0.35)';

/**
 * Rosca de um anel só. As fatias vêm prontas (`montarRoscasPendencias`): { id, rotulo, cor, valor, qtd, fracao }.
 * O tamanho de cada fatia é o valor (R$); a % é sobre a soma das fatias. `mostrarQtd` exibe também a quantidade.
 * Sem valores no período (total zero), a rosca aparece sem cor (anel cinza) e com tudo zerado, sem clique.
 * Fatia com `semDetalhe` é só informativa: destaca ao passar o mouse, mas não abre nada ao clicar.
 */
export default function RoscaSimples({ titulo, fatias, total, mostrarQtd = false, onSelecionar }) {
  const [ativo, setAtivo] = useState(null);
  const perimetro = 2 * Math.PI * RAIO;
  const vazia = !(total.valor > 0);
  const f = !vazia && ativo ? fatias.find((x) => x.id === ativo) : null;
  let acumulado = 0;

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" color="text.secondary" sx={{ textAlign: 'center' }}>
        {titulo}
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <svg viewBox={`0 0 ${TAMANHO} ${TAMANHO}`} width="100%" style={{ maxWidth: 240 }} role="group" aria-label={titulo}>
          <g transform={`rotate(-90 ${CENTRO} ${CENTRO})`}>
            <circle cx={CENTRO} cy={CENTRO} r={RAIO} fill="none" stroke={vazia ? COR_ROSCA_VAZIA : 'rgba(128,128,128,0.15)'} strokeWidth={ESPESSURA} />
            {!vazia && fatias.map((fatia) => {
              const comprimento = fatia.fracao * perimetro;
              const inicio = acumulado;
              acumulado += comprimento;
              if (fatia.fracao <= 0) return null;
              return (
                <circle
                  key={fatia.id}
                  cx={CENTRO}
                  cy={CENTRO}
                  r={RAIO}
                  fill="none"
                  stroke={fatia.cor}
                  strokeWidth={ativo === fatia.id ? ESPESSURA + 6 : ESPESSURA}
                  strokeDasharray={`${comprimento} ${perimetro - comprimento}`}
                  strokeDashoffset={-inicio}
                  opacity={ativo !== null && ativo !== fatia.id ? 0.35 : 1}
                  style={{ cursor: fatia.semDetalhe ? 'default' : 'pointer', transition: 'opacity .15s, stroke-width .15s' }}
                  tabIndex={0}
                  role={fatia.semDetalhe ? 'img' : 'button'}
                  aria-label={`${fatia.rotulo}: ${formatBRL(fatia.valor)}, ${pct(fatia.fracao)}`}
                  onMouseEnter={() => setAtivo(fatia.id)}
                  onMouseLeave={() => setAtivo(null)}
                  onFocus={() => setAtivo(fatia.id)}
                  onBlur={() => setAtivo(null)}
                  onClick={() => !fatia.semDetalhe && onSelecionar?.(fatia)}
                  onKeyDown={(e) => {
                    if (!fatia.semDetalhe && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      onSelecionar?.(fatia);
                    }
                  }}
                />
              );
            })}
          </g>
          <g textAnchor="middle" fill="currentColor" style={{ pointerEvents: 'none' }}>
            <text x={CENTRO} y={CENTRO - 16} fontSize="11" opacity="0.7">
              {f ? f.rotulo : 'Total'}
            </text>
            <text x={CENTRO} y={CENTRO + 4} fontSize="15" fontWeight="600">
              {formatBRL(f ? f.valor : vazia ? 0 : total.valor)}
            </text>
            <text x={CENTRO} y={CENTRO + 22} fontSize="11">
              {f ? pct(f.fracao) : vazia ? pct(0) : '100%'}
              {mostrarQtd ? ` · ${formatQtd(f ? f.qtd : vazia ? 0 : total.qtd)} pag.` : ''}
            </text>
          </g>
        </svg>
      </Box>
      <Box sx={{ mt: 1 }}>
        {fatias.map((fatia) => (
          <Box
            key={fatia.id}
            className="flex items-center justify-between"
            sx={{ py: 0.5, px: 1, borderRadius: 1, ...(vazia || fatia.semDetalhe ? {} : { cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }) }}
            onMouseEnter={vazia ? undefined : () => setAtivo(fatia.id)}
            onMouseLeave={vazia ? undefined : () => setAtivo(null)}
            onClick={vazia || fatia.semDetalhe ? undefined : () => onSelecionar?.(fatia)}
          >
            <Box className="flex items-center" sx={{ gap: 1 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: vazia ? COR_ROSCA_VAZIA : fatia.cor, flexShrink: 0 }} />
              <Typography variant="body2">{fatia.rotulo}</Typography>
            </Box>
            <Typography variant="body2" sx={{ textAlign: 'right' }}>
              <strong>{formatBRL(vazia ? 0 : fatia.valor)}</strong>
              {mostrarQtd ? ` · ${formatQtd(vazia ? 0 : fatia.qtd)} pag.` : ''} · {pct(vazia ? 0 : fatia.fracao)}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
