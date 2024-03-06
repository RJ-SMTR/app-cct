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
import { useParams } from 'react-router-dom';
import { api } from 'app/configs/api/api';
import jwtServiceConfig from 'src/app/auth/services/jwtService/jwtServiceConfig';
import dayjs from 'dayjs';




function FinanEdit() {
    let {id} = useParams()
    const [showForm, setShowForm] = useState(false);
    const { success } = useContext(AuthContext)
    const [dateOrder, setDateOrder] = useState({
        month: null,
        period: null

    })
    const [releaseData, setReleaseData] = useState([])
    const dispatch = useDispatch()
    const [values, setValues] = useState({
        periodo: null,
        algoritmo: null,
        glosa: null,
        valor_a_pagar: null,
    });

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
            const month = date.getMonth() + 1; 
            const day = date.getDate();
            const period = day > 15 ? 2 : 1;
            setDateOrder({
                month: month,
                period: period
            });
            console.log(response.data)
        };
        fetchData()
    }, [id]);
 
    const { handleSubmit, register, setError, reset, clearErrors, setValue } = useForm({
        defaultValues: {
            descricao: releaseData.descricao
        }

    })

    const NumericFormatCustom = React.forwardRef(
        function NumericFormatCustom(props, ref) {
            const { onChange, ...other } = props;

            return (
                <NumericFormat
                    {...other}
                    getInputRef={ref}
                    thousandSeparator={'.'}
                    decimalSeparator={','}

                />
            );
        },
    );
    const handleChange = (event) => {
        const { name, value } = event.target;
        const numericValue = parseInt(value.replace(/\D/g, ''));
        setValues({
            ...values,
            [name]: numericValue,
        });
    };
    const onSubmit = (info) => {
        dispatch(editRelease(info, id))
            .then((response) => {
                success(response, "Os dados foram atualizados!")
                reset(info)
            })
    }
    


    return (
        <>
            {showForm && <div className="p-24 pt-10">
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
                                <TextField
                                    {...register('descricao')}
                                    label='Selecionar Favorecido'
                                    id="bank-autocomplete"
                                    variant='outlined'
                                    name='descricao'
                                    disabled
                                    value={releaseData.descricao}

                                />
                                <FormControl fullWidth>
                                    <InputLabel id="select-mes">Selecionar Mês</InputLabel >
                                    <Select
                                        {...register('mes')}
                                        labelId="select-mes"
                                        id="select-mes"
                                        label="Selecionar Mes"
                                        name='mes'
                                        defaultValue={dateOrder.month}
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
                                        name='periodo'
                                        value={dateOrder.period}
                                    >
                                        <MenuItem value={1}>1a Quinzena</MenuItem>
                                        <MenuItem value={2}>2a Quinzena</MenuItem>
                                    </Select>
                                </FormControl>
                                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR} >
                                    <DatePicker label="Data Ordem de Pagamento" defaultValue={dayjs(releaseData.data_ordem).toDate()} />
                                </LocalizationProvider>
                                <TextField
                                    {...register('numero_processo')}
                                    label="Número do Processo"
                                    type="string"
                                    name='numero_processo'
                                    variant="outlined"
                                    fullWidth
                                    value={releaseData.numero_processo}
                                />

                            </Box>
                            <FormControl>
                                <Box className="grid md:grid-cols-3 gap-10 mt-10">
                                    <TextField
                                        {...register('algoritmo')}
                                        label="Valor Algoritmo"
                                        value={releaseData.algoritmo}
                                        onChange={handleChange}
                                        name="algoritmo"
                                        InputProps={{
                                            inputComponent: NumericFormatCustom,
                                            startAdornment: <InputAdornment position='start'>R$</InputAdornment>,
                                        }}
                                    />
                                    <TextField
                                        {...register('glosa')}
                                        label="Valor Glosa"
                                        value={releaseData.glosa}
                                        onChange={handleChange}
                                        name="glosa"
                                        InputProps={{
                                            inputComponent: NumericFormatCustom,
                                            startAdornment: <InputAdornment position='start'>R$</InputAdornment>,
                                        }}
                                    />


                                </Box>
                                <Box className="grid md:grid-cols-3 gap-10  mt-10">
                                    <TextField
                                        {...register('recurso')}
                                        label="Valor Recurso"
                                        value={releaseData.recurso}
                                        onChange={handleChange}
                                        name="recurso"
                                        InputProps={{
                                            inputComponent: NumericFormatCustom,
                                            startAdornment: <InputAdornment position='start'>R$</InputAdornment>,
                                        }}
                                    />
                                    <TextField
                                        {...register('valor_a_pagar')}
                                        label="Valor a Pagar"
                                        value={releaseData.valor_a_pagar}
                                        onChange={handleChange}
                                        name="valor_a_pagar"
                                        InputProps={{
                                            inputComponent: NumericFormatCustom,
                                            startAdornment: <InputAdornment position='start'>R$</InputAdornment>,
                                        }}
                                    />


                                </Box>
                            </FormControl>
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
            </div>}
        </>
    );
}

export default FinanEdit