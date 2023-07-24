import { Typography,Box, Button } from '@mui/material';

import React from 'react'
import { Link } from 'react-router-dom';
import TableTransactions from './widgets/Table'


function ExtractApp() {
  return (
    <>

      <div className="p-24 text-white bg-[#004A80] overflow">
        <h2 className='fw-black'>Bem vindo, sda</h2>
        <p className='w-[100%] md:w-[35%]'>Esse é seu dashboard, aqui você pode conferir os valores que deve receber nos próximos dias e um resumo das vaigens realizadas.</p>
      </div>
      <div className="p-24 pt-10">
        <Typography className='font-medium text-3xl'>Extrato Financeiro</Typography>
        <Box className='flex flex-col md:flex-row justify-around'>
              <TableTransactions/>   
        </Box>
        <br />
      </div>
    </>
  );
}

export default ExtractApp

