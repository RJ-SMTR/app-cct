import React, { useEffect, useState } from 'react';
import { utils, writeFile as writeFileXLSX } from 'xlsx';

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
import accounting from 'accounting';
import {
    Box,
    MenuItem,
    Paper,
    Button,
    IconButton,
    FormGroup,
    Menu,
    InputLabel,
    Select,
    FormControlLabel,
    Checkbox,
    Badge,
    FormControl
} from '@mui/material';
import dayjs from 'dayjs';
import { ptBR as pt } from '@mui/x-data-grid';
import FilterListIcon from '@mui/icons-material/FilterList';
import { parseISO, format } from 'date-fns';
import { useDispatch, useSelector } from 'react-redux';
import JwtService from 'src/app/auth/services/jwtService';
import { useForm } from 'react-hook-form';
import { getData, selectedYear, setSelectedDate, setSelectedYear } from 'app/store/releaseSlice';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers';
import ptBR from 'date-fns/locale/pt-BR';
import jsPDF from 'jspdf';
import 'jspdf-autotable';


const locale = pt;

const predefinedFilters = [
    { label: 'Todos', filterFn: () => true },
    { label: 'COMPANHIA MUNICIPAL DE TRANSPORTES COLETIVOS CMTC RIO', filterFn: (row) => row.consorcio.includes('CMTC') },
    { label: 'CONSORCIO SANTA CRUZ TRANSPORTES', filterFn: (row) => row.consorcio.includes('Internorte') },
    { label: 'CONSORCIO INTERSUL TRANSPORTES', filterFn: (row) => row.consorcio.includes('Intersul') },
    { label: 'CONSORCIO TRANSCARIOCA DE TRANSPORTES', filterFn: (row) => row.consorcio.includes('Transcarioca') },
    { label: 'CONSORCIO SANTA CRUZ TRANSPORTES', filterFn: (row) => row.consorcio.includes('Santa Cruz') },
    { label: 'CONCESSIONARIA DO VLT CARIOCA S.A.', filterFn: (row) => row.consorcio.includes('VLT') },
];

const predefinedFiltersStatus = [
    { label: 'Todos', filterFn: () => true },
    { label: 'Pago', filterFn: (row) => row.statusPago.includes('Pago') },
    { label: 'Erro', filterFn: (row) => row.statusPago.includes('Não Pago') },
];



const columns = [
    { field: 'date', headerName: 'Dt. Ordem Pgto.', width: 145, editable: false },
    { field: 'processo', headerName: 'Num. Processo', width: 145, editable: false },
    { field: 'favorecido', headerName: 'Favorecido', width: 400, editable: false, cellClassName: 'noWrapName' },
    { field: 'value', headerName: 'Valor a Pagar', width: 180, editable: false },
    {
        field: 'statusPago',
        headerName: 'Status Pgto.',
        width: 130,
        editable: false,
        renderCell: (params) => <CustomBadge data={params.value} />
    },
    { field: 'ocorrencia', headerName: 'Ocorrência', width: 150, editable: false, cellClassName: 'noWrapName' },
];

const formatToBRL = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const CustomBadge = ({ data }) => {
    return (
        <Badge
            badgeContent={data}
            color={data === "Pago" ? 'success' : 'error'}
        />
    );
};

