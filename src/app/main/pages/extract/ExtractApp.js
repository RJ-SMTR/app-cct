import { Typography, Box, Button, Modal } from '@mui/material';

import React, { useContext, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { selectUser } from 'app/store/userSlice';
import Chart from './widgets/Chart';
import Entries from './widgets/Entries';
import TableTransactions from './widgets/Table'

import { setFullReport} from 'app/store/extractSlice';

import TableTypes from './widgets/TableTypes';
import TablePending from './widgets/TablePending';
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
  const valorTransação = useSelector(state => state.extract.valorAcumuladoLabel);
  const valorPago = useSelector(state => state.extract.valorPagoLabel);
  const [first] = fullName?.split(' ');
  const searchingWeek = useSelector(state => state.extract.searchingWeek)
  const searchingDay = useSelector(state => state.extract.searchingDay)
  const [modal, setModal] = useState(false);
  dispatch(setFullReport(true))

  useEffect(() => {
    const modalShown = localStorage.getItem('modalShown');
    if (!modalShown) {
      setModal(true);
      localStorage.setItem('modalShown', 'true');
    }
  }, [])


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

          {searchingWeek || searchingDay ?
            <>

              <Box className='flex flex-col md:flex-row   justify-around'>
                <TableTypes />
              </Box>
              <Box className='flex flex-col  justify-around mt-24'>
                <TablePending />
              </Box>
              </>
              : <></>
            }

        </div>
       

        <br />
      </div>
      <Modal
        open={modal}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style} className="overflow-scroll text-center">
          <Typography id="modal-modal-title" variant="h6" component="h3">
            Manutenção Programada
          </Typography>
          <p>Ocorrerá uma manuntenção do sistema no dia:</p>
          <Typography id="modal-modal-title font-bold" variant="h6" component="h3">
            03/02/2025
          </Typography>
          <p>

            Nesta data o sistema<strong> estará indisponível até às 19hrs.</strong><br />

          </p>
        </Box>
      </Modal>
    </>
  );
}

export default ExtractApp

