import React, { useEffect, useState } from 'react'
import { Card, Select, TextField, Typography, MenuItem, InputLabel} from '@mui/material';
import { Box } from '@mui/system';
import { Controller, useForm } from 'react-hook-form';
import { FormControl, Autocomplete } from "@mui/material";
import DateRangePicker from 'rsuite/DateRangePicker';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ptBR from 'date-fns/locale/pt-BR';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { NumericFormat } from 'react-number-format';




function FinanRelease() {
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
                    thousandSeparator={'.'}
                    decimalSeparator={','}
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
            <div className="p-24 pt-10">
                <Typography className='font-medium text-3xl'>Lançamentos Financeiros</Typography>
                <Box className='flex flex-col  justify-around'>
                    <Card className="w-full md:mx-9 p-24 relative mt-32">
                        <header className="flex justify-between items-center">
                            <h1 className="font-semibold">
                                Novo Registro
                            </h1>
                        </header>
                        <form
                            name="Personal"
                            noValidate
                            className="flex flex-col justify-center w-full mt-32"
                        >
                            <Box className="grid gap-10  md:grid-cols-3">
                                <FormControl fullWidth>
                                    <Autocomplete
                                        {...register('favorecido')}
                                        id='favorecidos'
                                        options={[
                                            'Auto-viação Norte',
                                            'Transoeste International'
                                        ]}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label='Selecionar Favorecido'
                                                id="bank-autocomplete"
                                                variant='outlined'

                                            />
                                        )}
                                    />
                                </FormControl>
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
                                        <MenuItem value={1}>1a Quinzena</MenuItem>
                                        <MenuItem value={2}>2a Quinzena</MenuItem>
                                    </Select>
                                </FormControl>
                                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR} >
                                    <DatePicker label="Data Ordem de Pagamento" />

                                </LocalizationProvider>
                                <TextField
                                    label="Número do Processo"
                                    type="string"
                                    variant="outlined"
                                    fullWidth
                                />
                              
                            </Box>
                            <Box className="grid md:grid-cols-3 gap-10 mt-10">
                                <TextField
                                    label="Valor Algoritmo"
                                    value={values.numberformat}
                                    onChange={handleChange}
                                    name="numberformat"
                                    InputProps={{
                                        inputComponent: NumericFormatCustom,
                                    }}
                                />
                                <TextField
                                    label="Valor Glosa"
                                    value={values.numberformat}
                                    onChange={handleChange}
                                    name="numberformat"
                                    InputProps={{
                                        inputComponent: NumericFormatCustom,
                                    }}
                                />
                              

                            </Box>
                            <Box className="grid md:grid-cols-3 gap-10  mt-10">
                                <TextField
                                    label="Valor Recurso"
                                    value={values.numberformat}
                                    onChange={handleChange}
                                    name="numberformat"
                                    InputProps={{
                                        inputComponent: NumericFormatCustom,
                                    }}
                                />
                                <TextField
                                    label="Valor a Pagar"
                                    value={values.numberformat}
                                    onChange={handleChange}
                                    name="numberformat"
                                    InputProps={{
                                        inputComponent: NumericFormatCustom,
                                    }}
                                />
                            

                            </Box>
                            <div className='flex justify-end mt-24'>
                                <a href="" className='rounded p-3 uppercase text-white bg-grey h-[27px] min-h-[27px] font-medium px-10 mx-10'>
                                    Voltar
                                </a>
                                <button type='submit' className='rounded p-3 uppercase text-white bg-[#0DB1E3] h-[27px] min-h-[27px] font-medium px-10'>
                                    Salvar
                                </button>
                            </div>
                            
                        
                        </form>
                     
                    </Card>
                </Box>
                <br />
            </div>
        </>
    );
}

export default FinanRelease