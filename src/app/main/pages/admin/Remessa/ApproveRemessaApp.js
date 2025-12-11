import React, { useEffect } from 'react';
import { Card, Typography } from '@mui/material';
import { Box } from '@mui/system';
import { useDispatch } from 'react-redux';
import { getBookings } from 'app/store/automationSlice';
import { TableRemessa } from './components/TableRemessa';

function ApproveRemessaApp() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getBookings());
  }, [dispatch]);

  return (
    <div className="p-24 pt-10">
      <Typography className='font-medium text-3xl'>Aprovação de Remessas</Typography>
      <Box className='flex flex-col justify-around'>
        <Card className="w-full md:mx-9 p-24 relative mt-16">
          <header className="flex justify-between items-center">
            <h3 className="font-semibold">Agendamentos</h3>
          </header>
            
          <TableRemessa />
        </Card>
      </Box>
    </div>
  );
}

export default ApproveRemessaApp;
