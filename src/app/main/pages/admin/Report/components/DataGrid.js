
import {
    DataGrid,
    GridCsvExportMenuItem,
    GridPrintExportMenuItem,
    GridToolbarContainer,
    GridToolbarExport,
    GridToolbarExportContainer,
    GridToolbarQuickFilter,
    useGridApiRef
} from '@mui/x-data-grid';
import React, { useEffect, useState, useMemo } from 'react';
import {
    Box,
    MenuItem,
    Table,
    TableBody,
    Autocomplete,
    TextField,
    Button,
    TableRow,
    TableHead,
    TableCell,
    Paper,
    CircularProgress,
    InputAdornment,
    Menu,
    IconButton
} from '@mui/material';
import { format, parseISO } from 'date-fns';
import { useDispatch, useSelector } from 'react-redux';
import { CustomProvider, DateRangePicker } from 'rsuite';
import { useForm, Controller } from 'react-hook-form';
import { handleReportInfo, setTotalSynth } from 'app/store/reportSlice';
import { getUser } from 'app/store/adminSlice';
import { NumericFormat } from 'react-number-format';
import { CSVLink } from 'react-csv';
import { ClearIcon } from '@mui/x-date-pickers';
import jsPDF from 'jspdf';
import { showMessage } from 'app/store/fuse/messageSlice';
import 'jspdf-autotable';
import ptBR from 'rsuite/locales/pt_BR';
import { utils, writeFileXLSX } from 'xlsx';


const consorciosStatus = [
    { label: 'Todos' },
    { label: 'A pagar' },
    { label: 'Pago' },
    { label: 'Erro' },
];
const consorcios = [
    { label: 'Todos', value: "Todos" },
    { label: 'Internorte', value: "Internorte" },
    { label: 'Intersul', value: "Intersul" },
    { label: 'MobiRio', value: "MobiRio" },
    { label: 'Santa Cruz', value: "Santa Cruz" },
    { label: 'STPC', value: "STPC" },
    { label: 'STPL', value: "STPL" },
    { label: 'Transcarioca', value: "Transcarioca" },
    { label: 'VLT', value: "VLT" }
];
const CustomBadge = ({ data }) => {
    return (
        <Badge
            badgeContent={data}
            color={data === "Pago" ? 'success' : 'error'}
        />
    );
};
const columns = [
    { field: 'date', headerName: 'Dt. Efetivação', width: 145, editable: false },
    { field: 'dateExpire', headerName: 'Dt. Vencimento', width: 150, editable: false },
    { field: 'favorecido', headerName: 'Favorecido', width: 180, editable: false, cellClassName: 'noWrapName' },
    { field: 'consorcio', headerName: 'Consórcio', width: 130, editable: false },
    { field: 'value', headerName: 'Valor Real Efetivado', width: 180, editable: false },
    {
        field: 'status',
        headerName: 'Status',
        width: 130,
        editable: false,
        renderCell: (params) => <CustomBadge data={params.value} />
    },
    { field: 'ocorrencia', headerName: 'Ocorrência', width: 150, editable: false, cellClassName: 'noWrapName' },
];




