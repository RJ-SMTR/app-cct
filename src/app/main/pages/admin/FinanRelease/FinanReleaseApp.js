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
import { getFavorecidos, setRelease, setSelectedYear } from 'app/store/releaseSlice';
import { useDispatch, useSelector } from 'react-redux';
import { AuthContext } from 'src/app/auth/AuthContext';
import dayjs from 'dayjs';
import * as yup from 'yup';
import _ from '@lodash';
import { yupResolver } from '@hookform/resolvers/yup';
import { makeStyles } from '@mui/styles';
import { styling } from './customStyles';
import accounting from 'accounting';


const schema = yup.object().shape({
    descricao: yup.string().required('Selecione um favorecido'),
    mes: yup.string().required('Selecione um mês'),
    periodo: yup.string().required('Selecione uma quinzena'),
    data_ordem: yup.date().required('Insira a data ordem de pagamento'),
    numero_processo: yup.string().required('Insira o número de processo'),
    algoritmo: yup.string().required('Insira o valor do algoritmo'),
    glosa: yup.string().notRequired('Campo opcional: se não houver valor digite 0'),
    recurso: yup.string().notRequired('Campo opcional: se não houver valor digite 0'),
    anexo: yup.string().notRequired('Campo opcional: se não houver valor digite 0'),
    valor_a_pagar: yup.string()
        .test('is-not-negative', 'Valor a pagar não pode ser negativo', value => {
            if (value && value.includes('-')) {
                return false;
            }
            return true;
        })
        .required('Valor a pagar não pode estar vazio')
});
function FinanRelease() {
    const { success } = useContext(AuthContext)
    const dispatch = useDispatch()
    const [valuesState, setValuesState] = useState({
        algoritmo: 0,
        glosa: 0,
        recurso: 0,
        anexo: 0,
    });
    const [selectedMes, setSelectedMes] = useState()
    const clientesFavorecidos = useSelector(state => state.release.clientesFavorecidos)



    useEffect(() => {
        dispatch(getFavorecidos())
    }, [])
   

    const { handleSubmit, register, control, reset, setValue, formState, clearErrors } = useForm({
        defaultValues: {
            descricao: null,
            favorecido: null,
            mes: '',
            periodo: '',
            numero_processo: null,
            algoritmo: '',
            glosa: '',
            recurso: '',
            anexo: '',
            data_ordem: null,
            valor_a_pagar: '',
            ano: ''
        },
        resolver: yupResolver(schema),
    })
    const { errors } = formState;
    const handleValueChange = (name, value) => {
        setValuesState(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleYearChange = (newValue) => {
        dispatch(setSelectedYear(newValue));
    };


    const useStyles = makeStyles(() => ({
        glosa: styling,
    }));
    const c = useStyles()

    const onSubmit = (info) => {

        info.valor = info.valor_a_pagar
        dispatch(setRelease(info))
            .then((response) => {
                success(response, "Informações Lançadas!")
                reset();
                setValue('valor_a_pagar', '')
                setValue('algoritmo', '')
                setValue('mes', '')
                setValue('periodo', '')
                setValue('recurso', '')
                setValue('anexo', '')
                setValue('glosa', '')
                setValue('ano', '')


            })
            .catch((_errors) => {
                console.log(_errors)
            });

    }


    useEffect(() => {

        
        const sanitizedValuesState = Object.fromEntries(
            Object.entries(valuesState).map(([key, value]) => [key, value === '' ? 0 : value])
        );
        if (sanitizedValuesState.algoritmo) {
            const valueToPayAuto = parseFloat(sanitizedValuesState.algoritmo) - parseFloat(sanitizedValuesState.glosa) + parseFloat(sanitizedValuesState.recurso) + parseFloat(sanitizedValuesState.anexo)
        
            const formattedValue = accounting.formatMoney(valueToPayAuto, {
                symbol: "",
                decimal: ",",
                thousand: ".",
                precision: 2
            });
            setValue('valor_a_pagar', formattedValue)
            clearErrors('valor_a_pagar')
        }
    }, [valuesState])

    const setDateFunction = (event) => {
        if (event == 1) {
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
    const valuePropsGlosa = {
        startAdornment: <InputAdornment position='start'>R$</InputAdornment>,
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
                                        getOptionLabel={(option) => option.nome}
                                        options={clientesFavorecidos}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                {...register('descricao')}
                                                label='Selecionar Favorecido'
                                                id="bank-autocomplete"
                                                variant='outlined'
                                                name='descricao'
                                                error={!!errors.descricao}
                                                onChange={() => clearErrors('descricao')}
                                                helperText={errors.descricao?.message}

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
                                                value={field.value}
                                                onChange={(e) => {
                                                    setValue('mes', e.target.value)
                                                    setSelectedMes(e.target.value);
                                                    const isMonthSelected = !!e.target.value;
                                                    document.getElementById('select-periodo').disabled = !isMonthSelected;
                                                    clearErrors('mes')
                                                }}
                                                error={!!errors.mes}
                                                helperText={errors.mes?.message}
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
                                    <InputLabel id="select-periodo">Selecionar Período (selecionar mês antes)</InputLabel>
                                    <Controller
                                        {...register('periodo')}
                                        name='periodo'
                                        control={control}
                                        render={({ field }) => (
                                            <Select
                                                labelId="select-periodo"
                                                label="Selecionar Período (selecionar mês antes)"
                                                id="select-periodo"
                                                disabled={!selectedMes}
                                                value={field.value}
                                                onChange={(e) => {
                                                    setValue('periodo', e.target.value)
                                                    setDateFunction(e.target.value)
                                                    clearErrors('periodo')
                                                }}
                                                error={!!errors.periodo}
                                                helperText={errors.periodo?.message}
                                            >
                                                <MenuItem value={1}>1a Quinzena</MenuItem>
                                                <MenuItem value={2}>2a Quinzena</MenuItem>
                                            </Select>
                                        )}
                                    />
                                </FormControl>
                                <FormControl fullWidth>
                                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>

                                        <DatePicker {...register('ano')} onChange={handleYearChange} label={'Selecionar Ano'} openTo="year" views={['year']} />

                                    </LocalizationProvider>
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
                                                    error={!!errors.data_ordem}
                                                    helperText={errors.data_ordem?.message}
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
                                        error={!!errors.numero_processo}
                                        helperText={errors.numero_processo?.message}
                                    />
                                </FormControl>

                                <Controller
                                    {...register('algoritmo')}
                                    name="algoritmo"
                                    control={control}
                                    render={({ field }) =>
                                        <NumericFormat
                                            {...field}
                                            value={field.value}
                                            labelId="algoritmo-label"
                                            thousandSeparator={'.'}
                                            decimalSeparator={','}
                                            decimalScale={2}
                                            fixedDecimalScale
                                            label="Algortimo"
                                            customInput={TextField}
                                            InputProps={valueProps}
                                            onValueChange={(values, sourceInfo) => {
                                                if (sourceInfo && sourceInfo.event && sourceInfo.event.target) {
                                                    const { name } = sourceInfo.event.target;
                                                    handleValueChange(name, values.value);
                                                }
                                            }}

                                            error={!!errors.algoritmo}
                                            helperText={errors.algoritmo?.message}
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
                                            prefix='-'
                                            value={field.value}
                                            className={c.glosa}
                                            decimalSeparator={','}
                                            fixedDecimalScale
                                            decimalScale={2}
                                            customInput={TextField}
                                            InputProps={{
                                                ...valuePropsGlosa,
                                            }}

                                            onValueChange={(values, sourceInfo) => {
                                                if (sourceInfo && sourceInfo.event && sourceInfo.event.target) {
                                                    const { name } = sourceInfo.event.target;
                                                    handleValueChange(name, values.value);
                                                }
                                            }}
                                            error={!!errors.glosa}
                                            helperText={errors.glosa?.message}
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
                                            decimalScale={2}
                                            label="Recurso"
                                            fixedDecimalScale
                                            customInput={TextField}
                                            value={field.value}
                                            InputProps={{
                                                ...valueProps,
                                                className: valuesState.recurso < 0 ? c.glosa : ""
                                            }}

                                            onValueChange={(values, sourceInfo) => {
                                                if (sourceInfo && sourceInfo.event && sourceInfo.event.target) {
                                                    const { name } = sourceInfo.event.target;
                                                    handleValueChange(name, values.value);
                                                }
                                            }}
                                            error={!!errors.recurso}
                                            helperText={errors.recurso?.message}
                                        />
                                    }
                                />


                            </Box>
                            <FormControl>

                                 
                                  
                                 


                                <Box className="grid md:grid-cols-3 gap-10 mt-10">
                                    <Controller
                                        {...register('anexo')}
                                        name="anexo"
                                        control={control}
                                        render={({ field }) =>
                                            <NumericFormat
                                                {...field}
                                                thousandSeparator={'.'}
                                                decimalSeparator={','}
                                                decimalScale={2}
                                                label="Anexo III"
                                                fixedDecimalScale
                                                customInput={TextField}
                                                value={field.value}
                                                InputProps={{
                                                    ...valueProps,
                                                    className: valuesState.anexo < 0 ? c.glosa : ""
                                                }}

                                                onValueChange={(values, sourceInfo) => {
                                                    if (sourceInfo && sourceInfo.event && sourceInfo.event.target) {
                                                        const { name } = sourceInfo.event.target;
                                                        handleValueChange(name, values.value);
                                                    }
                                                }}
                                                error={!!errors.anexo}
                                                helperText={errors.anexo?.message}
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
                                                value={field.value}
                                                disabled
                                                thousandSeparator={'.'}
                                                decimalSeparator={','}
                                                fixedDecimalScale
                                                decimalScale={2}
                                                customInput={TextField}
                                                InputProps={valueProps}
                                                label="Valor a Pagar"
                                                error={!!errors.valor_a_pagar}
                                                helperText={errors.valor_a_pagar?.message}

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