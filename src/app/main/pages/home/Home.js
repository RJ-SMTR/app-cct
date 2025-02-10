import { styled } from '@mui/material/styles';
import { useDispatch, useSelector } from 'react-redux';
import { selectUser } from 'app/store/userSlice';
import { Typography } from '@mui/material';
import { Box } from '@mui/system';
import Button from '@mui/material/Button';
import { Link } from 'react-router-dom';
import Table from '../extract/widgets/Table';
import {setDateRange,setFullReport, setSearchingDay, setSearchingWeek, setValorAcumuladoLabel } from 'app/store/extractSlice';
import { useEffect } from 'react';


function Home() {
  const dispatch = useDispatch()

  const user = useSelector(selectUser);
  const fullName = user.fullName ?? 'Admin'
  const [first] = fullName?.split(' ');

useEffect(() => {
  dispatch(setFullReport(false))
  dispatch(setSearchingDay(false))
  dispatch(setSearchingWeek(false))
  dispatch(setDateRange([]))
  dispatch(setValorAcumuladoLabel('Valor acumulado Mensal'))
}, [])



  return (
    <>
    
      <div className="p-24 text-white bg-[#004A80] overflow">
          <h2 className='fw-black'>Bem vindo, {first}</h2>
          <p className='w-[100%] md:w-[35%]'>Esse é seu dashboard, aqui você pode conferir os valores que deve receber nos próximos dias e um resumo das viagens realizadas.</p>
        </div>
        <div className="p-24 pt-10 ">
          <Typography className='font-medium text-3xl'>Extrato</Typography>
          <Box className='flex flex-col  justify-around'>
         <Table/>
           <Link className='text-white no-underline'  to="/extrato">
          <Button
            variant="contained"
            color="secondary"
            className="w-full z-10 mt-24"
            aria-label="Register"
            size="large"
            role="button"
          >
              Ver extrato completo 
          </Button>
            </Link>
          </Box>
          <br />
        </div>
     
    </>
  );
}

export default Home;
