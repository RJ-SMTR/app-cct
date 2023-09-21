import FusePageSimple from '@fuse/core/FusePageSimple';
import { styled } from '@mui/material/styles';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { selectUser, setUser } from 'app/store/userSlice';
import { BankInfo, PersonalInfo } from './forms/userForms';

import { useThemeMediaQuery
 } from '@fuse/hooks';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@mui/material';
import { useEffect, useState } from 'react';
import { api } from 'app/configs/api/api';
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
  const [user, setUser] = useState({})
  let {id} = useParams()
  const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down('lg'));
  useEffect(() => {
    api.get(`/users/${id}`)
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
                 <Avatar
                   sx={{ borderColor: 'background.paper' }}
                   className="w-128 h-128 border-4"
                   src="assets/images/pages/profile/pfp.png"
                   alt="User avatar"
                 />
               </motion.div>
             </div>
            
             <div className="flex flex-col items-center lg:items-start my-16 lg:mt-0 lg:ml-32 md:justify-between">
                 <Typography className="text-lg font-bold leading-none">João</Typography>
                 <Typography color="text.secondary">#{id}</Typography>
            
             </div>
           </div>
            <div>
              <button className='rounded p-3 uppercase text-white bg-[#0DB1E3] h-[27px] min-h-[27px] font-medium px-12 '>
              Reenviar e-mail de cadastro
             </button>
            </div>
          
          </div>

        </div>
      }
      content={
      <>
          <div>
            <Link>
            Voltar
            </Link>
          </div>
          <div className="flex flex-col md:flex-row max-w-[95%] w-full mx-auto my-32">
            
            <PersonalInfo user={user} />
        
            <BankInfo user={user} />
          </div>
      </>
      }

      scroll={isMobile ? 'normal' : 'page'}
    />
  );
}

export default UserApp;
