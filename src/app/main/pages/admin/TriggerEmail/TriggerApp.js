import React, { useEffect, useState } from 'react';
import { Typography, Paper, Box } from '@mui/material';
import { showMessage } from 'app/store/fuse/messageSlice';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { getInfo } from 'app/store/adminSlice';
import { api } from 'app/configs/api/api';



function TriggerApp() {
    const dispatch = useDispatch()
    const [messageSent, setShowMessageSent] = useState(false)
    const [error, setError] = useState()
    const sendEmailValue = useSelector(state => state.admin.sendEmailValue)

    useEffect(() => {
        dispatch(getInfo())
     
    }, [])

    useEffect(() => {
        if (sendEmailValue.value === "false") {
            setShowMessageSent(true)
        }
     
    }, [sendEmailValue])

    function sendEmail(sendEmailValue) {
        const token = window.localStorage.getItem('jwt_access_token');
        return new Promise((resolve, reject) => {
            api.patch('https://api.cct.hmg.mobilidade.rio/api/settings',
           { name: sendEmailValue.name,
            version: sendEmailValue.version,
            value: sendEmailValue.value == "false" ? "true" : "false" 
        },
             {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then((response) => {
                    dispatch(getInfo())
                    setShowMessageSent(!setShowMessageSent)
                    resolve(response.data)
                })
                .catch((error) => {
                    setError(error)
                    console.error(error)
                    reject(error)
                })
        })
    }

  return (
      <div className="p-24 pt-10">
          <Typography className="font-medium text-3xl">Disparo de e-mail</Typography>
          <Box className="flex flex-col justify-around">
              <div>
                  <Paper className="flex flex-col flex-auto p-12 mt-24 shadow rounded-2xl overflow-hidden">
                          <Typography className='font-medium text-2xl'>Enviar e-mails de cadastro</Typography>
                      <label className='my-10'>Os envios são realizados em lotes, diariamente (500 p/dia).Para acompanhá-los clique <Link to="/" className='underline'>aqui!</Link></label>
                            {messageSent ? <Typography>
                                E-mails sendo enviados com sucesso.
                            </Typography> : <></>}
                            {error ? <Typography className='text-red-500'>
                          Houve um erro. Por favor tente novamente, se nada ocorrer contate o <Link className='underline' to="https://secretariamunicipaldetransportes.movidesk.com/form/6594/" >suporte</Link>
                            </Typography> : <></>}
                      <button type="button" onClick={() => sendEmail(sendEmailValue)} className={`rounded p-3 uppercase text-white h-[27px] min-h-[27px] font-medium px-10 mt-10 ${!messageSent ? 'bg-[#0DB1E3]' : 'bg-red-500'}`} >{!messageSent ? 'Enviar e-mails' : 'Parar de enviar'}</button>
                  </Paper>
              </div>
          </Box>
          <br />
      </div>
  )
}

export default TriggerApp