export default function BasicEditingGrid() {
    const dispatch = useDispatch()
    const reportType = useSelector(state => state.report.reportType);
    const userList = useSelector(state => state.admin.userList) || []
    const [isLoading, setIsLoading] = useState(false)
    const [loadingUsers, setLoadingUsers] = useState(false)
    const [userOptions, setUserOptions] = useState([])
    const [showClearMin, setShowClearMin] = useState(false)
    const [showClearMax, setShowClearMax] = useState(false)
    const [rowModesModel, setRowModesModel] = useState({});
    const [rows, setRows] = useState([]);
    const apiRef = useGridApiRef();
    



    const { reset, handleSubmit, setValue, control, getValues, trigger, clearErrors } = useForm({
        defaultValues: {
            name: [],
            dateRange: [],
            valorMax: '',
            valorMin: '',
            consorcioName: [],
            favorecidoSearch: '',
            status: []
        }
    });
    const onSubmit = (data) => {
        setIsLoading(true)
        dispatch(setTotalSynth(''))
        dispatch(handleReportInfo(data, reportType))
            .then((response) => {
                setIsLoading(false)
            })
            .catch((error) => {
                dispatch(showMessage({ message: 'Erro na busca, verifique os campos e tente novamente.' }))
            });
    };
    const handleClear = () => {
        setValue('name', [])
        setValue('dateRange', [])
        setValue('valorMax', '')
        setValue('valorMin', '')
        setValue('consorcioName', [])
        setValue('favorecidoSearch', '')
        setValue('status', [])
        document.querySelectorAll('.MuiAutocomplete-clearIndicator').forEach(button => button.click());
    }


    const fetchUsers = async () => {
        setLoadingUsers(true);
        dispatch(getUser());
        setLoadingUsers(false);
    };

    useEffect(() => {
        fetchUsers()
    }, []);

    useEffect(() => {
        setIsLoading(false)
    }, [rows]);
   
    const valueProps = {
        startAdornment: <InputAdornment position='start'>R$</InputAdornment>
    };
    const formatter = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    });

    return (
        <>
            <Paper>
                <Box className="w-full md:mx-9 p-24 relative mt-32">
                    <header>Filtros de Pesquisa</header>
                    <Box className="flex items-center py-10 gap-10">
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <Box className="flex gap-10 flex-wrap mb-20">


                                <Autocomplete
                                    id="favorecidos"
                                    multiple
                                    className="w-[25rem] md:min-w-[25rem] md:w-auto  p-1"
                                    getOptionLabel={(option) => option.value.fullName}
                                    filterSelectedOptions
                                    options={userOptions}
                                    filterOptions={(options, state) => {

                                        return options.filter(option =>
                                            option.value?.cpfCnpj?.includes(state.inputValue) ||
                                            option.value?.permitCode?.includes(state.inputValue) ||
                                            option.value?.fullName?.toLowerCase().includes(state.inputValue.toLowerCase())
                                        );
                                    }}
                                    loading={loadingUsers}
                                    onChange={(_, newValue) => handleAutocompleteChange('name', newValue)}
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
                                    className="w-[25rem] md:min-w-[25rem] md:w-auto  p-1"
                                    getOptionLabel={(option) => option.label}
                                    filterSelectedOptions
                                    options={consorcios}
                                    onChange={(_, newValue) => handleAutocompleteChange('consorcioName', newValue)}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Selecionar Consórcios"
                                            variant="outlined"
                                            InputProps={{
                                                ...params.InputProps,
                                                endAdornment: (
                                                    <>
                                                        {params.InputProps.endAdornment}
                                                    </>
                                                ),
                                            }}
                                        />
                                    )}
                                />
                            </Box>

                            <Box className="flex items-center gap-10 flex-wrap">
                                <Autocomplete
                                    id="status"
                                    multiple
                                    className="w-[25rem] md:min-w-[25rem] md:w-auto  p-1"
                                    getOptionLabel={(option) => option.label}
                                    filterSelectedOptions
                                    options={consorciosStatus}
                                    onChange={(_, newValue) => handleAutocompleteChange('status', newValue)}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Selecionar Status"
                                            variant="outlined"
                                            InputProps={{
                                                ...params.InputProps,
                                                endAdornment: (
                                                    <>
                                                        {params.InputProps.endAdornment}
                                                    </>
                                                ),
                                            }}
                                        />
                                    )}
                                />
                                <Box>
                                    <CustomProvider locale={ptBR}>
                                        <Controller
                                            name="dateRange"
                                            control={control}
                                            render={({ field }) => (
                                                <DateRangePicker
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
                                    </CustomProvider>
                                    <br />
                                    <span className='absolute text-xs text-red-600'>Campo data obrigatório*</span>
                                </Box>
                            </Box>
                            <Box className="flex items-center my-[3.5rem] gap-10 flex-wrap">
                                <Controller
                                    name="valorMin"
                                    control={control}
                                    rules={{
                                        validate: (value) => {
                                            if (!value) return true;
                                            const valorMin = parseFloat(value.replace(',', '.'));
                                            const valorMax = parseFloat(getValues("valorMax").replace(',', '.'));
                                            return valorMin <= valorMax || "Valor Mínimo não pode ser maior que o Valor Máximo";
                                        }
                                    }}

                                    render={({ field, fieldState: { error } }) => (
                                        <NumericFormat
                                            {...field}
                                            thousandSeparator="."
                                            decimalSeparator=","
                                            fixedDecimalScale
                                            decimalScale={2}
                                            customInput={TextField}
                                            label="Valor Mínimo"
                                            value={field.value}
                                            onChange={(e) => {
                                                field.onChange(e);
                                                const valorMin = parseFloat(e.target.value.replace(',', '.'));
                                                const valorMax = parseFloat(getValues("valorMax").replace(',', '.'));

                                                if (valorMin <= valorMax) {
                                                    clearErrors("valorMin");
                                                    clearErrors("valorMax");
                                                } else {
                                                    trigger("valorMax");
                                                }
                                            }}
                                            error={!!error}
                                            helperText={error ? error.message : null}
                                            onMouseEnter={() => {
                                                if (field.value) setShowClearMin(true);

                                            }}
                                            onMouseLeave={() => setShowClearMin(false)}
                                            FormHelperTextProps={{
                                                sx: { color: 'red', fontSize: '1rem', position: 'absolute', bottom: '-3.5rem' }
                                            }}
                                            InputProps={{
                                                endAdornment: showClearMin && field.value && (
                                                    <InputAdornment sx={{ position: "absolute", right: '1rem' }} position="end">
                                                        <IconButton onClick={() => clearSelect('valorMin')} sx={{ height: '2rem', width: '2rem' }}>
                                                            <ClearIcon sx={{ height: '2rem' }} />
                                                        </IconButton>
                                                    </InputAdornment>
                                                ),
                                                ...valueProps,
                                            }}
                                        />
                                    )}
                                />
                                <Controller
                                    name="valorMax"
                                    control={control}
                                    rules={{
                                        validate: (value) => {
                                            if (!value) return true;
                                            const valorMax = parseFloat(value.replace(',', '.'));
                                            const valorMin = parseFloat(getValues("valorMin").replace(',', '.'));
                                            return valorMax >= valorMin || "Valor Máximo não pode ser menor que o Valor Mínimo";
                                        }
                                    }}
                                    render={({ field, fieldState: { error } }) => (
                                        <NumericFormat
                                            {...field}
                                            thousandSeparator="."
                                            decimalSeparator=","
                                            fixedDecimalScale
                                            decimalScale={2}
                                            customInput={TextField}
                                            label="Valor Máximo"
                                            value={field.value}
                                            onChange={(e) => {
                                                field.onChange(e);
                                                const valorMax = parseFloat(e.target.value.replace(',', '.'));
                                                const valorMin = parseFloat(getValues("valorMin").replace(',', '.'));

                                                if (valorMax >= valorMin) {
                                                    clearErrors("valorMax");
                                                    clearErrors("valorMin");
                                                } else {
                                                    trigger("valorMin");
                                                }
                                            }}
                                            onMouseEnter={() => {
                                                if (field.value) setShowClearMax(true);
                                            }}
                                            onMouseLeave={() => setShowClearMax(false)}
                                            error={!!error}
                                            helperText={error ? error.message : null}
                                            FormHelperTextProps={{
                                                sx: { color: 'red', fontSize: '1rem', position: 'absolute', bottom: '-3.5rem' }
                                            }}
                                            InputProps={{
                                                endAdornment: showClearMax && field.value && (
                                                    <InputAdornment sx={{ position: "absolute", right: '1rem' }} position="end">
                                                        <IconButton onClick={() => clearSelect('valorMax')} sx={{ height: '2rem', width: '2rem' }}>
                                                            <ClearIcon sx={{ height: '2rem' }} />
                                                        </IconButton>
                                                    </InputAdornment>
                                                ),

                                                ...valueProps,
                                            }}
                                        />
                                    )}
                                />
                            </Box>
                            <Box>

                            </Box>
                            <Box>
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    className=" w-35% mt-16 z-10"
                                    aria-label="Pesquisar"
                                    type="submit"
                                    size="medium"
                                >
                                    Pesquisar
                                </Button>
                                <Button
                                    variant="contained"
                                    className=" w-35% mt-16 mx-10 z-10"
                                    aria-label="Limpar Filtros"
                                    type="button"
                                    size="medium"
                                    onClick={() => handleClear()}
                                >
                                    Limpar Filtros
                                </Button>
                            </Box>
                        </form>

                    </Box>
                </Box>
            </Paper>
            <Paper>
                <Box className="w-full md:mx-9 p-24 relative mt-32">
                    <div style={{ height: '65vh', width: '100%' }}>
                        <DataGrid
                            id='data-table'
                            // localeText={locale.components.MuiDataGrid.defaultProps.localeText}
                            rows={rows}
                            disableColumnMenu
                            disableColumnSelector
                            disableDensitySelector
                            disableMultipleColumnsFiltering
                            apiRef={apiRef}
                            columns={columns}
                            loading={isLoading}
                            rowHeight={85}
                            slotProps={{
                                toolbar: {
                                    showQuickFilter: true,
                                },
                            }}
                            rowModesModel={rowModesModel}
                            onRowEditStop={(params, event) => {
                                event.defaultMuiPrevented = true;
                            }}
                            componentsProps={{
                                toolbar: { setRows, setRowModesModel },
                            }}
                        />
                    </div>

                </Box>
            </Paper></>
    );
}
