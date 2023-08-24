import { styled } from '@mui/material/styles';
import { useSelector } from 'react-redux';
import { selectUser } from 'app/store/userSlice';
import {CurrentStatementWidget, TripsResume} from './widgets/Widgets'
import { Typography } from '@mui/material';
import { Box } from '@mui/system';
import Button from '@mui/material/Button';
import { Link } from 'react-router-dom';


function Home(props) {
  const user = useSelector(selectUser);
  const fullName = user.fullName
  const [first] = fullName.split(' ');

  return (
    <>
    
      <div className="p-24 text-white bg-[#004A80] overflow">
          <h2 className='fw-black'>Bem vindo, {first}</h2>
          <p className='w-[100%] md:w-[35%]'>Esse é seu dashboard, aqui você pode conferir os valores que deve receber nos próximos dias e um resumo das vaigens realizadas.</p>
        </div>
        <div className="p-24 pt-10 max-w-[342px]">
          <Typography className='font-medium text-3xl'>Extrato</Typography>
          <Box className='flex flex-col  justify-around'>
          <CurrentStatementWidget/>
          <Button
            variant="contained"
            color="secondary"
            className="w-full z-10 mt-24"
            aria-label="Register"
            size="large"
            role="button"
          >
            <Link className='text-white no-underline'  to="/extrato">
              Ver extrato completo 
            </Link>
          </Button>
          </Box>
          <br />
        </div>
      <div className="p-24 pt-10 max-w-[342px]" >
          <Typography className='font-medium text-3xl'>Resumo das Viagens</Typography>
          <Box className='flex flex-col  justify-around md:justify-start'>
            {/* <TripsResume/> */}
          <Button
            variant="contained"
            color="secondary"
            className="w-full z-10 mt-24"
            aria-label="Register"
            size="large"
            role="button"
          >
            <Link className='text-white no-underline' to="/resumo">
              Ver resumo completo
            </Link>
          </Button>
          </Box>

          <br />
        </div>
    </>
  );
}

export default Home;
