import { Typography, Box, Button, Modal } from '@mui/material';

import React, { useContext, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { selectUser } from 'app/store/userSlice';
import TableTransactions from './utils/Table'

import { setFullReport} from 'app/store/extractSlice';

// import TableTypes from './widgets/TableTypes';
// import TablePending from './widgets/TablePending';
const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '54rem',
  maxWidth: '90%',
  maxHeight: '85vh',
  borderRadius: '.5rem',
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
};


function ExtractApp() {
  const dispatch = useDispatch()
  const user = useSelector(selectUser);
  const fullName = user.fullName ?? 'Admin';
  const [first] = fullName?.split(' ');


  // useEffect(() => {
  //   dispatch(setFullReport(true))
  //   const modalShown = sessionStorage.getItem('modalShown');
  //   if (!modalShown) {
  //     setModal(true);
  //     sessionStorage.setItem('modalShown', 'true');
  //   }
  // }, [])
  // const handleClose = () => {
  //   setModal(false);
  // };

  return (
    <>

      <div className="p-24 text-white bg-[#004A80] overflow">
        <h2 className='fw-black'>Bem vindo, {first}</h2>
        <p className='w-[100%] md:w-[35%]'>Esse é seu painel financeiro, aqui você pode conferir os valores que deve receber nos próximos dias e uma média das suas entradas.</p>
      </div>
      <div className="p-24 pt-10">
        <Typography className='font-medium text-3xl'>Resumo dos Valores de 2024</Typography>
        <Box className='flex flex-col md:flex-row mt-24 justify-around spacing-x-1'>

        </Box>
        <div className={`flex flex-col`}>
          <Box className='flex flex-col md:flex-row  justify-around'>
            <TableTransactions data={{id: user.id, ano: 24}} />
          </Box>

        </div>
       

        <br />
      </div>
    </>
  );
}

export default ExtractApp

