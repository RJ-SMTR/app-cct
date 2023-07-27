import { useSelector } from 'react-redux';
import { Typography } from '@mui/material';
import { Box } from '@mui/system';
import Button from '@mui/material/Button';
import { Link } from 'react-router-dom';
import { selectUser } from 'app/store/userSlice';
import Trips from './widgets/Trips';

function ResumeApp() {
    const user = useSelector(selectUser);
    const fullName = user.fullName
    const [first] = fullName.split(' ');
  return (
    <>
          <div className="p-24 text-white bg-[#004A80] overflow">
              <h2 className='fw-black'>Bem vindo, {first}</h2>
              <p className='w-[100%] md:w-[35%]'>Esse é o resumo de suas viagens, aqui você pode conferir o quanto arrecadou e quantos passageiros recebeu!</p>
          </div>
          <div className='p-24 mt-10'>
              <Typography className='font-medium text-3xl'>Resumo das Viagens</Typography>  
              <Trips/>
            <Box className='flex justify-between mt-24'>
                  <Typography className='font-medium text-2xl'>Viagens anteriores</Typography> 
                  <Button>
                    Filtro
                  </Button>
                  
            </Box> 
          </div>
    </>
  )
}

export default ResumeApp