import { Typography,Box, Button } from '@mui/material';

import React, { useContext } from 'react'
import { useSelector } from 'react-redux';
import { selectUser } from 'app/store/userSlice';
import Chart from './widgets/Chart';
import Entries from './widgets/Entries';
import TableTransactions from './widgets/Table'
import { TripsResume } from '../home/widgets/Widgets';
import { ExtractContext } from 'src/app/hooks/ExtractContext';


function ExtractApp() {
  const user = useSelector(selectUser);
  const fullName = user.fullName
  const [first] = fullName.split(' ');
  const {mapInfo, searchingWeek, statements, searchingDay} = useContext(ExtractContext)

  return (
    <>

      <div className="p-24 text-white bg-[#004A80] overflow">
        <h2 className='fw-black'>Bem vindo, {first}</h2>
        <p className='w-[100%] md:w-[35%]'>Esse é seu painel financeiro, aqui você pode conferir os valores que deve receber nos próximos dias, a lista de transações recentes e uma média das suas entradas.</p>
      </div>
      <div className="p-24 pt-10">
        <Typography className='font-medium text-3xl'>Resumo dos Valores</Typography>
        <Box className='flex flex-col md:flex-row mt-24 justify-around max-w-[342px]'>
          <Entries />
        </Box>
        <Box className='flex flex-col md:flex-row  justify-around'>
              <TableTransactions />   
        </Box>
        <Box className='flex flex-col md:flex-row justify-around mt-24'>
          {searchingDay ?
          <TripsResume mapInfo={mapInfo} statements={statements} />
            : <Chart />
}
        </Box>
        
        <br />
      </div>
    </>
  );
}

export default ExtractApp

