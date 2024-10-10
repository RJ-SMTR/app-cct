
import {
    DataGrid,
    useGridApiRef
} from '@mui/x-data-grid';
import React, { useEffect, useState, useMemo } from 'react';
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
    Menu,
    IconButton
} from '@mui/material';
import { format, parseISO } from 'date-fns';
import { CSVLink } from 'react-csv';
import { useDispatch, useSelector } from 'react-redux';
import { CustomProvider, DateRangePicker } from 'rsuite';
import { useForm, Controller } from 'react-hook-form';
import { handleReportInfo } from 'app/store/reportSlice';
import { getUser } from 'app/store/adminSlice';
import { NumericFormat } from 'react-number-format';
import { ClearIcon } from '@mui/x-date-pickers';
import { showMessage } from 'app/store/fuse/messageSlice';
import 'jspdf-autotable';
import ptBR from 'rsuite/locales/pt_BR';



const consorciosStatus = [
    { label: 'Todos' },
    { label: 'A pagar' },
    { label: 'Pago' },
    { label: 'Aguardando Pagamento' },
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
    { label: 'VLT', value: "VLT" },
{label: 'TEC', value: "TEC"}
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
    // { field: 'date', headerName: 'Dt. Efetivação', width: 145, editable: false },
    // { field: 'dateExpire', headerName: 'Dt. Vencimento', width: 150, editable: false },
    // { field: 'favorecido', headerName: 'Favorecido', width: 180, editable: false, cellClassName: 'noWrapName' },
    { field: 'consorcio', headerName: 'Consórcio', width: 130, editable: false },
    { field: 'value', headerName: 'Valor Real Efetivado', width: 180, editable: false },
    // {
    //     field: 'status',
    //     headerName: 'Status',
    //     width: 130,
    //     editable: false,
    //     renderCell: (params) => <CustomBadge data={params.value} />
    // },
    // { field: 'ocorrencia', headerName: 'Ocorrência', width: 150, editable: false, cellClassName: 'noWrapName' },
];




