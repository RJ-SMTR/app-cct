import React, { useEffect, useState } from 'react'
import { Card, Select, TextField, Typography, MenuItem, InputLabel } from '@mui/material';
import { Box } from '@mui/system';
import { useForm } from 'react-hook-form';
import { FormControl, Autocomplete } from "@mui/material";
import { NumericFormat } from 'react-number-format';
import AddIcon from '@mui/icons-material/Add';
import { useDispatch, useSelector } from 'react-redux';
import { getData, selectedYear, setSelectedDate, setSelectedYear, setSelectedStatus } from 'app/store/releaseSlice';
import { Link } from 'react-router-dom';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers';
import ptBR from 'date-fns/locale/pt-BR';
import dayjs from 'dayjs';



function CardSelection() {
    const dispatch = useDispatch()
    const selectedDate = useSelector(state => state.release.selectedDate)
    const selectedStatus = useSelector(state => state.release.selectedStatus)
    const selectedYear = useSelector(state => state.release.selectedYear)
    const { register } = useForm()

    function handleChange(event) {
        const { name, value } = event.target;
        dispatch(setSelectedDate({
            ...selectedDate,
            [name]: value
        }));
    }
    function handleChangeStatus(event) {
        const { name, value } = event.target;
        dispatch(setSelectedStatus({
            ...selectedStatus,
            [name]: value
        }));
    }
   

    const handleYearChange = (newValue) => {
        dispatch(setSelectedYear(newValue));
    };

    useEffect(() => {
        let selectedYearFormat = null
        if(selectedYear){
             selectedYearFormat = dayjs(selectedYear).year()
        }
    
        if (selectedDate.mes && selectedDate.periodo || selectedStatus) {

            dispatch(getData({selectedDate, selectedStatus, selectedYearFormat}))

        } 

           
    }, [selectedDate, selectedStatus,selectedYear])


  
    return (
        <>
                <Box className='flex flex-col  justify-around'>
                    <Card className="w-full p-24 relative mt-32">
                        <header className="flex justify-between items-center">
                            <h3 className="font-semibold mb-24">
                                Seleção de Período
                            </h3>
                        </header>
                            <Box className="grid gap-x-10 grid-cols-3">
                                <FormControl fullWidth>
                                    <InputLabel id="select-mes">Selecionar Mês</InputLabel>
                                    <Select
                                        {...register('mes')}
                                        labelId="select-mes"
                                        id="select-mes"
                                        label="Selecionar Mes"
                                    onChange={handleChange}
                                value={selectedDate.mes} 
                                    >
                                        <MenuItem value={null}>Selecionar Mês</MenuItem>
                                        <MenuItem value={1}>Janeiro</MenuItem>
                                        <MenuItem value={2}>Fevereiro</MenuItem>
                                        <MenuItem value={3}>Março</MenuItem>
                                        <MenuItem value={4}>Abril</MenuItem>
                                        <MenuItem value={5}>Maio</MenuItem>
                                        <MenuItem value={6}>Junho</MenuItem>
                                        <MenuItem value={7}>Julho</MenuItem>
                                        <MenuItem value={8}>Agosto</MenuItem>
                                        <MenuItem value={9}>Setembro</MenuItem>
                                        <MenuItem value={10}>Outubro</MenuItem>
                                        <MenuItem value={11}>Novembro</MenuItem>
                                        <MenuItem value={12}>Dezembro</MenuItem>
                                    </Select>
                                </FormControl>
                                <FormControl fullWidth>
                                    <InputLabel id="select-periodo">Selecionar Período</InputLabel>
                                    <Select
                                        {...register('periodo')}
                                        labelId="select-periodo"
                                        id="select-periodo"
                                        label="Selecionar Periodo"
                                    onChange={handleChange}
                                value={selectedDate.periodo} 


                                    >
                                        <MenuItem value={null}>Selecionar Período</MenuItem>
                                        <MenuItem value={1}>1a Quinzena</MenuItem>
                                        <MenuItem value={2}>2a Quinzena</MenuItem>
                                    </Select>
                                </FormControl>
                                <FormControl fullWidth>
                            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>

                                <DatePicker {...register('ano')} onChange={handleYearChange} label={'Selecionar Ano'} openTo="year" views={['year']} />  

                            </LocalizationProvider>
                                </FormControl>
                           

                            </Box>
                    <Link to={'/lancamentos'} className='absolute right-0 top-0 m-16 bg-[#004A80] pr-10 rounded text-white'>
                <AddIcon/> Novo
            </Link>
                        <header className="flex justify-between items-center mt-40">
                            <h3 className="font-semibold mb-24">
                                Seleção de Status de Aprovação
                            </h3>
                        </header>
                            <Box className="grid gap-x-10 grid-cols-3">
                                <FormControl fullWidth>
                                    <InputLabel id="select-status">Selecionar Status</InputLabel>
                                    <Select
                                        {...register('status')}
                                        labelId="select-mes"
                                        id="select-mes"
                                        label="Selecionar Status"
                                    onChange={handleChangeStatus}
                                    value={selectedStatus?.status} 
                                    >
                                        <MenuItem value={null}>Ver todos</MenuItem>
                                        <MenuItem value={0}>Não autorizado</MenuItem>
                                        <MenuItem value={1}>Autorizado</MenuItem>
                                    </Select>
                                </FormControl>

                            </Box>
                    <Link to={'/lancamentos'} className='absolute right-0 top-0 m-16 bg-[#004A80] pr-10 rounded text-white'>
                <AddIcon/> Novo
            </Link>
                         
                    </Card>
                </Box>
        </>
    );
}

export default CardSelection