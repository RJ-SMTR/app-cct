import FusePageSimple from '@fuse/core/FusePageSimple';
import { styled } from '@mui/material/styles';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { selectUser } from 'app/store/userSlice';
import {BankInfo, PersonalInfo} from './formCards/formCards';

import useThemeMediaQuery from '../../../../@fuse/hooks/useThemeMediaQuery';

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

function ProfileApp() {
  const user = useSelector(selectUser);
  const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down('lg'));

  return (
    <Root
      header={
        <div className="flex flex-col">
          <img
            className="h-160 lg:h-320 object-cover w-full"
            src="assets/images/pages/profile/cover.jpg"
            alt="Profile Cover"
          />

          <div className="flex flex-col flex-0 lg:flex-row items-center max-w-[95%] w-full mx-auto px-32 lg:h-72">
            <div className="-mt-96 lg:-mt-88 rounded-full">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1, transition: { delay: 0.1 } }}>
                {/* <Avatar
                  sx={{ borderColor: 'background.paper' }}
                  className="w-128 h-128 border-4"
                  src="assets/images/pages/profile/pfp.png"
                  alt="User avatar"
                /> */}
                <Avatar sx={{ borderColor: 'background.white' }} className="w-128 h-128 border-4"/>
              </motion.div>
            </div>

            <div className="flex flex-col items-center lg:items-start my-16 lg:mt-0 lg:ml-32">
              <Typography className="text-lg font-bold leading-none">{user.fullName ?? 'Admin'}</Typography>
              <Typography color="text.secondary">#{user.permitCode}</Typography>
            </div>
          </div>
          
        </div>
      }
      content={
        <div className="flex flex-col md:flex-row max-w-[95%] w-full mx-auto my-32">
          <PersonalInfo user={user}/>

          <BankInfo user={user}/>
        </div>
      }
    
      scroll={isMobile ? 'normal' : 'page'}
    />
  );
}

export default ProfileApp;
