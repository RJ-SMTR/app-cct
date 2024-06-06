import FusePageSimple from '@fuse/core/FusePageSimple';
import { styled } from '@mui/material/styles';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { selectUser, setUser } from 'app/store/userSlice';
import { BankInfo, PersonalInfo } from './forms/userForms';
import { showMessage } from 'app/store/fuse/messageSlice';
import { useDispatch } from 'react-redux';

import { useThemeMediaQuery
 } from '@fuse/hooks';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@mui/material';
import { useEffect, useState } from 'react';
import { api } from 'app/configs/api/api';
import Table from '../../extract/widgets/Table';
import { setFullReport } from 'app/store/extractSlice';
import TableTypes from '../../extract/widgets/TableTypes';
import Entries from '../../extract/widgets/Entries';
const Root = styled(FusePageSimple)(({ theme }) => ({
  '& .FusePageSimple-header': {
    backgroundColor: theme.palette.background.paper,
    borderBottomWidth: 1,
    borderStyle: 'solid',
    borderColor: theme.palette.divider,
    '& > .container': {
      maxWidth: '100%',
    },
  },
}));

function UserApp() {
  const [user, setUser] = useState()
  let {id} = useParams()
  const valorAcumulado = useSelector(state => state.extract.valorAcumuladoLabel);
  const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down('lg'));
  const dispatch = useDispatch()
  useEffect(() => {
    dispatch(setFullReport(true))
  }, [])
  const onSubmit = async () => {

      const token = window.localStorage.getItem('jwt_access_token')
      const data = {
        id: id,
      };

      return new Promise((resolve, reject) => {
        api
          .post('/auth/email/resend', data, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
          .then((response) => {
            dispatch(showMessage({ message: 'E-mail enviado.' }))
            resolve(response.data)
          })
          .catch((error) => {  
            reject(error)
            if(error.response.data.error.includes('mailStatus')){
              dispatch(showMessage({ message: 'Usuário não esta na fila de envio, não foi possível fazer o reenvio.' }))

            } else if (error.response.data.error.includes('quota')){
              dispatch(showMessage({ message: 'Número máximo de envios diário atingido, não foi possível fazer o reenvio.' }))
            } else {
              dispatch(showMessage({ message: 'Erro desconhecido, não foi possível fazer o reenvio.' }))
            }
            console.log(error.response.data.error)

          });
      });
  };
  useEffect(() => {
    const token = window.localStorage.getItem('jwt_access_token');
    api.get(`/users/${id}`, {
      headers: { "Authorization": `Bearer ${token}` },
    })
        .then(response => {
          setUser(response.data)
        })
  }, [])


  return (
    <Root
      header={
        <div className="flex flex-col">
          <img
            className="h-160 lg:h-320 object-cover w-full"
            src="assets/images/pages/profile/cover.jpg"
            alt="Profile Cover"
          />

          <div className="flex flex-col flex-0 lg:flex-row items-center max-w-[95%] w-full mx-auto px-32 lg:h-72 md:justify-between">
           <div className='flex flex-col md:flex-row'>
             <div className="-mt-96 lg:-mt-88 rounded-full">
               <motion.div initial={{ scale: 0 }} animate={{ scale: 1, transition: { delay: 0.1 } }}>
                
                  <Avatar sx={{ borderColor: 'background.white' }} className="w-128 h-128 border-4"  />
               </motion.div>
             </div>
            
             <div className="flex flex-col items-center lg:items-start my-16 lg:mt-0 lg:ml-32 md:justify-between">
              
                 <Typography className="text-lg font-bold leading-none">{user?.fullName}</Typography>
                 <Typography color="text.secondary">#{id}</Typography>
            
             </div>
           </div>
            <div>
              <button onClick={() => onSubmit()} className='rounded p-3 uppercase text-white bg-[#0DB1E3] h-[27px] min-h-[27px] font-medium px-12 mb-12 '>
              Reenviar e-mail de cadastro
             </button>
            </div>
          
          </div>
        </div>
      }
      content={
        <div className='flex flex-col max-w-[95%] w-full mx-auto my-32'>
          <div className="flex flex-col md:flex-row">
            {user && (
              <>
                <PersonalInfo user={user} />
                <BankInfo user={user} />
              </>
            )}
          </div>
          {user && (
            <>
           <div className='md:flex mt-10 md:max-w-[50%]'>
                <Entries type="Valor diário" isDay="true" />
                <Entries type={valorAcumulado} isDay="false" />
           </div>
              <div>
                <Table id={id} />
              </div>
           
              <div>
                <TableTypes id={id} />
              </div>
            </>
          )}
        </div>
      }

      scroll={isMobile ? 'normal' : 'page'}
    />
  );
}

export default UserApp;
