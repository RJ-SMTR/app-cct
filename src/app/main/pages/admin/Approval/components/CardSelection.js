import React, { useEffect, useState } from 'react'
import { Card, Select, TextField, Typography, MenuItem, InputLabel } from '@mui/material';
import { Box } from '@mui/system';
import { useForm } from 'react-hook-form';
import { FormControl, Autocomplete } from "@mui/material";
import { NumericFormat } from 'react-number-format';
import AddIcon from '@mui/icons-material/Add';
import { useDispatch, useSelector } from 'react-redux';
import { getData, selectedPeriod, setSelectedPeriod } from 'app/store/releaseSlice';
import { Link } from 'react-router-dom';




function CardSelection() {
    const dispatch = useDispatch()
 const selectedPeriod = useSelector(state => state.release.selectedPeriod)
    const { register } = useForm()
    const [selectedDate, setSelectedDate] = useState({
        mes: '',
        periodo: ''
    });

    function handleChange(event) {
        const { name, value } = event.target;
        dispatch(setSelectedPeriod(!selectedPeriod))

        setSelectedDate(prevState => ({
            ...prevState,
            [name]: value
        }));
    }
    useEffect(() => {
        if (selectedDate.mes && selectedDate.periodo) {
            dispatch(getData({selectedDate}))
            
        }
    }, [selectedDate]);

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
                                    >
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


                                    >
                                        <MenuItem value={1}>1a Quinzena</MenuItem>
                                        <MenuItem value={2}>2a Quinzena</MenuItem>
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