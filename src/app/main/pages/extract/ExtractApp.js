import { Typography, Box, Button, Modal } from '@mui/material';

import React, { useContext, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { selectUser } from 'app/store/userSlice';
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
    const [modal, setModal] = useState(false);
  const dispatch = useDispatch()
  const user = useSelector(selectUser);
  const fullName = user.fullName ?? 'Admin';
  const paidValue = useSelector(state => state.extract.valorPagoLabel);
  const valorTransação = useSelector(state => state.extract.valorAcumuladoLabel);
  const valorPago = useSelector(state => state.extract.valorPagoLabel);
  const [first] = fullName?.split(' ');
  const searchingWeek = useSelector(state => state.extract.searchingWeek)
  const searchingDay = useSelector(state => state.extract.searchingDay)


  useEffect(() => {
    dispatch(setFullReport(true))
    const modalShown = sessionStorage.getItem('modalShown');
    if (!modalShown) {
      setModal(true);
      sessionStorage.setItem('modalShown', 'true');
    }
  }, [])
  const handleClose = () => {
    setModal(false);
  };

  return (
    <>

      <div className="p-24 text-white bg-[#004A80] overflow">
        <h2 className='fw-black'>Bem vindo, {first}</h2>
        <p className='w-[100%] md:w-[35%]'>Esse é seu painel financeiro, aqui você pode conferir os valores que deve receber nos próximos dias e uma média das suas entradas.</p>
      </div>
      <div className="p-24 pt-10">
        <Typography className='font-medium text-3xl'>Resumo dos Valores</Typography>
        <Box className='flex flex-col md:flex-row mt-24 justify-around spacing-x-1'>

        </Box>
        <div className={`flex flex-col`}>
          <Box className='flex flex-col md:flex-row  justify-around'>
            <TableTransactions data={{id: user.id, ano:25}}  />
          </Box>

       {searchingWeek && !searchingDay ? <div>
                  <TablePending />
                </div> : <></>}

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
           Comunicado:
          </Typography>
          <p>As informações anteriores ao dia 31/01/24 estão temporariamente indisponíveis.
            Qualquer dúvida, por favor, contacte o suporte!</p>
         
        </Box>
      </Modal>
    </>
  );
}

export default ExtractApp

