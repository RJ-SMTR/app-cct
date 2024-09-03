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
import { showMessage } from 'app/store/fuse/messageSlice';
import 'jspdf-autotable';


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
    const synthData = useSelector(state => state.report.synthData)
    const totalSynth = useSelector(state => state.report.totalSynth)
    const reportType = useSelector(state => state.report.reportType);
    const reportList = useSelector(state => state.report.reportList)
    const userList = useSelector(state => state.admin.userList) || []
    const [isLoading, setIsLoading] = useState(false)
    const [loadingUsers, setLoadingUsers] = useState(false)
    const [userOptions, setUserOptions] = useState([])
    const [showClearMin, setShowClearMin] = useState(false)
    const [showClearMax, setShowClearMax] = useState(false)
    const [rows, setRows] = useState([])
    const [anchorEl, setAnchorEl] = useState(null);


  useEffect(() => {
    setRows(synthData)
  }, [synthData])
    


    const dispatch = useDispatch()

    const { reset, handleSubmit, setValue, control, getValues } = useForm({
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

    const onSubmit = (data) => {
        setIsLoading(true)
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

    const handleAutocompleteChange = (field, newValue) => {
        setValue(field, newValue ? newValue.map(item => item.value ?? item.label) : []);
    };

    const valueProps = {
        startAdornment: <InputAdornment position='start'>R$</InputAdornment>
    };

    const formatter = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    });


  
    const prepareCSVData = (rows) => {
        const csvData = [];

        Object.entries(rows).forEach(([consorcio, group]) => {
            group.items.forEach(item => {
                const row = {
                    'Data Transação': item.datatransacao ? format(new Date(item.datatransacao), 'dd/MM/yyyy') : '',
                    'Data Vencimento': item.datapagamento ? format(new Date(item.datapagamento), 'dd/MM/yyyy') : '',
                    'Consórcio': item.consorcio,
                    'Favorecido': item.favorecido,
                    'Valor transação': formatter.format(item.valor),
                    'Status': showStatus(item.status),
                    'Ocorrência': item.status === 'naopago' ? item.mensagem_status : '',
                };
                csvData.push(row);
            });
        });

        return csvData;
    };


    const exportToCSV = (rows) => {
        const status = getValues('status');
        const whichStatus = status?.join(',');

        const csvData = [
            ['Status selecionado', '', whichStatus || 'Todos'],
            [],
            ['Data Transação', 'Data Vencimento', 'Consórcio', 'Favorecido', 'Valor transação', 'Status', 'Ocorrência'],
        ];

        Object.entries(rows).forEach(([consorcio, group]) => {
            csvData.push([`Consórcio: ${consorcio}`]);

            group.items.forEach(item => {
                const row = [
                    item.datatransacao ? format(new Date(item.datatransacao), 'dd/MM/yyyy') : '',
                    item.datapagamento ? format(new Date(item.datapagamento), 'dd/MM/yyyy') : '',
                    item.consorcio,
                    item.favorecido,
                    formatter.format(item.valor),
                    showStatus(item.status),
                    item.status === 'naopago' ? item.mensagem_status : '',
                ];
                csvData.push(row);
            });

            csvData.push([
                `Subtotal ${consorcio}`,
                '',
                '',
                '',
                formatter.format(group.items.reduce((sum, item) => sum + item.valor, 0)),
                '',
                ''
            ]);
        });

        csvData.push(['Valor Total', '', '', '', formatter.format(reportList?.valor)]);

        return csvData;
    };

    const CSVExportButton = ({ rows }) => {
        const csvData = exportToCSV(rows);

        const selectedDate = getValues('dateRange');
        const dateInicio = selectedDate[0];
        const dateFim = selectedDate[1];

        const csvFilename = useMemo(() => {
            if (dateInicio && dateFim) {
                return `relatorio_${format(dateInicio, 'dd-MM-yyyy')}_${format(dateFim, 'dd-MM-yyyy')}.csv`;
            }
            return `relatorio_${format(new Date(), 'dd-MM-yyyy')}.csv`;
        }, [dateInicio, dateFim]);

        return (
            <CSVLink data={csvData} filename={csvFilename}>
            CSV
            </CSVLink>
        );
    };

   

    // Export PDF
    const exportToPDF = (rows) => {
        const doc = new jsPDF();
        const tableColumn = ["Nome", "Valor"];
        const tableRows = [];


        const selectedDate = getValues('dateRange');
        const dateInicio = selectedDate[0];
        const dateFim = selectedDate[1];

        const status = getValues('status');
        const selectedStatus = status.join(',');

        const logoImg = 'assets/icons/logoPrefeitura.png';
        const logoH = 15;
        const logoW = 30;



    
        const csvData = prepareCSVData(rows); 

        const tableData = csvData.map(item => [
            item['Data Transação'],
            item['Data Vencimento'],
            item['Consórcio'],
            item['Favorecido'],
            item['Valor transação'],
            item['Status'],
            item['Ocorrência'],
        ]);

    
        doc.autoTable({
            head: [['Data Transação', 'Data Vencimento', 'Consórcio', 'Favorecido', 'Valor transação', 'Status', 'Ocorrência']],
            body: tableData,
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

        const totalValue = `Valor total: ${formatter.format(totalSynth)}`;
        doc.setFontSize(10);
        doc.text(totalValue, 14, doc.internal.pageSize.height - 10);


        doc.save(`relatorio_${format(dateInicio, 'dd/MM/yyyy')}_${format(dateFim, 'dd/MM/yyyy')}.pdf`);
    };

    // Export XLSX
    const exportToXLSX = (rows) => {
        const selectedDate = getValues('dateRange');
        const dateInicio = selectedDate[0];
        const dateFim = selectedDate[1];
        const data = [
            ["Status selecionado", "", whichStatus || "Todos"],
            ["Nome", "Valor"],
            ...reportList.data.map(report => [
                report.favorecido,
                formatter.format(report.valor),
            ]),
            ["Valor Total", "", formatter.format(totalSynth)],

        ];

        const wb = utils.book_new();
        utils.book_append_sheet(wb, utils.json_to_sheet(data));
        writeFileXLSX(wb, `relatorio_${format(dateInicio, 'dd/MM/yyyy')}_${format(dateFim, 'dd/MM/yyyy')}.xlsx`);
    };





    const handleMenuClick = (event) => {
        setAnchorEl(event.currentTarget);
    };


    const showStatus = (status) => {
        switch (status) {
            case 'pago':
                return 'Pago';
            case 'a pagar':
                return 'A pagar';
            case 'naopago':
                return 'Erro';
            default:
                return '';
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
                                    <br />
                                    <span className='absolute text-xs text-red-600'>Campo data obrigatório*</span>
                                </Box>
                            </Box>
                            <Box className="flex items-center my-[3.5rem] gap-10 flex-wrap">
                                <Controller
                                    name="valorMin"
                                    control={control}
                                    render={({ field }) => (
                                        <NumericFormat
                                            {...field}
                                            thousandSeparator="."
                                            decimalSeparator=","
                                            fixedDecimalScale
                                            decimalScale={2}
                                            customInput={TextField}
                                            label="Valor Mínimo"
                                            value={field.value}
                                            onMouseEnter={() => {
                                                if (field.value) setShowClearMin(true);
                                            }}
                                            onMouseLeave={() => setShowClearMin(false)}
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
                                    render={({ field }) => (
                                        <NumericFormat
                                            {...field}
                                            thousandSeparator="."
                                            decimalSeparator=","
                                            fixedDecimalScale
                                            decimalScale={2}
                                            customInput={TextField}
                                            label="Valor Máximo"
                                            value={field.value}
                                            onMouseEnter={() => {
                                                if (field.value) setShowClearMax(true);
                                            }}
                                            onMouseLeave={() => setShowClearMax(false)}
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
                            <MenuItem>
                                <CSVExportButton rows={rows} />
                                </MenuItem>
                            <MenuItem onClick={() => exportToXLSX(rows)}>XLSX</MenuItem>
                            <MenuItem onClick={() => exportToPDF(rows)}>PDF</MenuItem>

                        </Menu>
                    </header>
                    <div style={{ height: '65vh', width: '100%' }} className='overflow-scroll'>
                        <Table dense table stickyHeader sx={{ tableLayout: 'fixed', width: '100%' }}>

                         
                            <TableBody>
                                {!isLoading ? (
                                    Object.entries(rows).length > 0 ? (
                                        Object.entries(rows).map(([consorcio, group]) => (
                                            <React.Fragment key={consorcio} >
                                                <TableRow >
                                                    <TableCell component="th" colSpan={11} sx={{ backgroundColor: '#EAEAEA', }} >
                                                        <Box className="flex justify-between w-full">
                                                            <p style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{consorcio}</p>
                                                            
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>

                                                <TableRow>
                                                    {consorcio === 'VLT' ? <TableCell className="font-bold text-small">Data Transação</TableCell> : null}
                                                    <TableCell  className="font-bold text-small">Dt. Vencimento</TableCell>
                                                    <TableCell  className="font-bold text-small">Consórcio</TableCell>
                                                    <TableCell colSpan={4.5} className="font-bold text-small">Favorecido</TableCell>
                                                    <TableCell  className="font-bold text-small">Valor transação</TableCell>
                                                    <TableCell  className="font-bold text-small">Status</TableCell>
                                                    <TableCell  className="font-bold text-small">Ocorrência</TableCell>
                                                </TableRow>

                                                {Object.entries(
                                                    group.items.reduce((acc, item) => {
                                                        let key;

                                                        if (item.consorcio === "STPC" || item.consorcio === "STPL") {
                                                            key = `${item.datapagamento}-${item.status}-${item.favorecido}`;
                                                        } else {
                                                            key = `${item.datapagamento}-${item.status}`;
                                                        }

                                                        if (!acc[key]) acc[key] = [];
                                                        acc[key].push(item);
                                                        return acc;
                                                    }, {})
                                                ).map(([key, items]) => {
                                                    const [datapagamento, status, favorecido] = key.split("-");

                                                    const isGroupedByFavorecido = items.some(item => item.consorcio === "STPC" || item.consorcio === "STPL");

                                                    return (
                                                        <React.Fragment key={`${consorcio}-${datapagamento}-${status}-${favorecido || ''}`}>
                                                            {items.map((item) => (
                                                                <TableRow sx={{ width: "100%" }} className="w-full " key={item.id}>
                                                                    {item.consorcio === "VLT" ? (
                                                                        <TableCell className='p-0 text-[1.2rem]'>
                                                                            {item.datatransacao
                                                                                ? format(new Date(item.datatransacao), "dd/MM/yyyy")
                                                                                : null}
                                                                        </TableCell>
                                                                    ) : null}
                                                                    <TableCell className='p-0 text-[1.2rem]'>
                                                                        {item.datapagamento
                                                                            ? format(new Date(item.datapagamento), "dd/MM/yyyy")
                                                                            : null}
                                                                    </TableCell >
                                                                    <TableCell className='p-0 text-[1.2rem]'>{item.consorcio}</TableCell>
                                                                    <TableCell
                                                                        colSpan={4.5}
                                                                        className='text-[1.2rem]'
                                                                        sx={{
                                                                            minWidth: 300,
                                                                            maxWidth: 350,
                                                                            overflow: "hidden",
                                                                            textOverflow: "ellipsis",
                                                                            padding: 0
                                                                        }}
                                                                    >
                                                                        {item.favorecido}
                                                                    </TableCell>
                                                                    <TableCell className='p-0 text-[1.2rem]'>{formatter.format(item.valor)}</TableCell>
                                                                    <TableCell className='p-0 text-[1.2rem]'>{showStatus(item.status)}</TableCell>
                                                                    {status === "naopago" ? (
                                                                        <TableCell className='p-0 text-[1.2rem]' colSpan={3} sx={{ minWidth: "100px" }}>
                                                                            {item.mensagem_status}
                                                                        </TableCell>
                                                                    ) : null}
                                                                </TableRow>
                                                            ))}
                                                            <TableRow>
                                                                {isGroupedByFavorecido ? (
                                                                    <Box className="flex pb-[20px] gap-10">
                                                                        <p style={{ fontWeight: "bold", whiteSpace: "nowrap" }}>
                                                                            Subtotal:
                                                                        </p>
                                                                        <p className="font-bold">
                                                                            {formatter.format(items.reduce((sum, item) => sum + item.valor, 0))}
                                                                        </p>
                                                                    </Box>
                                                                ) : (
                                                                        <Box className="flex pb-[20px] gap-10">
                                                                        <p  style={{ fontWeight: "bold", whiteSpace: "nowrap" }}>
                                                                            Subtotal do dia:
                                                                        </p>
                                                                        <p className="font-bold">
                                                                            {formatter.format(items.reduce((sum, item) => sum + item.valor, 0))}
                                                                        </p>
                                                                    </Box>
                                                                )}
                                                            </TableRow>
                                                        </React.Fragment>
                                                    );
                                                })}

                                            </React.Fragment>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={8}>Não há dados para serem exibidos</TableCell>
                                        </TableRow>
                                    )
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={8}>Carregando...</TableCell>
                                    </TableRow>
                                )}

                                <TableRow>
                                    <TableCell className='font-bold'>Valor Total: </TableCell>
                                    <TableCell className='font-bold'>{totalSynth}</TableCell>
                                </TableRow>
                            </TableBody>

                        </Table>
                    </div>

                </Box>
            </Paper>
        </>
    );
}
