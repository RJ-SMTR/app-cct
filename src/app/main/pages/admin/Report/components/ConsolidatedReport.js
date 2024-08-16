import React, { useEffect, useState } from 'react';
import {
    Box,
    MenuItem,
    ListItemText,
    Checkbox,
    Table,
    TableHead,
    TableBody,
    Autocomplete,
    TextField,
    Button,
    TableRow,
    TableCell,
    Paper,
    Select,
    InputLabel,
    FormControl,
    CircularProgress,
    InputAdornment,
    TableFooter,
    Menu
} from '@mui/material';
import { ptBR as pt } from '@mui/x-data-grid';
import { format } from 'date-fns';
import { useDispatch, useSelector } from 'react-redux';
import { DateRangePicker } from 'rsuite';
import { useForm, Controller } from 'react-hook-form';
import { handleReportInfo } from 'app/store/reportSlice';
import { getUser } from 'app/store/adminSlice';
import { NumericFormat } from 'react-number-format';
import { CSVLink } from 'react-csv';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const locale = pt;

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


export default function BasicEditingGrid() {
    const reportType = useSelector(state => state.report.reportType);
    const reportList = useSelector(state => state.report.reportList)
    const userList = useSelector(state => state.admin.userList) || []
    const [isLoading, setIsLoading] = useState(false)
    const [loadingUsers, setLoadingUsers] = useState(false)
    const [userOptions, setUserOptions] = useState([])
    const [selectedStatus, setSelectedStatus] = useState([]);
    const [anchorEl, setAnchorEl] = useState(null);

    const dispatch = useDispatch()

    const { register, handleSubmit, setValue, control, getValues, watch } = useForm({
        defaultValues: {
            name: [],
            dateRange: [],
            valorMax: null,
            valorMin: null,
            consorcioName: [],
            favorecidoSearch: '',
            status: []
        }
    });
    const watchedFavorecidoSearch = watch('favorecidoSearch');

    const onSubmit = (data) => {
        dispatch(handleReportInfo(data, reportType))
    };

    const fetchUsers = async () => {
        setLoadingUsers(true);
        dispatch(getUser());
        setLoadingUsers(false);
    };

    useEffect(() => {
        fetchUsers()
    }, []);

    useEffect(() => {
        if (reportList.length > 0) {
            setIsLoading(false)
        }
    }, [reportList]);

    useEffect(() => {
        if (userList && userList.length > 0) {
            const options = userList.map((user) => ({
                label: getValues('favorecidoSearch') === 'cpf/cnpj' ? `${user.cpfCnpj} - ${user.fullName}` : `${user.permitCode} - ${user.fullName}`,
                value: {
                    cpfCnpj: user.cpfCnpj,
                    permitCode: user.permitCode,
                    fullName: user.fullName
                }
            }));
            console.log(options)
            const sortedOptions = options.sort((a, b) => {
                if (getValues('favorecidoSearch') === 'cpf/cnpj') {
                    return a.value.fullName.localeCompare(b.value.fullName);
                } else {
                    return a.label.localeCompare(b.label);
                }
            });

            setUserOptions(sortedOptions);
        } else {
            setUserOptions([]);
        }
    }, [watchedFavorecidoSearch, userList]);

    const handleAutocompleteChange = (field, newValue) => {
        setValue(field, newValue ? newValue.map(item => item.value ?? item.label) : []);
    };

    const handleStatus = (event) => {
        setSelectedStatus(event.target.value);
    };

    const valueProps = {
        startAdornment: <InputAdornment position='start'>R$</InputAdornment>
    };

    const formatter = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    });

    const csvData = reportList.data ? reportList.data.map(report => ({
        Nome: report.nome,
        Valor: formatter.format(report.valor)
    })) : [];

    const exportPDF = () => {
        const doc = new jsPDF();
        const tableColumn = ["Nome", "Valor"];
        const tableRows = [];

        reportList.data.forEach(report => {
            const reportData = [
                report.nome,
                formatter.format(report.valor)
            ];
            tableRows.push(reportData);
        });

        doc.autoTable(tableColumn, tableRows, { startY: 20 });
        doc.text(`Relatório ${format(new Date(), 'dd/MM/yyyy')}`, 14, 15);
        doc.save(`relatorio_${format(new Date(), 'dd/MM/yyyy')}.pdf`);
    };
    const handleMenuClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = (option) => {
        setAnchorEl(null);
        if (option === 'csv') {
            document.getElementById('csv-export-link').click();
        } else if (option === 'pdf') {
            exportPDF();
        }
    };

    return (
        <>
            <Paper>
                <Box className="w-full md:mx-9 p-24 relative mt-32">
                    <header>Filtros de Pesquisa</header>

                    <Box className="flex items-center py-10 gap-10">
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <Box className="flex gap-10 flex-wrap mb-20">
                                <Controller
                                    name="favorecidoSearch"
                                    control={control}
                                    render={({ field }) => (
                                        <FormControl style={{ minWidth: '22rem' }}>
                                            <InputLabel id="favorecido-select-label">Pesquisar favorecido por:</InputLabel>
                                            <Select
                                                {...field}
                                                labelId="favorecido-select-label"
                                                id="favorecido-select"
                                                label="Pesquisar favorecido por:"
                                            >
                                                <MenuItem value="cpf/cnpj">CPF</MenuItem>
                                                <MenuItem value="permitCode">Código Permissionário</MenuItem>
                                            </Select>
                                        </FormControl>
                                    )}
                                />

                                <Autocomplete
                                    id="favorecidos"
                                    multiple
                                    className="w-[25rem] md:min-w-[25rem] md:w-auto  p-1"
                                    getOptionLabel={(option) => option.label}
                                    filterSelectedOptions
                                    options={userOptions}
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
                            </Box>
                            <Box className="flex items-center my-20 gap-10 flex-wrap">
                                <Controller
                                    name="valorMin"
                                    control={control}
                                    render={({ field }) =>
                                        <NumericFormat
                                            {...field}
                                            thousandSeparator={'.'}
                                            label="Valor Mínimo"
                                            value={field.value}
                                            decimalSeparator={','}
                                            fixedDecimalScale
                                            decimalScale={2}
                                            customInput={TextField}
                                            InputProps={{
                                                ...valueProps,
                                            }}

                                        />
                                    }
                                />
                                <Controller
                                    name="valorMax"
                                    control={control}
                                    render={({ field }) =>
                                        <NumericFormat
                                            {...field}
                                            thousandSeparator={'.'}
                                            label="Valor Máximo"
                                            value={field.value}
                                            decimalSeparator={','}
                                            fixedDecimalScale
                                            decimalScale={2}
                                            customInput={TextField}
                                            InputProps={{
                                                ...valueProps,
                                            }}

                                        />
                                    }
                                />

                            
                            </Box>
                            <Box>

                            </Box>
                            <Box>
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    className=" w-full mt-16 z-10"
                                    aria-label="Pesquisar"
                                    type="submit"
                                    size="medium"
                                >
                                    Pesquisar
                                </Button>
                            </Box>
                        </form>

                    </Box>
                </Box>
            </Paper>

            <Paper>
                <Box className="w-full md:mx-9 p-24 relative mt-32">
                    <header className="flex justify-between items-center">
                        <h3 className="font-semibold mb-24">
                            Data Vigente: {format(new Date(), 'dd/MM/yyyy')}
                        </h3>


                        <Button
                            aria-controls="simple-menu"
                            aria-haspopup="true"
                            onClick={handleMenuClick}
                            style={{ marginTop: '20px' }}
                        >
                            <svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium muiltr-hgpioi-MuiSvgIcon-root h-[2rem]" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="SaveAltIcon"><path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2z"></path></svg> Exportar
                        </Button>
                        <Menu
                            id="simple-menu"
                            anchorEl={anchorEl}
                            keepMounted
                            open={Boolean(anchorEl)}
                            onClose={() => setAnchorEl(null)}
                        >
                            <MenuItem onClick={() => handleMenuClose('csv')}>CSV</MenuItem>
                            <MenuItem onClick={() => handleMenuClose('pdf')}>PDF</MenuItem>
                        </Menu>

                        <CSVLink
                            id="csv-export-link"
                            data={csvData}
                            filename={`relatorio_${format(new Date(), 'dd/MM/yyyy')}.csv`}
                            className="hidden"
                        
                        />
                    </header>

                    <div style={{ height: '50vh', width: '100%' }} className="overflow-scroll">
                        <Table size='small'>
                            <TableHead className="items-center mb-4">
                                <TableRow>
                                    <TableCell>Nome</TableCell>
                                    <TableCell>Valor</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {!isLoading ? (
                                    reportList.count > 0 ? (
                                        reportList.data.map((report, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{report.nome}</TableCell>
                                                <TableCell>{formatter.format(report.valor)}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={2}>Não há dados para ser exibidos</TableCell>
                                        </TableRow>
                                    )
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={2}>Carregando...</TableCell>
                                    </TableRow>
                                )}
                                <TableRow key={Math.random()}>
                                    <TableCell className='font-bold'>Valor Total: </TableCell>
                                    <TableCell className='font-bold'> {formatter.format(reportList.valor ?? 0)}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </Box>
            </Paper>
        </>
    );
}