export default function BasicEditingGrid() {
    const dispatch = useDispatch()
    const reportType = useSelector(state => state.report.reportType);
    const userList = useSelector(state => state.admin.userList) || []
    const reportList = useSelector(state => state.report.reportList)
    const [isLoading, setIsLoading] = useState(false)
    const [loadingUsers, setLoadingUsers] = useState(false)
    const [userOptions, setUserOptions] = useState([])
    const [showClearMin, setShowClearMin] = useState(false)
    const [showClearMax, setShowClearMax] = useState(false)
    const [rowModesModel, setRowModesModel] = useState({});
    const [rows, setRows] = useState([]);
    const apiRef = useGridApiRef();
    const [anchorEl, setAnchorEl] = useState(null);
    const [whichStatusShow, setWhichStatus] = useState([])
    



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
    const formatter = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    });

    const onSubmit = (data) => {
   
        dispatch(handleReportInfo(data, reportType))
            .then((response) => {
                const formattedRows = response.data.map((item) => ({
                    id: Math.random(),
                    consorcio: item.nomefavorecido,
                    value: formatter.format(item.valor),
                }));
                setRows(formattedRows)
                setIsLoading(false)
            })
            .catch((error) => {
                dispatch(showMessage({ message: 'Erro na busca, verifique os campos e tente novamente.' }))
                setIsLoading(false)
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
    const status = getValues('status')
    const whichStatus = status?.join(',')

    const reportListData = reportList.count > 0
        ? reportList.data?.map(report => ({
            Nome: report.nomefavorecido,
            Valor: formatter.format(report.valor),
            Status: "",
        }))
        : [];

    const valorTotal = {
        Nome: "Valor Total",
        Valor: "",
        Status: formatter.format(reportList?.valor),
    }

    const statusRow = {
        Nome: "Status selecionado",
        Valor: "",
        Status: whichStatus || "Todos",
    };

    const csvData = [
        statusRow,
        ...reportListData,
        valorTotal
    ]
    let dateInicio;
    let dateFim;
    const selectedDate = getValues('dateRange');

    if (selectedDate !== null) {
        dateInicio = selectedDate[0];
        dateFim = selectedDate[1];
    }

    const csvFilename = useMemo(() => {
        if (dateInicio && dateFim) {
            return `relatorio_${format(dateInicio, 'dd-MM-yyyy')}_${format(dateFim, 'dd-MM-yyyy')}.csv`;
        }
        return `relatorio_${format(new Date(), 'dd-MM-yyyy')}.csv`;
    }, [dateInicio, dateFim])

    // Export PDF
    const exportPDF = () => {
        const doc = new jsPDF();
        const tableColumn = ["Nome", "Valor"];
        const tableRows = [];

        reportList.data.forEach(report => {
            const reportData = [
                report.nomefavorecido,
                formatter.format(report.valor)
            ];
            tableRows.push(reportData);
        });
        let dateInicio;
        let dateFim;
        const selectedDate = getValues('dateRange');

        if (selectedDate !== null) {
            dateInicio = selectedDate[0];
            dateFim = selectedDate[1];
        }
        const status = getValues('status');
        const selectedStatus = status.join(',');

        const logoImg = 'assets/icons/logoPrefeitura.png';
        const logoH = 15;
        const logoW = 30;




        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            margin: { left: 14, right: 14, top: 60 },
            startY: 60,
            didDrawPage: (data) => {

                doc.addImage(logoImg, 'PNG', 14, 10, logoW, logoH);


                const hrYPosition = 30;
                doc.setLineWidth(0.3);
                doc.line(14, hrYPosition, 196, hrYPosition);


                doc.setFontSize(10);
                doc.text(`Relatório dos dias: ${format(dateInicio, 'dd/MM/yyyy')} a ${format(dateFim, 'dd/MM/yyyy')}`, 14, 45);
                doc.text(`Status observado: ${selectedStatus || 'Todos'}`, 14, 50);





            },
        });

        const pageCount = doc.internal.getNumberOfPages();

        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(10);

            const currentPage = doc.internal.getCurrentPageInfo().pageNumber;
            const text = `Página ${currentPage} de ${pageCount}`;
            const xPos = 14;
            const yPos = doc.internal.pageSize.height - 5;

            doc.text(text, xPos, yPos);
        }

        const totalValue = `Valor total: ${formatter.format(reportList.valor ?? 0)}`;
        doc.setFontSize(10);
        doc.text(totalValue, 14, doc.internal.pageSize.height - 10);


        doc.save(`relatorio_${format(dateInicio, 'dd/MM/yyyy')}_${format(dateFim, 'dd/MM/yyyy')}.pdf`);
    };

    // Export XLSX
    const exportXLSX = () => {
        let dateInicio;
        let dateFim;
        const selectedDate = getValues('dateRange');

        if (selectedDate !== null) {
            dateInicio = selectedDate[0];
            dateFim = selectedDate[1];
        }
        const data = [
            ["Status selecionado", "", whichStatus || "Todos"],
            ["Nome", "Valor"],
            ...reportList.data.map(report => [
                report.nomefavorecido,
                formatter.format(report.valor),
            ]),
            ["Valor Total", "", formatter.format(reportList.valor ?? 0)],

        ];

        const wb = utils.book_new();
        utils.book_append_sheet(wb, utils.json_to_sheet(data));
        writeFileXLSX(wb, `relatorio_${format(dateInicio, 'dd/MM/yyyy')}_${format(dateFim, 'dd/MM/yyyy')}.xlsx`);
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
        } else if (option === 'xlsx') {
            exportXLSX();
        }
    };
    useEffect(() => {
        if (userList && userList.length > 0) {
            const options = userList.map((user) => ({
                label: user.label,
                value: {
                    cpfCnpj: user.cpfCnpj,
                    permitCode: user.permitCode,
                    fullName: user.fullName
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

    useEffect(() => {
        setIsLoading(false)
    }, [rows]);
   
    const valueProps = {
        startAdornment: <InputAdornment position='start'>R$</InputAdornment>
    };
  
    const handleAutocompleteChange = (field, newValue) => {
        if (field === 'status') {
            const status = newValue.map(i => i.label)
            setWhichStatus(status)
        }
        setValue(field, newValue ? newValue.map(item => item.value ?? item.label) : []);
    };
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
                            {whichStatusShow.includes("A pagar") && (
                                <span className="text-sm text-red-600">
                                    Atenção: Para o status "a pagar", a data escolhida deve ser referente a data da transação (quarta a quinta-feira).
                                </span>
                            )}
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
                            <MenuItem onClick={() => handleMenuClose('xlsx')}>XLSX</MenuItem>
                        </Menu>

                        <CSVLink
                            id="csv-export-link"
                            data={csvData}
                            filename={csvFilename}
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
                                        reportList.data?.map((report, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{report.nomefavorecido}</TableCell>
                                                <TableCell>{formatter.format(report.valor)}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={2}>Não há dados para serem exibidos</TableCell>
                                        </TableRow>
                                    )
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5}>
                                            <Box className="flex justify-center items-center m-10">
                                                <CircularProgress />
                                            </Box>
                                        </TableCell>
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
            </Paper></>
    );
}
