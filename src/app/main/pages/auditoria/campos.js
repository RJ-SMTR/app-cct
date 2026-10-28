import React from 'react';
import { MenuItem, TextField } from '@mui/material';

export function CampoTexto({ rotulo, valor, onChange, onEnter, largura = 160, ...resto }) {
  return (
    <TextField
      size="small"
      label={rotulo}
      value={valor ?? ''}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && onEnter?.()}
      sx={{ width: largura }}
      {...resto}
    />
  );
}

export function CampoData({ rotulo, valor, onChange, largura = 160 }) {
  return (
    <TextField
      size="small"
      type="date"
      label={rotulo}
      value={valor ?? ''}
      onChange={(e) => onChange(e.target.value)}
      InputLabelProps={{ shrink: true }}
      sx={{ width: largura }}
    />
  );
}

/** `opcoes`: [{ valor, rotulo }]; a primeira opção "Todos" limpa o filtro. */
export function CampoSelecao({ rotulo, valor, onChange, opcoes, largura = 180 }) {
  return (
    <TextField select size="small" label={rotulo} value={valor ?? ''} onChange={(e) => onChange(e.target.value)} sx={{ width: largura }}>
      <MenuItem value="">Todos</MenuItem>
      {opcoes.map((o) => (
        <MenuItem key={o.valor} value={o.valor}>
          {o.rotulo}
        </MenuItem>
      ))}
    </TextField>
  );
}
