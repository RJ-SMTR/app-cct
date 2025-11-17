import React, { useContext, useEffect, useRef, useState } from 'react'
import { getUser } from 'app/store/adminSlice';
import { Card, Select, TextField, Typography, MenuItem, InputLabel, InputAdornment } from '@mui/material';
import { Box } from '@mui/system';
import { Controller, useForm } from 'react-hook-form';
import { FormControl, Autocomplete } from "@mui/material";
import {DatePicker} from 'rsuite';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ptBR from 'date-fns/locale/pt-BR';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { NumericFormat } from 'react-number-format';
import { showMessage } from 'app/store/fuse/messageSlice';
import { useDispatch, useSelector } from 'react-redux';
import { AuthContext } from 'src/app/auth/AuthContext';
import dayjs from 'dayjs';
import * as yup from 'yup';
import _ from '@lodash';
import { yupResolver } from '@hookform/resolvers/yup';
import { makeStyles } from '@mui/styles';
// import { styling } from './customStyles';
import accounting from 'accounting';
import { bookPayment, getBookings } from 'app/store/automationSlice';
import { TableRemessa } from './components/TableRemessa';



function RemessaApp() {
    const userList = useSelector(state => state.admin.userList) || []
    const [isLoading, setIsLoading] = useState(false)
    const [loadingUsers, setLoadingUsers] = useState(false)
    const [userOptions, setUserOptions] = useState([])
    const [anchorEl, setAnchorEl] = useState(null);
    const [showClearMin, setShowClearMin] = useState(false)
    const [showClearMax, setShowClearMax] = useState(false)
    const [showButton, setShowButton] = useState(false)
    const [whichStatusShow, setWhichStatus] = useState([])
    const [selected, setSelected] = useState(null)
    const [selectedConsorcios, setSelectedConsorcios] = useState([]);
    const [selectedEspecificos, setSelectedEspecificos] = useState([]);
  
  const [selectedWeekdays, setSelectedWeekDays] = useState([])


    const weekdays = [
        { label: 'Segunda-feira' },
        { label: 'Terça-feira' },
        { label: 'Quarta-feira' },
        { label: 'Quinta-feira' },
        { label: 'Sexta-feira' },
  
    ];



    const consorcios = [
        { label: 'Todos', value: "Todos" },
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


  const { reset, handleSubmit, setValue, control, getValues, trigger, clearErrors } = useForm({
    defaultValues: {
        name:[],
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
            setSelectedConsorcios(newValue);
        }
        handleAutocompleteChange(field, newValue);
    };
       

    const handleAutocompleteChange = (field, newValue) => {
        if (Array.isArray(newValue)) {
          if (field === 'consorcioName') {
            setValue(field, newValue.map(item => item.value));
          } else {
            setValue(field, newValue.map(item => item.value.userId));
          }
        } else {
            setValue(field, newValue ? (newValue.value ?? newValue.label) : '');
            if(field === 'tipoPagamento'){
                setSelectedWeekDays(newValue?.label)
            }
        }
    };

      const onSubmit = (data) => {
          const hasNameOrConsorcio = data.name.length > 0 || data.consorcioName.length > 0;
            if (!hasNameOrConsorcio) {
              dispatch(
                showMessage({
                  message: "Erro no agendamento, selecione favorecidos ou consórcios",
                }),
              );
            } else {
              setIsLoading(true)
        
              dispatch(bookPayment(data))
                .then((response) => {
                  setIsLoading(false)
                })
                .catch((error) => {
                  dispatch(showMessage({ message: 'Erro no agendamento, verifique os campos e tente novamente.' }))
                  setIsLoading(false)
                });
            }
    

            
      };
      
       const handleValueChange = (name, value) => {
        console.log(name,value)
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
                                        {label: 'Recorrente'},
                                        {label: 'Único'}
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
                                        {label: 'CETT'},
                                        {label: 'CB'}
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
                                        {label: 'Necessita Aprovação'},
                                        {label: 'Livre de Aprovação'}
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
                                                // defaultValue={releaseData.algoritmo}
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
                                { label: "Dom", value: "sun" },
                                { label: "Seg", value: "mon" },
                                { label: "Ter", value: "tue" },
                                { label: "Qua", value: "wed" },
                                { label: "Qui", value: "thu" },
                                { label: "Sex", value: "fri" },
                                { label: "Sab", value: "sat" },
                              ].map((day) => {
                                const isSelected = field.value.includes(day.value);
                                return (
                                  <Box
                                    key={day.value}
                                    onClick={() => {
                                      const newValue = isSelected
                                        ? field.value.filter((v) => v !== day.value)
                                        : [...field.value, day.value];
                                      field.onChange(newValue);
                                    }}
                                    sx={{
                                      borderRadius: "6px",
                                      backgroundColor: isSelected ? "#2AD705" : "#ddd",
                                      color: isSelected ? "#fff" : "#000",
                                      height: 40,
                                      width: 40,
                                      lineHeight: "40px",
                                      textAlign: "center",
                                      cursor: "pointer",
                                      userSelect: "none",
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
            <div className="p-24 pt-10">
                <Box className='flex flex-col  justify-around'>
                    <Card className="w-full md:mx-9 p-24 relative mt-16">
                        <header className="flex justify-between items-center">
                            <h3 className="font-semibold">
                                Agendamentos
                            </h3>
                        </header>
                        <TableRemessa/>

                    </Card>
                </Box>
                <br />
            </div>
        </>
    );
}

export default RemessaApp