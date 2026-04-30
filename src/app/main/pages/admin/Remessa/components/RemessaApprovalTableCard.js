import React from 'react';
import { Card } from '@mui/material';
import { Box } from '@mui/system';
import { TableRemessa } from './TableRemessa';

export function RemessaApprovalTableCard() {
  return (
    <div className="p-1 pt-10">
      <Box className='flex flex-col  justify-around w-full md:mx-9 p-24 relative mt-16'>
        <Card className="w-full md:mx-9 p-24 relative mt-16">
          <header className="flex justify-between items-center mb-24">
            <h3 className="font-semibold">
              Aprovação de Remessas
            </h3>
          </header>
          <TableRemessa />
        </Card>
      </Box>
      <br />
    </div>
  );
}
