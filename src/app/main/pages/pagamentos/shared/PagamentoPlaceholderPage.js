import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import ConstructionIcon from '@mui/icons-material/Construction';

// Tela de espaço reservado — as ações de geração/disparo de remessa (Consórcios,
// Modais, Guardadores) envolvem gerar arquivo CNAB e enviar ao banco via SFTP,
// uma ação sensível e sem trava contra execução duplicada no backend hoje.
// Por segurança, essas telas ficam como placeholder até a implementação real
// (com trava, confirmação e permissão restrita) ser definida e construída.
export default function PagamentoPlaceholderPage({ title }) {
  return (
    <div className="p-24 pt-10">
      <Typography className="font-medium text-3xl mb-24">{title}</Typography>

      <Paper className="p-32 rounded-2xl">
        <Box className="flex flex-col items-center text-center gap-16 py-32">
          <ConstructionIcon sx={{ fontSize: 48 }} color="disabled" />
          <Typography variant="h6">Em desenvolvimento</Typography>
          <Typography color="text.secondary" className="max-w-[36rem]">
            O disparo manual de remessa para {title.split(' - ')[1] || 'este grupo'} ainda está sendo
            implementado. Essa ação gera um arquivo de remessa e o envia ao banco, então antes de
            liberá-la aqui vamos adicionar proteção contra execução duplicada e confirmação explícita.
          </Typography>
        </Box>
      </Paper>
    </div>
  );
}
