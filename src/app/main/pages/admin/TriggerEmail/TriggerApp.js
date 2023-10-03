import React, { useState } from 'react';
import { Typography, Paper, Box } from '@mui/material';
import { showMessage } from 'app/store/fuse/messageSlice';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';



function TriggerApp() {
    const [messageSent, setShowMessageSent] = useState(false)
    function sendEmail() {
            setShowMessageSent(true)

    }
  return (
      <div className="p-24 pt-10">
          <Typography className="font-medium text-3xl">Disparo de e-mail</Typography>
          <Box className="flex flex-col justify-around">
              <div>
                  <Paper className="flex flex-col flex-auto p-12 mt-24 shadow rounded-2xl overflow-hidden">
                          <Typography className='font-medium text-2xl'>Enviar e-mails de cadastro</Typography>
                          <label className='my-10'>Os envios são feitos diariamente em lotes (500 p/ dia). Para acompanhar os envios veja <Link to="/" className='underline'>aqui</Link></label>
                            {messageSent ? <Typography>
                                E-mails enviados com sucesso. Serviço disponível novamente em 24 horas
                            </Typography> : <></>}
                          <button type="button" onClick={() => sendEmail()} disabled={messageSent ? 'disabled' : ''} className='rounded p-3 uppercase text-white bg-[#0DB1E3] h-[27px] min-h-[27px] font-medium px-10 mt-10 '>Enviar</button>
                  </Paper>
              </div>
          </Box>
          <br />
      </div>
  )
}

export default TriggerApp