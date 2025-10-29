import React, { useContext, useEffect, useRef, useState } from 'react'
import { getUser } from 'app/store/adminSlice';
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
import { getFavorecidos, setListTransactions, setRelease, setSelectedDate, setSelectedPeriod, setSelectedYear } from 'app/store/releaseSlice';
import { useDispatch, useSelector } from 'react-redux';
import { AuthContext } from 'src/app/auth/AuthContext';
import dayjs from 'dayjs';
import * as yup from 'yup';
import _ from '@lodash';
import { yupResolver } from '@hookform/resolvers/yup';
import { makeStyles } from '@mui/styles';
// import { styling } from './customStyles';
import accounting from 'accounting';
import { showMessage } from 'app/store/fuse/messageSlice';



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

    const consorciosStatusBase = [
        { label: 'Todos' },
        { label: 'A pagar' },
        { label: 'Pago' },
        { label: 'Aguardando Pagamento' },
        { label: 'Erro' },
    ];
    const weekdays = [
        { label: 'Segunda-feira' },
        { label: 'Terça-feira' },
        { label: 'Quarta-feira' },
        { label: 'Quinta-feira' },
        { label: 'Sexta-feira' },
  
    ];

    const consorciosStatus = selectedEspecificos.includes("Pendentes")
        ? [{ label: "Erro" }]
        : consorciosStatusBase;

    const específicos = [
        { label: 'Todos' },
        { label: 'Eleição' },
        { label: 'Desativados' },
        { label: 'Pendentes' }
    ];


    const consorcios = [
        { label: 'Todos', value: "Todos" },
        { label: 'Internorte', value: "Internorte" },
        { label: 'Intersul', value: "Intersul" },
        { label: 'MobiRio', value: "MobiRio" },
        { label: 'Santa Cruz', value: "Santa Cruz" },
        { label: 'STPC', value: "STPC", disabled: selected === 'name' ? true : false },
        { label: 'STPL', value: "STPL", disabled: selected === 'name' ? true : false },
        { label: 'Transcarioca', value: "Transcarioca" },
        { label: 'VLT', value: "VLT" },
        { label: 'TEC', value: "TEC", disabled: selected === 'name' ? true : false }

    ];


  const { reset, handleSubmit, setValue, control, getValues, trigger, clearErrors } = useForm({
    defaultValues: {
      name: [],
      dateRange: [],
      valorMax: '',
      valorMin: '',
      weekdays: [],
      approvalStatus: [],
      status: []
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
        setSelected(newValue.length > 0 ? field : null);
        if (field === 'consorcioName') {
            setSelectedConsorcios(newValue);
        }
        handleAutocompleteChange(field, newValue);
    };
       

    const handleAutocompleteChange = (field, newValue) => {
        if (Array.isArray(newValue)) {
            setValue(field, newValue.map(item => item.value ?? item.label));
        } else {
            setValue(field, newValue ? (newValue.value ?? newValue.label) : '');
        }
    };


    return (
        <>
            <div className="p-24 pt-10">
                <Typography className='font-medium text-3xl'>Agendar Remessa</Typography>
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
                            // onSubmit={handleSubmit(onSubmit)}
                            // onKeyDown={}
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
                                <Autocomplete
                                    id="weekday"
                                    className="w-[25rem] md:min-w-[25rem] md:w-auto p-1"
                                    getOptionLabel={(option) => option.label}
                                    options={weekdays}
                                    onChange={(_, newValue) => handleSelection('weekday', newValue)}
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
                            
                                 
                            
                                          </Box>
                            <Box className="flex gap-10 flex-wrap mb-20">
                                <Autocomplete
                                    id="weekday"
                                    className="w-[25rem] md:min-w-[25rem] md:w-auto p-1"
                                    getOptionLabel={(option) => option.label}
                                    filterSelectedOptions
                                    options={[
                                        {label: 'Recorrente'},
                                        {label: 'Único'}
                                    ]}
                                 
                                    onChange={(_, newValue) => handleSelection('paymentType', newValue)}
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
                                    id="approvalStatus"
                                    className="w-[25rem] md:min-w-[25rem] md:w-auto p-1"
                                    getOptionLabel={(option) => option.label}
                                    filterSelectedOptions
                                    options={[
                                        {label: 'Necessita Aprovação'},
                                        {label: 'Livre de Aprovação'}
                                    ]}
                                    onChange={(_, newValue) => handleSelection('approvalStatus', newValue)}
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
        </>
    );
}

export default RemessaApp