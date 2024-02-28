import React, { useEffect, useState } from 'react'
import { Card, Select, TextField, Typography, MenuItem, InputLabel } from '@mui/material';
import { Box } from '@mui/system';
import { Controller, useForm } from 'react-hook-form';
import { FormControl, Autocomplete } from "@mui/material";
import DateRangePicker from 'rsuite/DateRangePicker';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ptBR from 'date-fns/locale/pt-BR';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { NumericFormat } from 'react-number-format';




function CardSelection() {
    const [values, setValues] = useState({
        numberformat: null,
    });

    const { handleSubmit, register, setError, formState, clearErrors, setValue } = useForm()

    const NumericFormatCustom = React.forwardRef(
        function NumericFormatCustom(props, ref) {
            const { onChange, ...other } = props;

            return (
                <NumericFormat
                    {...other}
                    getInputRef={ref}
                    onValueChange={(values) => {
                        onChange({
                            target: {
                                name: props.name,
                                value: values.value,
                            },
                        });
                    }}
                    thousandSeparator
                    valueIsNumericString
                    prefix="R$"
                />
            );
        },
    );
    const handleChange = (event) => {
        setValues({
            ...values,
            [event.target.name]: event.target.value,
        });
    };


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
                                        // value={age}
                                        label="Selecionar Mes"
                                    // onChange={handleChange}


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
                                        // value={age}
                                        label="Selecionar Periodo"
                                    // onChange={handleChange}


                                    >
                                        <MenuItem value={1}>01/02 - 15/02</MenuItem>
                                        <MenuItem value={2}>16/02 - 29/02</MenuItem>
                                    </Select>
                                </FormControl>
                           

                            </Box>

                         
                    </Card>
                </Box>
        </>
    );
}

export default CardSelection