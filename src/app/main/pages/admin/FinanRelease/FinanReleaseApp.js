import React, { useContext, useEffect, useRef, useState } from 'react'
import { Card, Select, TextField, Typography, MenuItem, InputLabel, InputAdornment } from '@mui/material';
import { Box } from '@mui/system';
import { Controller, useForm } from 'react-hook-form';
import { FormControl, Autocomplete } from "@mui/material";
import DateRangePicker from 'rsuite/DateRangePicker';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ptBR from 'date-fns/locale/pt-BR';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { NumericFormat } from 'react-number-format';
import { getFavorecidos, setRelease } from 'app/store/releaseSlice';
import { useDispatch } from 'react-redux';
import { AuthContext } from 'src/app/auth/AuthContext';
import dayjs from 'dayjs';




function FinanRelease() {
    const { success } = useContext(AuthContext)
    const dispatch = useDispatch()
    const [valuesState, setValuesState] = useState({});
    const [selectedMes, setSelectedMes] = useState()
    const [dateFortnight, setDateFortnight] = useState();
    const [valueToPay, setValueToPay] = useState();
    useEffect(() => {
        dispatch(getFavorecidos())
    }, [])

    const { handleSubmit, register, control, reset, clearErrors, setValue } = useForm({
        defaultValues: {
            descricao: null,
            favorecido: null,
            mes: null,
            periodo: null,
            numero_processo: null,
            algoritmo: null,
            glosa: null,
            recurso: null,
            data_ordem: null
        }
    })
    const handleValueChange = (name, value) => {
        setValuesState(prevState => ({
            ...prevState,
            [name]: value
        }));
    };



    const onSubmit = (info) => {
        info.valor_a_pagar = valueToPay
        info.valor = valueToPay
        dispatch(setRelease(info))
            .then((response) => {
                success(response, "Informações Lançadas!")
                setValuesState({})
                reset()

            })

    }


    useEffect(() => {
        if (valuesState.algoritmo && valuesState.recurso && valuesState.glosa) {
            const valueToPayAuto = parseFloat(valuesState.algoritmo) + parseFloat(valuesState.glosa) + parseFloat(valuesState.recurso)
            setValueToPay(valueToPayAuto)
        }
    }, [valuesState])

    const setDateFunction = (event) => {
        
        if(event == 1){
            const furtherDate = dayjs().month(selectedMes).set('D', 5)
            setValue('data_ordem', furtherDate.$d)
        } else {
                const furtherDate = dayjs().month(selectedMes).set('D', 20)
                setValue('data_ordem', furtherDate.$d)
        }
    }
   
    const valueProps = {
        startAdornment: <InputAdornment position='start'>R$</InputAdornment>
    }
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
                            onSubmit={handleSubmit(onSubmit)}
                        >
                            <Box className="grid gap-10  md:grid-cols-3">
                                <FormControl fullWidth>
                                    <Autocomplete
                                        id='favorecidos'
                                        options={[
                                            'Auto-viação Norte',
                                            'Transoeste International'
                                        ]}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                {...register('descricao')}
                                                label='Selecionar Favorecido'
                                                id="bank-autocomplete"
                                                variant='outlined'
                                                name='descricao'

                                            />
                                        )}
                                    />
                                </FormControl>
                                <FormControl fullWidth>
                                    <InputLabel id="select-mes">Selecionar Mês</InputLabel >
                                    <Controller
                                        name='mes'
                                        control={control}
                                        {...register('mes')}
                                        render={({ field }) => (
                                            <Select
                                                labelId="select-mes"
                                                label="Selecionar Mes"
                                                onChange={(e) => setSelectedMes(e.target.value)} 
                                                // {...field} 
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
                                        )}
                                    />
                                </FormControl>
                                <FormControl fullWidth>
                                    <InputLabel id="select-periodo">Selecionar Período</InputLabel>
                                    <Controller
                                    {...register('periodo')}
                                        name='periodo'
                                        control={control}
                                        render={({ field }) => (
                                            <Select
                                                labelId="select-periodo"
                                                label="Selecionar Período"
                                                onChange={(e) =>setDateFunction(e.target.value)} 
                                            >
                                                <MenuItem value={1}>1a Quinzena</MenuItem>
                                                <MenuItem value={2}>2a Quinzena</MenuItem>
                                            </Select>
                                         )} 
                                    /> 

                                </FormControl>

                                <FormControl>

                                    <Controller
                                        {...register('data_ordem')}
                                        name="data_ordem"
                                        control={control}
                                        render={({ field }) => (
                                            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
                                                <DatePicker
                                                    label="Data Ordem de Pagamento"
                                                    renderInput={(params) => <TextField {...params} />}
                                                    {...field}
                                                />
                                            </LocalizationProvider>
                                        )}
                                    />

                                </FormControl>
                                <FormControl>
                                    <TextField
                                        {...register('numero_processo')}
                                        label="Número do Processo"
                                        type="string"
                                        name='numero_processo'
                                        variant="outlined"
                                        fullWidth
                                    />
                                </FormControl>


                            </Box>
                            <FormControl>
                                <Box className="grid md:grid-cols-3 gap-10 mt-10">

                                    <Controller
                                        {...register('algoritmo')}
                                        name="algoritmo"
                                        control={control}
                                        render={({ field }) =>
                                            <NumericFormat
                                                {...field}
                                                labelId="algoritmo-label"
                                                thousandSeparator={'.'}
                                                decimalSeparator={','}
                                                label="Algortimo"
                                                customInput={TextField}
                                                InputProps={valueProps}
                                                onValueChange={(values, sourceInfo) => {
                                                    const { name } = sourceInfo.event.target;
                                                    handleValueChange(name, values.value);
                                                }}
                                            />
                                        }
                                    />

                                    <Controller
                                        {...register('glosa')}
                                        name="glosa"
                                        control={control}
                                        render={({ field }) =>
                                            <NumericFormat
                                                {...field}
                                                thousandSeparator={'.'}
                                                label="Glosa"
                                                allowNegative
                                                className='glosa'
                                                decimalSeparator={','}
                                                customInput={TextField}
                                                InputProps={valueProps}
                                                onValueChange={(values, sourceInfo) => {
                                                    const { name } = sourceInfo.event.target;
                                                    handleValueChange(name, values.value);
                                                }}
                                            />
                                        }
                                    />

                                    <Controller
                                        {...register('recurso')}
                                        name="recurso"
                                        control={control}

                                        render={({ field }) =>
                                            <NumericFormat
                                                {...field}
                                                thousandSeparator={'.'}
                                                decimalSeparator={','}
                                                label="Recurso"
                                                customInput={TextField}
                                                
                                                InputProps={{...valueProps,
                                                    className: valuesState.recurso < 0 ? "glosa" : "" 
                                                }}
                                                
                                                onValueChange={(values, sourceInfo) => {
                                                    const { name } = sourceInfo.event.target;
                                                    handleValueChange(name, values.value);
                                                }}
                                            />
                                        }
                                    />

                                    <Controller
                                        {...register('valor_a_pagar')}
                                        name="valor_a_pagar"
                                        control={control}
                                        render={({ field }) =>
                                            <NumericFormat
                                                {...field}
                                                defaultValue={valueToPay}
                                                value={valueToPay}
                                                disabled
                                                thousandSeparator={'.'}
                                                decimalSeparator={','}
                                                customInput={TextField}
                                                InputProps={valueProps}
                                                label="Valor a Pagar"

                                            />
                                        }
                                    />

                                </Box>
                            </FormControl>
                            <div className='flex justify-end mt-24'>
                                <a href='/aprovação' className='rounded p-3 uppercase text-white bg-grey h-[27px] min-h-[27px] font-medium px-10 mx-10'>
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