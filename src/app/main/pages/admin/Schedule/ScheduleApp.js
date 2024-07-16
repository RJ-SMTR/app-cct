import React, { useContext, useEffect, useRef, useState } from 'react'
import { Card, Select, TextField, Typography, MenuItem, InputLabel, InputAdornment, FormControlLabel } from '@mui/material';
import { Box } from '@mui/system';
import { Controller, useForm } from 'react-hook-form';
import { FormControl, Autocomplete } from "@mui/material";
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ptBR from 'date-fns/locale/pt-BR';
import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { getFavorecidos, setRelease } from 'app/store/releaseSlice';
import { useDispatch } from 'react-redux';
import { AuthContext } from 'src/app/auth/AuthContext';
import * as yup from 'yup';
import _ from '@lodash';
import { yupResolver } from '@hookform/resolvers/yup';
import { makeStyles } from '@mui/styles';
import { styling } from '../FinanRelease/customStyles';
import Checkbox from '@mui/material/Checkbox';


const schema = yup.object().shape({
    favorecido: yup.string().oneOf([
        'Auto-viação Norte',
        'Transoeste International'
    ]).required('Selecione um favorecido'),
    data_ordem: yup.date().required('Insira a data ordem de pagamento'),

});
function ScheduleApp() {
    const { success } = useContext(AuthContext)
    const dispatch = useDispatch()






    const { handleSubmit, register, control, reset, setValue, formState, clearErrors } = useForm({
        defaultValues: {
            favorecido: null,
            data_ordem: null,
            data_ordem_final: null,
            data_pagamento: null,
            recorrente: null
        },
        resolver: yupResolver(schema),
    })
    const { errors } = formState;



    const useStyles = makeStyles(() => ({
        glosa: styling,
    }));
    const c = useStyles()

    const onSubmit = (info) => {

        info.valor = info.valor_a_pagar
        dispatch(setRelease(info))
            .then((response) => {
                success(response, "Pagamento agendado")
                reset();



            })
            .catch((_errors) => {
                console.log(_errors)
            });

    }




    return (
        <>
            <div className="p-24 pt-10">
                <Typography className='font-medium text-3xl'>Agendamento de Pagamentos</Typography>
                <Box className='flex flex-col  justify-around'>
                    <Card className="w-full md:mx-9 p-24 relative mt-32">

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
                                                {...register('favorecido')}
                                                label='Selecionar Favorecido'
                                                id="bank-autocomplete"
                                                variant='outlined'
                                                name='favorecido'
                                                error={!!errors.favorecido}
                                                onChange={() => clearErrors('favorecido')}
                                                helperText={errors.favorecido?.message}

                                            />
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
                                                <DateTimePicker
                                                    label="Data Ordem de Pagamento Inicial"
                                                    renderInput={(params) => <TextField {...params} />}
                                                    {...field}
                                                    ampm={false}
                                                    error={!!errors.data_ordem}
                                                    helperText={errors.data_ordem?.message}
                                                />
                                            </LocalizationProvider>
                                        )}
                                    />

                                </FormControl>
                                <FormControl>

                                    <Controller
                                        {...register('data_ordem_final')}
                                        name="data_ordem_final"
                                        control={control}
                                        render={({ field }) => (
                                            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
                                                <DateTimePicker
                                                    label="Data Ordem de Pagamento Final"
                                                    renderInput={(params) => <TextField {...params} />}
                                                    {...field}
                                                    ampm={false}
                                                    error={!!errors.data_ordem_final}
                                                    helperText={errors.data_ordem_final?.message}
                                                />
                                            </LocalizationProvider>
                                        )}
                                    />

                                </FormControl>

                                <FormControl>
                                    <Controller
                                        {...register('data_pagamento')}
                                        name="data_pagamento"
                                        control={control}
                                        render={({ field }) => (
                                            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
                                                <DatePicker
                                                    label="Data Ordem de Pagamento"
                                                    renderInput={(params) => <TextField {...params} />}
                                                    {...field}
                                                    orientation="landscape"
                                                    ampm={false}
                                                    error={!!errors.data_pagamento}
                                                    helperText={errors.data_pagamento?.message}
                                                />
                                            </LocalizationProvider>
                                        )}
                                    />

                                </FormControl>
                             



                            </Box>
                            <FormControl className='mt-10 w-min '>
                                <FormControlLabel className='whitespace-nowrap' control={<Checkbox />} label="Pagamento recorrente" />
                            </FormControl>
                            <div className='flex justify-end mt-24'>
                                <a href='/admin' className='rounded p-3 uppercase text-white bg-grey h-[27px] min-h-[27px] font-medium px-10 mx-10'>
                                    Voltar
                                </a>
                                <button type='submit' className='rounded p-3 uppercase text-white bg-[#0DB1E3] h-[27px] min-h-[27px] font-medium px-10'>
                                    Agendar
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

export default ScheduleApp