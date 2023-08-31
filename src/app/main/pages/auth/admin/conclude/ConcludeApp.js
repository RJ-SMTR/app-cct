import React, { useContext, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AuthContext } from 'src/app/auth/AuthContext'
import Typography from '@mui/material/Typography';
import _ from '@lodash';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';

function ConcludeApp() {
    let { hash } = useParams()
    const navigate = useNavigate()
    const {handleAdminLogin} = useContext(AuthContext)
    const [adminHashUsed, setAdminHashUsed] = useState(false)
    if(hash && !adminHashUsed){
        handleAdminLogin(hash)
        .then(() => {
          setTimeout(() => {
                navigate('/admin')
          }, 3000)
        })
        setAdminHashUsed(true)
    }

  return (
    <>

      <div className="flex flex-col sm:flex-row items-center justify-center md:items-start sm:justify-center md:justify-start flex-1 min-w-0">
        <Paper className="h-full sm:h-auto flex items-center md:flex md:items-center md:justify-end w-full sm:w-auto md:h-full md:w-1/2 py-8 px-16 sm:p-48 md:p-64 sm:rounded-2xl md:rounded-none sm:shadow md:shadow-none ltr:border-r-1 rtl:border-l-1 relative">
          <div className="w-full max-w-320 h-5/6 md:h-1/2  sm:w-320 mx-auto sm:mx-0">
            <Typography className="mt-48 text-4xl font-extrabold tracking-tight leading-tight">
              <img src="assets/icons/logoPrefeitura.png" width="155" className='mb-10' alt='logo CCT' />
              Logado com sucesso!
            </Typography>

           <Box>Já iremos te redirecionar para seu dashboard!</Box> 
            
          </div>
          <svg
            className="absolute inset-0 pointer-events-none md:hidden"
            viewBox="0 0 960 540"
            width="100%"
            height="100%"
            preserveAspectRatio="xMidYMax slice"
            xmlns="http://www.w3.org/2000/svg"
          >
            <Box
              component="g"
              sx={{ color: 'primary.light' }}
              className="opacity-20"
              fill="none"
              stroke="currentColor"
              strokeWidth="100"
            >
              <circle r="234" cx="720" cy="491" />
            </Box>
          </svg>
        </Paper>

        <Box className="relative hidden md:flex flex-auto items-center justify-center h-screen  overflow-hidden ">
          <img src="assets/images/etc/BRT.jpg" className="w-full" alt="BRT" />
        </Box>
      </div>
    </>
  )
}

export default ConcludeApp