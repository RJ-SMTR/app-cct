import React, { useContext, useEffect, useState } from 'react'
import { Card, Select, TextField, Typography, MenuItem, InputLabel, InputAdornment } from '@mui/material';
import { Box } from '@mui/system';
import { Controller, useForm } from 'react-hook-form';
import { FormControl } from "@mui/material";
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ptBR from 'date-fns/locale/pt-BR';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { NumericFormat } from 'react-number-format';
import { editRelease } from 'app/store/releaseSlice';
import { useDispatch } from 'react-redux';
import { AuthContext } from 'src/app/auth/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from 'app/configs/api/api';
import jwtServiceConfig from 'src/app/auth/services/jwtService/jwtServiceConfig';
import dayjs from 'dayjs';
import accounting from 'accounting';
import { showMessage } from 'app/store/fuse/messageSlice';



function FinanEdit() {

    const navigate = useNavigate()
    let { id } = useParams()
    const dispatch = useDispatch()
    const [showForm, setShowForm] = useState(false);
    const { success } = useContext(AuthContext)
    const [selectedMes, setSelectedMes] = useState()
    const [releaseData, setReleaseData] = useState([])
    const [valuesState, setValuesState] = useState({
        algoritmo: 0,
        glosa: 0,
        recurso: 0,
        anexo: 0,
    });
    const [valueToPay, setValueToPay] = useState();
    const [dateOrder, setDateOrder] = useState({
        month: null,
        period: null

    })
    const [year, setYear] = useState()




    useEffect(() => {
        const fetchData = async () => {
            const token = window.localStorage.getItem('jwt_access_token');
            const response = await api.get(jwtServiceConfig.finanGetInfo + `/${id}`, {
                headers: { "Authorization": `Bearer ${token}` },
            });
            setReleaseData(response.data)
            setShowForm(true)
            const dateString = response.data.data_ordem;
            const date = new Date(dateString);
            const month = date.getMonth();
            const day = date.getDate();
            const period = day > 15 ? 2 : 1;
            setDateOrder({
                month: month,
                period: period
            });
            setSelectedMes(month)
            setValueToPay(response.data.valor)
            setValuesState({
                algoritmo: response.data.algoritmo,
                glosa: response.data.glosa ,
                recurso: response.data.recurso,
                anexo: response.data.anexo
            })
        };
        fetchData()
    }, [id]);



    const { handleSubmit, register, setError, reset, control, setValue } = useForm({


    })


    const handleValueChange = (name, value) => {
        if (name === 'glosa') {
            value = value.startsWith('-') ? value : '-' + value;
        }
        setValuesState(prevState => ({
            ...prevState,
            [name]: accounting.formatMoney(value, {
                symbol: "R$ ",
                decimal: ",",
                thousand: ".",
                precision: 2
            })
        }));
    };

useEffect(() => {
    const sanitizedValuesState = Object.fromEntries(
        Object.entries(valuesState).map(([key, value]) => [key, value === 0 ? 0 : value])
    );

    if (sanitizedValuesState.algoritmo) {
        const algoritmoAmount = typeof sanitizedValuesState.algoritmo === 'string'
            ? accounting.unformat(sanitizedValuesState.algoritmo.replace(/\./g, '').replace('.', ','), ',')
            : sanitizedValuesState.algoritmo;

        const glosaAmount = typeof sanitizedValuesState.glosa === 'string'
            ? accounting.unformat(sanitizedValuesState.glosa.replace(/\./g, '').replace('.', ','), ',')
            : sanitizedValuesState.glosa;

        const recursoAmount = typeof sanitizedValuesState.recurso === 'string'
            ? accounting.unformat(sanitizedValuesState.recurso.replace(/\./g, '').replace('.', ','), ',')
            : sanitizedValuesState.recurso;

        const anexoAmount = typeof sanitizedValuesState.anexo === 'string'
            ? accounting.unformat(sanitizedValuesState.anexo.replace(/\./g, '').replace('.', ','), ',')
            : sanitizedValuesState.anexo;

        const valueToPayAuto = algoritmoAmount + glosaAmount + recursoAmount + anexoAmount;
        
        const formattedValue = accounting.formatMoney(valueToPayAuto, {
            symbol: "",
            decimal: ",",
            thousand: ".",
            precision: 2
        });

        setValueToPay(formattedValue);
    }
}, [valuesState]);







    const onSubmit = (info) => {
        info.id_cliente_favorecido = releaseData.clienteFavorecido.id
        info.algoritmo = valuesState.algoritmo
        info.recurso = valuesState.recurso
        info.glosa = valuesState.glosa
        info.anexo = valuesState.anexo
        info.valor = valueToPay
        dispatch(editRelease(info, id))
            .then((response) => {
                success(response, "Os dados foram atualizados!")
                reset(info)
            })
            .catch((error) => {
                console.error(error)
                dispatch(showMessage({ message: "Houve um erro ao tentar atualizar. Tente novamente mais tarde!"}))
            })
    }

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
    return (
        <>
            {showForm && <div className="p-24 pt-10">
                <Typography className='font-medium text-3xl'>Lançamentos Financeiros</Typography>
                <Box className='flex flex-col  justify-around'>
                    <Card className="w-full md:mx-9 p-24 relative mt-32">
                        <header className="flex justify-between items-center">
                            <h1 className="font-semibold">
                                Editar Registro
                            </h1>
                        </header>
                        <form
                            name="Personal"
                            noValidate
                            className="flex flex-col justify-center w-full mt-32"
                            onSubmit={handleSubmit(onSubmit)}
                        >
                            <Box className="grid gap-10  md:grid-cols-3">
                            <TextField
                                    {...register('favorecido')}
                                    label='Selecionar Favorecido'
                                    id="bank-autocomplete"
                                    variant='outlined'
                                    name='favorecido'
                                    disabled
                                    value={releaseData.clienteFavorecido.nome}

                                />
                                <FormControl fullWidth>
                                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
                                        <DatePicker {...register('ano')} onChange={(newValue) => setYear(newValue)} label={'Selecionar Ano'} openTo="year" views={['year']} />
                                    </LocalizationProvider>
                                </FormControl>
                                <FormControl fullWidth>
                                    <InputLabel id="select-mes">Selecionar Mês</InputLabel >
                                 
                                            <Select
                                            {...register('mes')}
                                                labelId="select-mes"
                                                label="Selecionar Mes"
                                                defaultValue={dateOrder.month}
                                                onChange={(e) => setSelectedMes(e.target.value)}

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
                                                name='periodo'
                                                labelId="select-periodo"
                                                label="Selecionar Período"
                                                defaultValue={dateOrder.period}
                                                onChange={(e) => setDateFunction(e.target.value)}
                                            >
                                                <MenuItem value={1}>1a Quinzena</MenuItem>
                                                <MenuItem value={2}>2a Quinzena</MenuItem>
                                            </Select>

                                </FormControl>
                              

                                <FormControl>
                                    <Controller
                                        {...register('data_ordem')}
                                        name="data_ordem"
                                        defaultValue={dayjs(releaseData.data_ordem).toDate()}
                                        control={control}
                                        render={({ field }) =>
                                            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
                                                <DatePicker
                                                    label="Data Ordem de Pagamento"
                                                    renderInput={(params) =>
                                                        <TextField
                                                            {...params}
                                                        />}
                                                    {...field}
                                                />
                                            </LocalizationProvider>
                                        }
                                    />

                                </FormControl>
                                <TextField
                                    {...register('numero_processo')}
                                    label="Número do Processo"
                                    type="string"
                                    name='numero_processo'
                                    variant="outlined"
                                    fullWidth
                                    defaultValue={releaseData.numero_processo}

                                />
                                <Controller
                                    {...register('algoritmo')}
                                    name="algoritmo"
                                    control={control}
                                    render={({ field }) =>
                                        <NumericFormat
                                            {...field}
                                            defaultValue={releaseData.algoritmo}
                                            labelId="algoritmo-label"
                                            thousandSeparator={'.'}
                                            decimalSeparator={','}
                                            fixedDecimalScale
                                            decimalScale={2}
                                            label="Algortimo"
                                            customInput={TextField}
                                            InputProps={valueProps}
                                            onValueChange={(values, sourceInfo) => {
                                                if (sourceInfo.event !== undefined && sourceInfo.event.target.value !== '') {
                                                    const { name } = sourceInfo.event.target;
                                                    handleValueChange(name, values.value);
                                                }
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
                                            defaultValue={releaseData.glosa}
                                            className='glosa'
                                            fixedDecimalScale
                                            prefix='-'

                                            decimalScale={2}
                                            decimalSeparator={','}
                                            customInput={TextField}
                                            InputProps={valueProps}
                                            onValueChange={(values, sourceInfo) => {

                                                if (sourceInfo && sourceInfo.event && sourceInfo.event.target) {

                                                    const { name } = sourceInfo.event.target;
                                                    handleValueChange(name, values.value);
                                                }
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
                                            allowNegative
                                            fixedDecimalScale
                                            decimalScale={2}
                                            label="Recurso"
                                            defaultValue={releaseData.recurso}
                                            customInput={TextField}
                                            InputProps={{
                                                ...valueProps,
                                                className: valuesState.recurso < 0 ? "glosa" : ""
                                            }}
                                            onValueChange={(values, sourceInfo) => {

                                                if (sourceInfo && sourceInfo.event && sourceInfo.event.target) {

                                                    const { name } = sourceInfo.event.target;
                                                    handleValueChange(name, values.value);
                                                }
                                            }}
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
                                                allowNegative
                                                fixedDecimalScale
                                                decimalScale={2}
                                                label="Anexo III"
                                                defaultValue={releaseData.anexo}
                                                customInput={TextField}
                                                InputProps={{
                                                    ...valueProps,
                                                    className: valuesState.anexo < 0 ? "glosa" : ""
                                                }}
                                                onValueChange={(values, sourceInfo) => {

                                                    if (sourceInfo && sourceInfo.event && sourceInfo.event.target) {

                                                        const { name } = sourceInfo.event.target;
                                                        handleValueChange(name, values.value);
                                                    }
                                                }}
                                            />
                                        }
                                    />

                                    <Controller
                                        {...register('valor')}
                                        name="valor"
                                        control={control}
                                        render={({ field }) =>
                                            <NumericFormat
                                                {...field}
                                                value={valueToPay}
                                                defaultValue={valueToPay}
                                                disabled
                                                thousandSeparator={'.'}
                                                fixedDecimalScale
                                                decimalScale={2}
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
                                <a onClick={() => navigate(-1)} className='rounded p-3 uppercase text-white bg-grey h-[27px] min-h-[27px] font-medium px-10 mx-10'>
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
            </div>}
        </>
    );
}

export default FinanEdit