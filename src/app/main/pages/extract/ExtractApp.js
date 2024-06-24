import { Typography, Box, Button } from '@mui/material';

import React, { useContext, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { selectUser } from 'app/store/userSlice';
import Chart from './widgets/Chart';
import Entries from './widgets/Entries';
import TableTransactions from './widgets/Table'

import { setFullReport} from 'app/store/extractSlice';

import TableTypes from './widgets/TableTypes';
import TablePending from './widgets/TablePending';



function ExtractApp() {
  const dispatch = useDispatch()
  const user = useSelector(selectUser);
  const fullName = user.fullName ?? 'Admin';
  const valorTransação = useSelector(state => state.extract.valorAcumuladoLabel);
  const valorPago = useSelector(state => state.extract.valorPagoLabel);
  const [first] = fullName?.split(' ');
  const searchingWeek = useSelector(state => state.extract.searchingWeek)
  const searchingDay = useSelector(state => state.extract.searchingDay)
  dispatch(setFullReport(true))



  return (
    <>

      <div className="p-24 text-white bg-[#004A80] overflow">
        <h2 className='fw-black'>Bem vindo, {first}</h2>
        <p className='w-[100%] md:w-[35%]'>Esse é seu painel financeiro, aqui você pode conferir os valores que deve receber nos próximos dias, a lista de transações recentes e uma média das suas entradas.</p>
      </div>
      <div className="p-24 pt-10">
        <Typography className='font-medium text-3xl'>Resumo dos Valores</Typography>
        <Box className='flex flex-col md:flex-row mt-24 justify-around spacing-x-1'>
          <Entries  type="Valor Transação - Diário" isDay="true" />
          <Entries type={valorTransação} isDay="false" />
          <Entries type={valorPago} isDay="false" />
        </Box>
        
        <div className={`flex flex-col ${searchingDay && 'flex-col-reverse'}`}>
          <Box className='flex flex-col md:flex-row  justify-around'>
            <TableTransactions />
          </Box>
          <Box className='flex flex-col md:flex-row   justify-around'>
            <TableTypes />
          </Box>

          <Box className='flex flex-col  justify-around mt-24'>
            {searchingWeek || searchingDay ?
              <TablePending />
              : <></>
            }
          </Box>
        </div>
       

        <br />
      </div>
    </>
  );
}

export default ExtractApp