export default function BasicEditingGrid() {
    const dispatch = useDispatch()
    const selectedDate = useSelector(state => state.release.selectedDate)
    const selectedYear = useSelector(state => state.release.selectedYear)


    const [rowModesModel, setRowModesModel] = useState({});
    const [rows, setRows] = useState([]);
    const [date, setDate] = useState([]);
    const [checkedFilters, setCheckedFilters] = useState(new Array(predefinedFilters.length).fill(false));
    const [checkedFiltersStatus, setCheckedFiltersStatus] = useState(new Array(predefinedFiltersStatus.length).fill(false));
    const [loading, setLoading] = useState(false);
    const [consorcioAnchorEl, setConsorcioAnchorEl] = useState(null);
    const [statusAnchorEl, setStatusAnchorEl] = useState(null);
    const openConsorcioMenu = Boolean(consorcioAnchorEl);
    const openStatusMenu = Boolean(statusAnchorEl);
    const apiRef = useGridApiRef();
    const [sumTotal, setSumTotal] = useState(0);
    const [sumTotalErro, setSumTotalErro] = useState(0);
    const [errors, setErrors] = useState({
        mes: false,
        periodo: false,
    });
    const { register } = useForm()


    const fetchData = () => {
        const hasErrors = !selectedDate.mes || !selectedDate.periodo;
        setErrors({
            mes: !selectedDate.mes,
            periodo: !selectedDate.periodo,
        });

        if (hasErrors) {
            return;
        }
        const token = window.localStorage.getItem('jwt_access_token');
        if (JwtService.isAuthTokenValid(token)) {

        if (selectedYear !== null) {
            const selectedYearFormat = dayjs(selectedYear).year();
            dispatch(setSelectedYear(selectedYearFormat));
            dispatch(getData({ selectedDate, selectedYear }))
                .then((response) => {
                    const formattedRows = response.data.map((item) => ({
                        id: item.id,
                        date: item.data_ordem === null ? '--/--/--' : format(new Date(item.data_ordem), 'dd/MM/yyyy', { timeZone: 'Etc/UTC' }),
                        processo: item.numero_processo,
                        favorecido: item.clienteFavorecido.nome,
                        value: formatToBRL(item.valor),
                        statusPago: item.is_pago ? 'Pago' : 'Não Pago',
                        ocorrencia: item.is_pago ? '' : item.ocorrencias.join(', '),
                    }));
                    setRows(formattedRows);
                })
                .catch((error) => {
                    if (error.response.status === 400) {
                        dispatch(showMessage({ message: 'Verifique os campos e tente novamente!' }));
                    }
                });
        } else {
            dispatch(getData({ selectedDate }))
                    .then((response) => {
                        const formattedRows = response.data.map((item) => ({
                            id: item.id,
                            date: item.data_ordem === null ? '--/--/--' : format(new Date(item.data_ordem), 'dd/MM/yyyy', { timeZone: 'Etc/UTC' }),
                            processo: item.numero_processo,
                            favorecido: item.clienteFavorecido.nome,
                            value: formatToBRL(item.valor),
                            status: item.status,
                            statusPago: item.is_pago ? 'Pago' : 'Não Pago',
                            ocorrencia: item.is_pago ? '' : item.ocorrencias.join(', '),
                        }));
                        setRows(formattedRows);
                    })
                .catch((error) => {
                    if (error.response.status === 400) {
                        dispatch(showMessage({ message: 'Verifique os campos e tente novamente!' }));
                    }
                });
        }
    }
    };




 

    function handleChange(event) {
        const { name, value } = event.target;
        dispatch(setSelectedDate({
            ...selectedDate,
            [name]: value
        }));
        setErrors((prevErrors) => ({
            ...prevErrors,
            [name]: !value,
        }));
    }

    useEffect(() => {
        const filteredPago = filteredRows.filter((item) => item.statusPago.includes('Pago'))
        const filteredErro = filteredRows.filter((item) => item.statusPago.includes('Não Pago'))
        const sum = filteredPago.reduce((accumulator, item) => accumulator + accounting.unformat(item.value.replace(/\./g, '').replace('.', ','), ','), 0);
        const formattedValue = accounting.formatMoney(sum, {
            symbol: "",
            decimal: ",",
            thousand: ".",
            precision: 2
        });
        setSumTotal(formattedValue)
        const sumErro = filteredErro.reduce((accumulator, item) => accumulator + accounting.unformat(item.value.replace(/\./g, '').replace('.', ','), ','), 0);
        const formattedValueErro = accounting.formatMoney(sumErro, {
            symbol: "",
            decimal: ",",
            thousand: ".",
            precision: 2
        });
        setSumTotalErro(formattedValueErro);
    }, [rows, checkedFilters, checkedFiltersStatus]);

 
 
    const handleCheckboxChange = (index) => {
        const newCheckedFilters = [...checkedFilters];
        newCheckedFilters[index] = !newCheckedFilters[index];
        setCheckedFilters(newCheckedFilters);
    };

    const handleCheckboxChangeStatus = (index) => {
        const newCheckedFiltersStatus = [...checkedFiltersStatus];
        newCheckedFiltersStatus[index] = !newCheckedFiltersStatus[index];
        setCheckedFiltersStatus(newCheckedFiltersStatus);
    };

    const applyFilters = () => {
        const activeFilters = predefinedFilters
            .filter((_, i) => checkedFilters[i])
            .map(({ filterFn }) => filterFn);

        const activeFiltersStatus = predefinedFiltersStatus
            .filter((_, i) => checkedFiltersStatus[i])
            .map(({ filterFn }) => filterFn);

        if (activeFilters.length === 0 && activeFiltersStatus.length === 0) {
            return rows;
        }

        return rows.filter(row =>
            (activeFilters.length === 0 || activeFilters.some(filterFn => filterFn(row))) &&
            (activeFiltersStatus.length === 0 || activeFiltersStatus.some(filterFn => filterFn(row)))
        );
    };

    const handleConsorcioClick = (event) => {
        setConsorcioAnchorEl(event.currentTarget);
    };

    const handleStatusClick = (event) => {
        setStatusAnchorEl(event.currentTarget);
    };

    const handleCloseConsorcioMenu = () => {
        setConsorcioAnchorEl(null);
    };

    const handleCloseStatusMenu = () => {
        setStatusAnchorEl(null);
    };
    const handleYearChange = (newValue) => {
        dispatch(setSelectedYear(newValue));
    };


    const filteredRows = applyFilters();
    function gg() {
        const wb = utils.book_new();
        utils.book_append_sheet(wb, utils.json_to_sheet(rows));
        writeFileXLSX(wb, `cct_report_${date[0]}_${date[1]}.xlsx`);
    }

    const exportToPDF = () => {
        const doc = new jsPDF({ orientation: 'landscape' });
        const logoImg = 'assets/icons/logoPrefeitura.png';
        const logoH = 7.5;
        const logoW = 15;

        const addLogo = () => {
            doc.addImage(logoImg, 'PNG', 7, 7, logoW, logoH);
        };

        const dateInicio = selectedDate[0];
        const dateFim = selectedDate[1];
        console.log(selectedDate)



        const addHeader = () => {
            addLogo();
            doc.setFontSize(10);
            doc.text(`Relatório dos dias: ${format(dateInicio, 'dd/MM/yyyy')} a ${format(dateFim, 'dd/MM/yyyy')}`, 7, 20);
            doc.setLineWidth(0.3);
            doc.line(7, 28, pageWidth - 7, 28);
        };

      

        addHeader();

        const tableColumn = ['Dt. Efetivação', 'Num. Processo', 'Favorecido', 'Valor Real Efetivado', 'Status', 'Status Pgto.', 'Ocorrência'];
        const tableRows = [];

        rows.forEach(row => {
            const rowData = [
                row.date,
                row.processo,
                row.favorecido,
                row.value,
                row.status,
                row.statusPago,
                row.ocorrencia,
            ];
            tableRows.push(rowData);
        });

        doc.text('Relatório CCT', 7, 15);
        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 20,
            styles: { fontSize: 10 },
        });

        doc.save(`cct_report_${dayjs().format('DD-MM-YYYY')}.pdf`);
    };


    const ToolBarCustom = () => (
        <GridToolbarContainer className='w-[100%] flex justify-between my-20'>
            <div className="flex items-center mb-4">

                <Box className="flex items-center">
                    <p>Filtrar por consórcio</p>
                    <IconButton
                        id="consorcio-filter-button"
                        aria-controls={openConsorcioMenu ? 'consorcio-menu' : undefined}
                        aria-haspopup="true"
                        aria-expanded={openConsorcioMenu ? 'true' : undefined}
                        onClick={handleConsorcioClick}
                    >
                        <FilterListIcon />
                    </IconButton>
                    <Menu
                        id="consorcio-menu"
                        anchorEl={consorcioAnchorEl}
                        open={openConsorcioMenu}
                        onClose={handleCloseConsorcioMenu}
                    >
                        <FormGroup>
                            {predefinedFilters.map((filter, index) => (
                                <MenuItem key={filter.label}>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={checkedFilters[index]}
                                                onChange={() => handleCheckboxChange(index)}
                                            />
                                        }
                                        label={filter.label}
                                    />
                                </MenuItem>
                            ))}
                        </FormGroup>
                    </Menu>
                </Box>
                <Box className="flex items-center">
                    <p>Filtrar por status</p>
                    <IconButton
                        id="status-filter-button"
                        aria-controls={openStatusMenu ? 'status-menu' : undefined}
                        aria-haspopup="true"
                        aria-expanded={openStatusMenu ? 'true' : undefined}
                        onClick={handleStatusClick}
                    >
                        <FilterListIcon />
                    </IconButton>
                    <Menu
                        id="status-menu"
                        anchorEl={statusAnchorEl}
                        open={openStatusMenu}
                        onClose={handleCloseStatusMenu}
                    >
                        <FormGroup>
                            {predefinedFiltersStatus.map((filter, index) => (
                                <MenuItem key={filter.label}>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={checkedFiltersStatus[index]}
                                                onChange={() => handleCheckboxChangeStatus(index)}
                                            />
                                        }
                                        label={filter.label}
                                    />
                                </MenuItem>
                            ))}
                        </FormGroup>
                    </Menu>
                </Box>
            </div>
            <div className='flex gap-10'>
                <GridToolbarQuickFilter />
                <GridToolbarExportContainer>
                    <GridCsvExportMenuItem
                        options={{
                            fileName: `cct_report_${date[0]}_${date[1]}`
                        }} />
                    <button className='px-[16px]' onClick={gg}>XLSX</button>
                    <button className='px-[16px]' onClick={exportToPDF}>PDF</button>
                  
                    

                </GridToolbarExportContainer >
            </div>


        </GridToolbarContainer>
    );

    const CustomFooter = () => {
        return (
            <Box className='mt-10 flex flex-col md:flex-row gap-x-10'>
                Valor Total Pago: {loading ? <></> : `R$ ${sumTotal}`}
            </Box>
        );
    };

    return (

        <>

        <Paper className='p-24 mt-20'>
                <header>Filtros de Pesquisa</header>

                <Box className="flex gap-x-28 py-20  items-center">
                    <FormControl className='w-1/4'>
                        <InputLabel id="select-mes">Selecionar Mês</InputLabel>
                        <Select
                            {...register('mes')}
                            labelId="select-mes"
                            id="select-mes"
                            label="Selecionar Mes"
                            onChange={handleChange}
                            value={selectedDate.mes}
                        >
                            <MenuItem value={null}>Selecionar Mês</MenuItem>
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
                        {errors.mes && <span className='absolute text-xs text-red-600 bottom-[-15px]'>Campo obrigatório para pesquisa de período*</span>}
                    </FormControl>
                    <FormControl className='w-1/4'>
                        <InputLabel id="select-periodo">Selecionar Período</InputLabel>
                        <Select
                            {...register('periodo')}
                            labelId="select-periodo"
                            id="select-periodo"
                            label="Selecionar Periodo"
                            onChange={handleChange}
                            value={selectedDate.periodo}


                        >
                            <MenuItem value={null}>Selecionar Período</MenuItem>
                            <MenuItem value={1}>1a Quinzena</MenuItem>
                            <MenuItem value={2}>2a Quinzena</MenuItem>
                        </Select>
                        {errors.periodo && <span className='absolute text-xs text-red-600 bottom-[-15px]'>Campo obrigatório para pesquisa de período*</span>}
                    </FormControl>
                    <FormControl >
                        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
                            <DatePicker {...register('ano')} onChange={handleYearChange} label={'Selecionar Ano'} openTo="year" views={['year']} />
                        </LocalizationProvider>
                    </FormControl>

                </Box>

                <Button variant="contained"
                    color="secondary"
                    className=" w-35%  z-10"
                    aria-label="Pesquisar" type='button' onClick={fetchData}>
                    Pesquisar
                </Button>
        </Paper>
        <Paper>
                <Box className="w-full md:mx-9 p-24 relative mt-32">
                    <header className="flex justify-between items-center">
                        <h3 className="font-semibold mb-24">
                            Data Vigente: {format(new Date(), 'dd/MM/yyyy')}
                        </h3>

                    </header>




                    <div style={{ height: '65vh', width: '100%', }}>
                        <DataGrid
                            id='data-table'
                            localeText={locale.components.MuiDataGrid.defaultProps.localeText}
                            rows={filteredRows}
                            disableColumnMenu
                            disableColumnSelector
                            disableDensitySelector
                            disableMultipleColumnsFiltering
                            apiRef={apiRef}
                            columns={columns}
                            slots={{ toolbar: ToolBarCustom, footer: CustomFooter }}
                            loading={loading}
                            rowHeight={42}
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
        </Paper>
        </>
    );
}
