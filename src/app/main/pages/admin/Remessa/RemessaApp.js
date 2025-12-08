import React, { useContext, useEffect, useRef, useState } from 'react'
import { getUser } from 'app/store/adminSlice';
import { Card, Select, TextField, Typography, MenuItem, InputLabel, InputAdornment } from '@mui/material';
import { Box } from '@mui/system';
import { Controller, useForm } from 'react-hook-form';
import { FormControl, Autocomplete } from "@mui/material";
import { DatePicker } from 'rsuite';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ptBR from 'date-fns/locale/pt-BR';
import { NumericFormat } from 'react-number-format';
import { showMessage } from 'app/store/fuse/messageSlice';
import { useDispatch, useSelector } from 'react-redux';
import { AuthContext } from 'src/app/auth/AuthContext';

import _ from '@lodash';

import { bookPayment, getBookings } from 'app/store/automationSlice';
import { TableRemessa } from './components/TableRemessa';



function RemessaApp() {
  const userList = useSelector(state => state.admin.userList) || []
  const [isLoading, setIsLoading] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [userOptions, setUserOptions] = useState([])
  const [selected, setSelected] = useState(null)
  const [selectedConsorcios, setSelectedConsorcios] = useState([]);

  const [selectedWeekdays, setSelectedWeekDays] = useState([])


  const weekdays = [
    { label: 'Segunda-feira', value: 1 },
    { label: 'Terça-feira', value: 2 },
    { label: 'Quarta-feira', value: 3 },
    { label: 'Quinta-feira', value: 4 },
    { label: 'Sexta-feira', value: 5 },

  ];



  const consorcios = [
    { label: 'Todos', value: [2079, 2078, 2081, 2082, 2199, 2198, 2080, 2077, 2200] },
    { label: 'Internorte', value: 2079 },
    { label: 'Intersul', value: 2078 },
    { label: 'MobiRio', value: 2081 },
    { label: 'Santa Cruz', value: 2082 },
    { label: 'STPC', value: 2199, disabled: selected === 'name' ? true : false },
    { label: 'STPL', value: 2198, disabled: selected === 'name' ? true : false },
    { label: 'Transcarioca', value: 2080 },
    { label: 'VLT', value: 2077 },
    { label: 'TEC', value: 2200, disabled: selected === 'name' ? true : false }

  ];


  const { reset, handleSubmit, setValue, control, getValues, watch, trigger, clearErrors } = useForm({
    defaultValues: {
      name: [],
      consorcioName: []
    }

  });
  const dispatch = useDispatch()

  const fetchUsers = async () => {
    setLoadingUsers(true);
    dispatch(getUser());
    setLoadingUsers(false);
  };

  useEffect(() => {
    fetchUsers()
    dispatch(getBookings())
  }, []);
  
  useEffect(() => {
    if (userList && userList.length > 0) {
      const options = userList.map((user) => ({
        label: user.label,
        value: {
          cpfCnpj: user.cpfCnpj,
          permitCode: user.permitCode,
          fullName: user.fullName,
          userId: user.id

        }
      }));
      const sortedOptions = options.sort((a, b) => {

        return a.value.fullName.localeCompare(b.value.fullName);


      });

      setUserOptions([{ label: "Todos", value: { fullName: 'Todos' } }, ...sortedOptions]);
    } else {
      setUserOptions([]);
    }
  }, [userList]);


  const handleSelection = (field, newValue) => {
    setSelected(newValue?.length > 0 ? field : null);
    if (field === 'consorcioName') {
      const hasTodos = Array.isArray(newValue) && newValue.some((o) => o.label === 'Todos');
      if (hasTodos) {
        const allWithoutTodos = consorcios.filter((o) => o.label !== 'Todos');
        setSelectedConsorcios(allWithoutTodos);
        const allIds = consorcios
          .filter((o) => o.label !== 'Todos')
          .map((o) => o.value)
          .flat();
        setValue('consorcioName', [...new Set(allIds)]);
        return;
      }
      setSelectedConsorcios(newValue);
    }
    if (field === 'tipoPagamento') {
      const nextTipo = newValue?.label || '';

      setValue(field, nextTipo);
      setSelectedWeekDays(nextTipo);
      if (nextTipo === 'Único') {

        setValue('intervaloDias', '');
        setValue('diaSemana', '');
        setValue('weekdays', []);
        setValue('horario', '');
      } else if (nextTipo === 'Recorrente') {

        setValue('valorPagamentoUnico', '');
        setValue('dataPagamentoUnico', '');
        setValue('motivoPagamentoUnico', '');
        setValue('horario', '');
      }
      return;
    }
    handleAutocompleteChange(field, newValue);
  };


  const handleAutocompleteChange = (field, newValue) => {
    if (Array.isArray(newValue)) {
      if (field === 'consorcioName') {
        const ids = newValue
          .map((item) => item.value)
          .reduce((acc, v) => acc.concat(v), []);
        const uniqueIds = [...new Set(ids)];
        setValue(field, uniqueIds);
      } else {
        setValue(field, newValue.map(item => item.value.userId));
      }
    } else {
      setValue(field, newValue ? (newValue.value ?? newValue.label) : '');
      if (field === 'tipoPagamento') {
        setSelectedWeekDays(newValue?.label)
      }
    }
  };

  const onSubmit = (data) => {
    const hasNameOrConsorcio = Array.isArray(data.name) && data.name.length > 0 || Array.isArray(data.consorcioName) && data.consorcioName.length > 0;
    const tipoPagamento = getValues('tipoPagamento');
    const aprovacao = getValues('aprovacao');

    if (!hasNameOrConsorcio) {
      dispatch(showMessage({ message: 'Erro: selecione favorecidos ou consórcios.' }));
      return;
    }

    if (!tipoPagamento) {
      dispatch(showMessage({ message: 'Erro: selecione o Tipo de Pagamento.' }));
      return;
    }

    if (!aprovacao) {
      dispatch(showMessage({ message: 'Erro: selecione o Status de Aprovação.' }));
      return;
    }

    if (tipoPagamento === 'Único') {
      const valor = getValues('valorPagamentoUnico');
      const dataUnica = getValues('dataPagamentoUnico');
      const horario = getValues('horario');


      if (!valor || String(valor).trim() === '') {
        dispatch(showMessage({ message: 'Erro: informe o Valor a ser pago.' }));
        return;
      }
      if (!dataUnica) {
        dispatch(showMessage({ message: 'Erro: informe a Data de Pagamento.' }));
        return;
      }
      if (!horario) {
        dispatch(showMessage({ message: 'Erro: informe o Horário.' }));
        return;
      }
    } else if (tipoPagamento === 'Recorrente') {
      const intervalo = getValues('intervaloDias');
      const diaSemana = getValues('diaSemana');
      const weekdaysSel = getValues('weekdays');
      const horario = getValues('horario');

      if (!intervalo && !diaSemana || String(intervalo).trim() === '' && !diaSemana) {
        dispatch(showMessage({ message: 'Erro: informe o intervalo de dias (Pagar a cada).' }));
        return;
      }
      if (!diaSemana && !intervalo) {
        dispatch(showMessage({ message: 'Erro: selecione o dia da semana (Agendado Para).' }));
        return;
      }
      if (!Array.isArray(weekdaysSel) || weekdaysSel.length === 0) {
        dispatch(showMessage({ message: 'Erro: selecione ao menos um dia em "Dias a serem pagos".' }));
        return;
      }
      if (!horario) {
        dispatch(showMessage({ message: 'Erro: informe o Horário.' }));
        return;
      }
    }

    setIsLoading(true);
    dispatch(bookPayment(data))
      .then(() => {
        setIsLoading(false);
      })
      .catch(() => {
        dispatch(showMessage({ message: 'Erro no agendamento, verifique os campos e tente novamente.' }));
        setIsLoading(false);
      });
  };

  const handleValueChange = (name, value) => {
    console.log(name, value)
  };

  const valueProps = {
    endAdornment: <InputAdornment position='end'>Dias</InputAdornment>
  }
  const valuePropsValor = {
    startAdornment: <InputAdornment position='start'>R$</InputAdornment>
  }


  return (
    <>
      <div className="p-24 pt-10">
        <Typography className='font-medium text-3xl'>Agendar Remessa</Typography>
        <Box className='flex flex-col  justify-around'>
          <Card className="w-full md:mx-9 p-24 relative mt-32">
            <header className="flex justify-between items-center">
              <h2 className="font-semibold">
                Novo Agendamento
              </h2>
            </header>
            <form
              name="Personal"
              noValidate
              className="flex flex-col justify-center w-full mt-32"
              onSubmit={handleSubmit(onSubmit)}
            >
              <Box className="flex gap-10 flex-wrap mb-20">


                <Autocomplete
                  id="favorecidos"
                  multiple
                  className="w-[25rem] md:min-w-[25rem] md:w-auto p-1"
                  getOptionLabel={(option) => option.value.fullName}
                  filterSelectedOptions
                  options={userOptions}
                  filterOptions={(options, state) =>
                    options.filter((option) =>
                      option.value?.cpfCnpj?.includes(state.inputValue) ||
                      option.value?.permitCode?.includes(state.inputValue) ||
                      option.value?.fullName?.toLowerCase().includes(state.inputValue.toLowerCase())
                    )
                  }
                  loading={loadingUsers}
                  onChange={(_, newValue) => handleSelection('name', newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Selecionar Favorecido"
                      variant="outlined"
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loadingUsers ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />


                <Autocomplete
                  id="consorcio"
                  multiple
                  className="w-[25rem] md:min-w-[25rem] md:w-auto p-1"
                  getOptionLabel={(option) => option.label}
                  filterSelectedOptions
                  options={consorcios}
                  value={selectedConsorcios}
                  getOptionDisabled={(option) => option.disabled}
                  isOptionEqualToValue={(option, value) => option.value === value.value}
                  onChange={(_, newValue) => handleSelection('consorcioName', newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Selecionar Consórcios"
                      variant="outlined"
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: <>{params.InputProps.endAdornment}</>,
                      }}
                    />
                  )}
                />




              </Box>
              <Box className="flex gap-10 flex-wrap mb-20">
                <Autocomplete
                  id="tipoPagamento"
                  className="w-[25rem] md:min-w-[25rem] md:w-auto p-1"
                  getOptionLabel={(option) => option.label}
                  filterSelectedOptions
                  options={[
                    { label: 'Recorrente' },
                    { label: 'Único' }
                  ]}

                  onChange={(_, newValue) => handleSelection('tipoPagamento', newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Tipo Pagamento"
                      variant="outlined"
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: <>{params.InputProps.endAdornment}</>,
                      }}
                    />
                  )}
                />
                <Autocomplete
                  id="account"
                  className="w-[25rem] md:min-w-[25rem] md:w-auto p-1"
                  getOptionLabel={(option) => option.label}
                  filterSelectedOptions
                  options={[
                    { label: 'CETT' },
                    { label: 'CB' }
                  ]}

                  onChange={(_, newValue) => handleSelection('account', newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Conta Pagadora"
                      variant="outlined"
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: <>{params.InputProps.endAdornment}</>,
                      }}
                    />
                  )}
                />
                <Autocomplete
                  id="aprovacao"
                  className="w-[25rem] md:min-w-[25rem] md:w-auto p-1"
                  getOptionLabel={(option) => option.label}
                  filterSelectedOptions
                  options={[
                    { label: 'Necessita Aprovação' },
                    { label: 'Livre de Aprovação' }
                  ]}
                  onChange={(_, newValue) => handleSelection('aprovacao', newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Aprovação pagamento"
                      variant="outlined"
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: <>{params.InputProps.endAdornment}</>,
                      }}
                    />
                  )}
                />
              </Box>
              {selectedWeekdays?.includes('Único') ?
                <Box className="flex gap-10 flex-wrap mb-20">
                  <Controller
                    name="valorPagamentoUnico"
                    control={control}
                    render={({ field }) =>
                      <NumericFormat
                        {...field}
                        labelId="algoritmo-label"
                        thousandSeparator={'.'}
                        decimalSeparator={','}
                        className="w-[25rem] md:min-w-[25rem] md:w-auto p-1"
                        fixedDecimalScale
                        decimalScale={2}
                        label="Valor a ser pago"
                        customInput={TextField}
                        InputProps={valuePropsValor}
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
                    name="dataPagamentoUnico"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        {...field}
                        id="custom-date-input"
                        showOneCalendar
                        showHeader={false}
                        placement="auto"
                        placeholder="Selecionar Data"
                        format="dd/MM/yy"
                        character=" - "
                        className="custom-date-range-picker"
                      />)}
                  />

                  <TextField
                    id="motivoPagamentoUnico"
                    label="Motivo Pagamento"
                    variant="outlined"
                    className="w-[25rem] md:min-w-[25rem] md:w-auto p-1"
                    onChange={(e) => setValue('reason', e.target.value)}
                  />

                </Box>
                : selectedWeekdays?.includes('Recorrente') ?
                  <Box className="flex gap-10 flex-wrap mb-20">
                    <Controller
                      name="intervaloDias"
                      control={control}
                      render={({ field }) =>
                        <NumericFormat
                          {...field}
                          labelId="algoritmo-label"
                          className="w-[25rem] md:min-w-[25rem] md:w-auto p-1"
                          label="Pagar a cada"
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
                    <Autocomplete
                      id="diaSemana"
                      className="w-[25rem] md:min-w-[25rem] md:w-auto p-1"
                      getOptionLabel={(option) => option.label}
                      options={weekdays}
                      onChange={(_, newValue) => handleSelection('diaSemana', newValue)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Agendado Para"
                          variant="outlined"
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: <>{params.InputProps.endAdornment}</>,
                          }}
                        />
                      )}
                    />

                    <Box>
                      <p className='text-[rgba(0, 0, 0, 0.54)]'>Dias a serem pagos</p>
                      <Controller
                        name="weekdays"
                        control={control}
                        defaultValue={[]}
                        render={({ field }) => (
                          <Box display="flex" gap={1}>
                            {[
                              { label: "Dom", value: "0" },
                              { label: "Seg", value: "1" },
                              { label: "Ter", value: "2" },
                              { label: "Qua", value: "3" },
                              { label: "Qui", value: "4" },
                              { label: "Sex", value: "5" },
                              { label: "Sab", value: "6" },
                            ].map((day) => {
                              const isSelected = field.value.includes(day.value);
                              const selectedDia = watch('diaSemana');
                              const selectedDiaJS = (
                                selectedDia === '' || selectedDia === null || selectedDia === undefined
                                  ? null
                                  : (typeof selectedDia === 'number' && selectedDia >= 1 && selectedDia <= 7)
                                      ? (selectedDia % 7)
                                      : (Number.isFinite(Number(selectedDia)) ? Number(selectedDia) : null)
                              );
                              const isDisabled = selectedDiaJS !== null && Number(day.value) === selectedDiaJS;
                              return (
                                <Box
                                  key={day.value}
                                  onClick={() => {
                                    if (isDisabled) return;
                                    const newValue = isSelected
                                      ? field.value.filter((v) => v !== day.value)
                                      : [...field.value, day.value];
                                    field.onChange(newValue);
                                  }}
                                  sx={{
                                    borderRadius: "6px",
                                    backgroundColor: isDisabled ? '#bbb' : (isSelected ? "#2AD705" : "#ddd"),
                                    color: isDisabled ? '#666' : (isSelected ? "#fff" : "#000"),
                                    height: 40,
                                    width: 40,
                                    lineHeight: "40px",
                                    textAlign: "center",
                                    cursor: isDisabled ? 'not-allowed' : "pointer",
                                    userSelect: "none",
                                    opacity: isDisabled ? 0.7 : 1,
                                  }}
                                >
                                  {day.label}
                                </Box>
                              );
                            })}
                          </Box>
                        )}
                      />
                    </Box>



                    <Controller
                      name="horario"
                      control={control}
                      render={({ field }) => (
                        <DatePicker
                          {...field}
                          id="custom-date-input"
                          showOneCalendar
                          showHeader={false}
                          placement="auto"
                          placeholder="Selecionar Horário"
                          format="HH:mm"
                          character=" - "
                          className="custom-date-range-picker"
                        />)}
                    />
                  </Box>

                  : <></>}


              <div className='flex justify-end mt-24'>
                <button type='submit' className='rounded p-3 uppercase text-white bg-[#0DB1E3] h-[27px] min-h-[27px] font-medium px-10'>
                  Agendar
                </button>
              </div>


            </form>

          </Card>
        </Box>
        <br />
      </div>
      <div className="p-1 pt-10">
        <Box className='flex flex-col  justify-around w-full md:mx-9 p-24 relative mt-16'>
          <Card className="w-full md:mx-9 p-24 relative mt-16">
            <header className="flex justify-between items-center mb-24">
              <h3 className="font-semibold">
                Agendamentos
              </h3>
            </header>
            <TableRemessa />

          </Card>
        </Box>
        <br />
      </div>
    </>
  );
}

export default RemessaApp