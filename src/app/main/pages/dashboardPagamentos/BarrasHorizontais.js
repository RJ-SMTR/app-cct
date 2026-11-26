import { Fragment } from 'react';
import { Box, Tooltip, Typography } from '@mui/material';

const COR_GRADE = 'rgba(128,128,128,0.18)';

/** Linhas verticais da grade, nas marcas do eixo. */
function Grade({ ticks, pos }) {
  return ticks.map((t) => (
    <Box key={t} aria-hidden sx={{ position: 'absolute', top: 0, bottom: 0, left: `${pos(t)}%`, borderLeft: `1px dashed ${COR_GRADE}` }} />
  ));
}

/**
 * Barras horizontais numa escala só, com o texto (valor, %) logo depois da ponta de cada barra.
 * - `linhas`: [{ id, rotulo, barras: [{ key, cor, desenhado, texto, dica, onClick }] }]. Cada linha pode ter mais
 *   de uma barra (uma embaixo da outra). `desenhado` é o comprimento na escala; `texto` vai à direita da barra.
 * - `escala`: { max, ticks } (ver `escalaEixo`). `formatarEixo` formata as marcas do eixo.
 * Clicar (ou Enter/Espaço) numa barra chama o `onClick` dela.
 */
export default function BarrasHorizontais({
  linhas,
  escala,
  formatarEixo,
  tituloEixo,
  ariaLabel,
  larguraRotulo = 170,
  alturaBarra = 40,
  tamanhoTexto = 15,
  espacoLinha = 1.5,
}) {
  const pos = (v) => (escala.max > 0 ? Math.min((v / escala.max) * 100, 100) : 0);
  const ativar = (barra) => (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      barra.onClick?.();
    }
  };

  return (
    <Box role="group" aria-label={ariaLabel} sx={{ pr: 3 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: `${larguraRotulo}px minmax(0, 1fr)`, columnGap: 1.5 }}>
        {linhas.map((linha) => (
          <Fragment key={linha.id}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', textAlign: 'right' }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: Math.min(tamanhoTexto, 15) }}>
                {linha.rotulo}
              </Typography>
            </Box>
            <Box sx={{ position: 'relative', py: espacoLinha, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 0.5 }}>
              <Grade ticks={escala.ticks} pos={pos} />
              {linha.barras.map((barra) => (
                <Box key={barra.key} sx={{ display: 'flex', alignItems: 'center', position: 'relative', minHeight: alturaBarra }}>
                  <Tooltip title={barra.dica ?? ''} placement="top" arrow>
                    <Box
                      role="button"
                      tabIndex={0}
                      aria-label={barra.dica}
                      onClick={() => barra.onClick?.()}
                      onKeyDown={ativar(barra)}
                      sx={{
                        width: `${pos(barra.desenhado)}%`,
                        minWidth: barra.desenhado > 0 ? 3 : 0,
                        height: alturaBarra,
                        flexShrink: 0,
                        bgcolor: barra.cor,
                        borderRadius: '2px',
                        cursor: 'pointer',
                        transition: 'filter .15s',
                        '&:hover, &:focus-visible': { filter: 'brightness(0.88)', outline: 'none' },
                      }}
                    />
                  </Tooltip>
                  <Typography
                    component="span"
                    sx={{ ml: 1, color: barra.cor, fontWeight: 600, fontSize: tamanhoTexto, whiteSpace: 'nowrap', pointerEvents: 'none' }}
                  >
                    {barra.texto}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Fragment>
        ))}

        <Box />
        <Box sx={{ position: 'relative', height: 22, borderTop: 1, borderColor: 'divider' }}>
          {escala.ticks.map((t) => (
            <Typography
              key={t}
              variant="caption"
              color="text.secondary"
              sx={{ position: 'absolute', top: 4, left: `${pos(t)}%`, transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}
            >
              {formatarEixo(t)}
            </Typography>
          ))}
        </Box>
        <Box />
        <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', mt: 0.5 }}>
          {tituloEixo}
        </Typography>
      </Box>
    </Box>
  );
}
