import React, { useState } from 'react';
import { Card, Select, MenuItem, InputLabel, Button, FormControl } from '@mui/material';
import { Box } from '@mui/system';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import AddIcon from '@mui/icons-material/Add';

import { getData, setSelectedDate, setSelectedYear, setSelectedStatus, handleAuthValue } from 'app/store/releaseSlice';

import { Link } from 'react-router-dom';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers';
import ptBR from 'date-fns/locale/pt-BR';
import dayjs from 'dayjs';
import { showMessage } from 'app/store/fuse/messageSlice';

function CardSelection() {
    const dispatch = useDispatch();
    const selectedDate = useSelector(state => state.release.selectedDate);
    const selectedStatus = useSelector(state => state.release.selectedStatus);
    const selectedYear = useSelector(state => state.release.selectedYear);
    const { register } = useForm();

    const [errors, setErrors] = useState({
        mes: false,
        periodo: false,
    });

    function handleChange(event) {
        const { name, value } = event.target;
        dispatch(setSelectedDate({
            ...selectedDate,
            [name]: value
        }));
        setErrors((prevErrors) => ({
            ...prevErrors,
            [name]: !value,  
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

    const searchData = () => {
        const hasErrors = (!selectedDate.mes || !selectedDate.periodo) && !selectedStatus?.status;

        setErrors({
            mes: !selectedDate.mes && !selectedStatus?.status,
            periodo: !selectedDate.periodo && !selectedStatus?.status,
        });

        if (hasErrors) {
            return;
        }

        const searchParams = {
            selectedDate: { ...selectedDate },
            selectedStatus,
        };

        if (selectedYear !== null) {
            const selectedYearFormat = dayjs(selectedYear).year();
            dispatch(setSelectedYear(selectedYearFormat));
            searchParams.selectedYear = selectedYearFormat;
        }

        dispatch(getData(searchParams))
            .catch((error) => {
                if (error.response?.status === 400) {
                    dispatch(showMessage({ message: 'Verifique os campos e tente novamente!' }));
                }
            });

        // dispatch(handleAuthValue(searchParams))

    };

    return (
        <>
            <Box className='flex flex-col justify-around'>
                <Card className="w-full p-24 relative mt-32">
                    <header className="flex justify-between items-center">
                        <h3 className="font-semibold mb-24">
                            Seleção de Período
                        </h3>
                    </header>
                    <Box className="grid gap-x-10 grid-cols-3">

                        <FormControl fullWidth>
                            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
                                <DatePicker {...register('ano')} onChange={handleYearChange} label={'Selecionar Ano'} openTo="year" views={['year']} />
                            </LocalizationProvider>
                        </FormControl>
                        <FormControl className='relative' fullWidth>
                            <InputLabel id="select-mes">Selecionar Mês</InputLabel>
                            <Select
                                {...register('mes')}
                                labelId="select-mes"
                                id="select-mes"
                                label="Selecionar Mês"
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
                            {errors.mes && <span className='absolute text-xs text-red-600 bottom-[-20px]'>Campo obrigatório para pesquisa de período*</span>}
                        </FormControl>

                        <FormControl className='relative' fullWidth>
                            <InputLabel id="select-periodo">Selecionar Período</InputLabel>
                            <Select
                                {...register('periodo')}
                                labelId="select-periodo"
                                id="select-periodo"
                                label="Selecionar Período"
                                onChange={handleChange}
                                value={selectedDate.periodo}
                            >
                                <MenuItem value={null}>Selecionar Período</MenuItem>
                                <MenuItem value={1}>1a Quinzena</MenuItem>
                                <MenuItem value={2}>2a Quinzena</MenuItem>
                            </Select>
                            {errors.periodo && <span className='absolute text-xs text-red-600 bottom-[-20px]'>Campo obrigatório para pesquisa de período*</span>}
                        </FormControl>

                    </Box>

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
                                labelId="select-status"
                                id="select-status"
                                label="Selecionar Status"
                                onChange={handleChangeStatus}
                                value={selectedStatus?.status}
                            >
                                <MenuItem value={'todos'}>Ver todos</MenuItem>
                                <MenuItem value={'autorizado'}>Autorizado</MenuItem>
                                <MenuItem value={'autorizado parcial'}>Autorizado Parcial</MenuItem>
                                <MenuItem value={'gerado'}>Lançado</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>

                    < Link to={'/lancamentos'} className='absolute right-0 top-0 m-16 bg-[#10B0E3] pr-10 rounded text-white' >
                        <AddIcon /> Novo
                    </ Link>
                    <Button variant="contained"
                        color="secondary"
                        className=" w-35% mt-16 z-10"
                        aria-label="Pesquisar" type='button' onClick={searchData}>
                        Pesquisar
                    </Button>
                </Card>
            </Box>
        </>
    );
}

export default CardSelection;


