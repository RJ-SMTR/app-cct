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
    Stack,
    IconButton,
    FormGroup,
    Menu,
    FormControlLabel,
    Checkbox,
    Badge
} from '@mui/material';
import { DateRangePicker } from 'rsuite';
import jwtServiceConfig from 'src/app/auth/services/jwtService/jwtServiceConfig';
import { api } from 'app/configs/api/api';
import { ptBR as pt } from '@mui/x-data-grid';
import FilterListIcon from '@mui/icons-material/FilterList';
import { parseISO, format } from 'date-fns';
import { useDispatch } from 'react-redux';
import { handleSynthData, setSynthData } from 'app/store/extractSlice';

const locale = pt;

const predefinedFilters = [
    { label: 'Todos', filterFn: () => true },
    { label: 'STPL', filterFn: (row) => row.consorcio.includes('STPL') },
    { label: 'STPC', filterFn: (row) => row.consorcio.includes('STPC') },
    { label: 'MobiRio', filterFn: (row) => row.consorcio.includes('MobiRio') },
    { label: 'Internorte', filterFn: (row) => row.consorcio.includes('Internorte') },
    { label: 'Intersul', filterFn: (row) => row.consorcio.includes('Intersul') },
    { label: 'Transcarioca', filterFn: (row) => row.consorcio.includes('Transcarioca') },
    { label: 'Santa Cruz', filterFn: (row) => row.consorcio.includes('Santa Cruz') },
    { label: 'VLT', filterFn: (row) => row.consorcio.includes('VLT') },
];

const predefinedFiltersStatus = [
    { label: 'Todos', filterFn: () => true },
    { label: 'Pago', filterFn: (row) => row.status.includes('Pago') },
    { label: 'Erro', filterFn: (row) => row.status.includes('Erro') },
];

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
    

    useEffect(() => {
        if (date.length > 0) {
            const fetchData = async () => {
                const token = window.localStorage.getItem('jwt_access_token');
  
                const config = {
                    method: 'get',
                    maxBodyLength: Infinity,
                    url: `${jwtServiceConfig.report}?dt_inicio=${date[0]}&dt_fim=${date[1]}`,
                    headers: { "Authorization": `Bearer ${token}` },
                };
                try {
                    setLoading(true);
                    const formatDate = (data) => {
                        const parsed = parseISO(data);
                        const correctedParse = new Date(parsed.valueOf() + parsed.getTimezoneOffset() * 60 * 1000);
                        const formatted = format(new Date(correctedParse), 'dd/MM/yyyy');
                        return formatted;
                    };
                    const response = await api.request(config);
                    const formattedRows = response.data.map((item) => ({
                        id: item.id,
                        date: item.dataEfetivacao === null ? '--/--/--' : format(new Date(item.dataEfetivacao), 'dd/MM/yyyy', { timeZone: 'Etc/UTC' }),
                        dateExpire: formatDate(item.dataVencimento),
                        favorecido: item.favorecido,
                        consorcio: item.nomeConsorcio,
                        value: formatToBRL(item.valor),
                        status: item.isPago ? 'Pago' : 'Erro',
                        ocorrencia: item.isPago ? '' : item.ocorrencias.join(', '),
                    }));

                
                    setRows(formattedRows);
                    dispatch(handleSynthData(formattedRows))

                } catch (error) {
                    console.error(error);
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        }
    }, [date]);

    useEffect(() => {
        const filteredPago = filteredRows.filter((item) => item.status.includes('Pago'))
        const filteredErro = filteredRows.filter((item) => item.status.includes('Erro'))
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

    const handleDateChange = (data) => {
        if (data?.length > 0) {
            const firstDate = format(data[0], 'yyyy-MM-dd');
            const lastDate = format(data[1], 'yyyy-MM-dd');
            setDate([firstDate, lastDate]);
        }
    };

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

    const filteredRows = applyFilters();
    function gg() {
        const wb = utils.book_new();
        utils.book_append_sheet(wb, utils.json_to_sheet(rows));
        writeFileXLSX(wb, `cct_report_${date[0]}_${date[1]}.xlsx`);
    }

    const ToolBarCustom = () => (
        <GridToolbarContainer className='w-[100%] flex justify-between'>
            <GridToolbarQuickFilter />
            <GridToolbarExportContainer>
                <GridCsvExportMenuItem
                    options={{
                        fileName: `cct_report_${date[0]}_${date[1]}` 
                    }} />
                <button className='px-[16px]' onClick={gg}>Baixar como XLSX</button>
                <GridPrintExportMenuItem options={{
                    hideToolbar: true,
                    fileName: `cct_report_${date[0]}_${date[1]}`
                }} />
               
            </GridToolbarExportContainer >
           
          
        </GridToolbarContainer>
    );

    const CustomFooter = () => {
        return (
            <Box className='mt-10 flex flex-col md:flex-row gap-x-10'>
                Valor Total Pago: {loading ? <></> : `R$ ${sumTotal}`}
                <span className='text-red-600'>Valor Total Pendente (erro): {loading ? <></> : `R$ ${sumTotalErro}`}</span>
            </Box>
        );
    };

    return (
        <Box className="w-full md:mx-9 p-24 relative mt-32">
            <header className="flex justify-between items-center">
                <h3 className="font-semibold mb-24">
                    Data Vigente: {format(new Date(), 'dd/MM/yyyy')}
                </h3>
                <DateRangePicker
                    id="custom-date-input"
                    showOneCalendar
                    showHeader={false}
                    placement='auto'
                    placeholder="Selecionar Data"
                    format='dd/MM/yy'
                    character=' - '
                    onChange={(newValue) => handleDateChange(newValue)}
                />
            </header>
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
            <div style={{ height: '65vh', width: '100%' }}>
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
    );
}
