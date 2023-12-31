import { Typography, Box, Button } from '@mui/material';

import React, { useContext, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { selectUser } from 'app/store/userSlice';
import Chart from './widgets/Chart';
import Entries from './widgets/Entries';
import TableTransactions from './widgets/Table'
import { TripsResume } from '../home/widgets/Widgets';
import {  getFirstByType, getFirstTypes, setFullReport} from 'app/store/extractSlice';
import TableTypes from './widgets/TableTypes';



function ExtractApp() {
  const dispatch = useDispatch()
  const user = useSelector(selectUser);
  const fullName = user.fullName ?? 'Admin';
  const valorAcumulado = useSelector(state => state.extract.valorAcumuladoLabel);
  const [first] = fullName?.split(' ');
  const mapInfo = useSelector(state => state.extract.mapInfo)
  const searchingDay = useSelector(state => state.extract.searchingDay)
  const statements = useSelector(state => state.extract.statements)
  dispatch(setFullReport(true))



  return (
    <>

      <div className="p-24 text-white bg-[#004A80] overflow">
        <h2 className='fw-black'>Bem vindo, {first}</h2>
        <p className='w-[100%] md:w-[35%]'>Esse é seu painel financeiro, aqui você pode conferir os valores que deve receber nos próximos dias, a lista de transações recentes e uma média das suas entradas.</p>
      </div>
      <div className="p-24 pt-10">
        <Typography className='font-medium text-3xl'>Resumo dos Valores</Typography>
        <Box className='flex flex-col md:flex-row mt-24 justify-around max-w-[684px] spacing-x-1'>
          <Entries  type="Valor diário" isDay="true" />
          <Entries type={valorAcumulado} isDay="false" />
        </Box>
        <Box className='flex flex-col md:flex-row  justify-around'>
          <TableTransactions />
        </Box>
     <Box className='flex flex-col md:flex-row   justify-around'>
          <TableTypes />
        </Box> 

        <Box className='flex flex-col  justify-around mt-24'>
          {searchingDay ?
            <></>
            : <Chart />
          }
        </Box>

        <br />
      </div>
    </>
  );
}

export default ExtractApp

