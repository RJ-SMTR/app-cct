import { Typography,Box, Button } from '@mui/material';

import React from 'react'
import { useSelector } from 'react-redux';
import { selectUser } from 'app/store/userSlice';
import Chart from './widgets/Chart';
import Entries from './widgets/Entries';
import TableTransactions from './widgets/Table'


function ExtractApp() {
  const user = useSelector(selectUser);
  const fullName = user.fullName ?? 'Admin'
  const [first] = fullName?.split(' ');

  return (
    <>

      <div className="p-24 text-white bg-[#004A80] overflow">
        <h2 className='fw-black'>Bem vindo, {first}</h2>
        <p className='w-[100%] md:w-[35%]'>Esse é seu painel financeiro, aqui você pode conferir os valores que deve receber nos próximos dias, a lista de transações recentes e uma média das suas entradas.</p>
      </div>
      <div className="p-24 pt-10">
        <Typography className='font-medium text-3xl'>Extrato Financeiro</Typography>
        <Box className='flex flex-col md:flex-row mt-24 justify-around max-w-[342px]'>
          <Entries />
        </Box>
        <Box className='flex flex-col md:flex-row  justify-around'>
              <TableTransactions />   
        </Box>
        <Box className='flex flex-col md:flex-row justify-around mt-24'>
              <Chart/>   
        </Box>
        
        <br />
      </div>
    </>
  );
}

export default ExtractApp

