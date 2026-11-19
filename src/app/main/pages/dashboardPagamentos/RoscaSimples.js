import { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { formatBRL, formatQtd } from './dashboardPagamentosUtils';

const TAMANHO = 220;
const CENTRO = TAMANHO / 2;
const ESPESSURA = 34;
const RAIO = CENTRO - ESPESSURA / 2 - 6;

const pct = (f) => `${(f * 100).toFixed(1).replace('.', ',')}%`;

/**
 * Rosca de um anel só. As fatias vêm prontas (`montarRoscasPendencias`): { id, rotulo, cor, valor, qtd, fracao }.
 * O tamanho de cada fatia é o valor (R$); a % é sobre a soma das fatias. `mostrarQtd` exibe também a quantidade.
 */
export default function RoscaSimples({ titulo, fatias, total, mostrarQtd = false, onSelecionar }) {
  const [ativo, setAtivo] = useState(null);
  const perimetro = 2 * Math.PI * RAIO;
  const f = ativo ? fatias.find((x) => x.id === ativo) : null;
  let acumulado = 0;

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" color="text.secondary" sx={{ textAlign: 'center' }}>
        {titulo}
      </Typography>
      {total.valor <= 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
          Sem valores no período.
        </Typography>
      ) : (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <svg viewBox={`0 0 ${TAMANHO} ${TAMANHO}`} width="100%" style={{ maxWidth: 240 }} role="group" aria-label={titulo}>
              <g transform={`rotate(-90 ${CENTRO} ${CENTRO})`}>
                <circle cx={CENTRO} cy={CENTRO} r={RAIO} fill="none" stroke="rgba(128,128,128,0.15)" strokeWidth={ESPESSURA} />
                {fatias.map((fatia) => {
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
                      style={{ cursor: 'pointer', transition: 'opacity .15s, stroke-width .15s' }}
                      tabIndex={0}
                      role="button"
                      aria-label={`${fatia.rotulo}: ${formatBRL(fatia.valor)}, ${pct(fatia.fracao)}`}
                      onMouseEnter={() => setAtivo(fatia.id)}
                      onMouseLeave={() => setAtivo(null)}
                      onFocus={() => setAtivo(fatia.id)}
                      onBlur={() => setAtivo(null)}
                      onClick={() => onSelecionar?.(fatia)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
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
                  {formatBRL(f ? f.valor : total.valor)}
                </text>
                <text x={CENTRO} y={CENTRO + 22} fontSize="11">
                  {f ? pct(f.fracao) : '100%'}
                  {mostrarQtd ? ` · ${formatQtd(f ? f.qtd : total.qtd)} pag.` : ''}
                </text>
              </g>
            </svg>
          </Box>
          <Box sx={{ mt: 1 }}>
            {fatias.map((fatia) => (
              <Box
                key={fatia.id}
                className="flex items-center justify-between"
                sx={{ py: 0.5, px: 1, borderRadius: 1, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                onMouseEnter={() => setAtivo(fatia.id)}
                onMouseLeave={() => setAtivo(null)}
                onClick={() => onSelecionar?.(fatia)}
              >
                <Box className="flex items-center" sx={{ gap: 1 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: fatia.cor, flexShrink: 0 }} />
                  <Typography variant="body2">{fatia.rotulo}</Typography>
                </Box>
                <Typography variant="body2" sx={{ textAlign: 'right' }}>
                  <strong>{formatBRL(fatia.valor)}</strong>
                  {mostrarQtd ? ` · ${formatQtd(fatia.qtd)} pag.` : ''} · {pct(fatia.fracao)}
                </Typography>
              </Box>
            ))}
          </Box>
        </>
      )}
    </Box>
  );
}
