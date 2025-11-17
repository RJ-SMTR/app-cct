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
    { label: 'CONSORCIO INTERSUL TRANSPORTES', filterFn: (row) => row.beneficiarioUsuario.fullName.includes('INTERSUL') },
    { label: 'CONSORCIO INTERNORTE TRANSPORTES', filterFn: (row) => row.beneficiarioUsuario.fullName.includes('INTERNORTE') },
    { label: 'CONSORCIO TRANSCARIOCA DE TRANSPORTES', filterFn: (row) => row.beneficiarioUsuario.fullName.includes('TRANSCARIOCA') },
    { label: 'CONSORCIO SANTA CRUZ TRANSPORTES', filterFn: (row) => row.beneficiarioUsuario.fullName.includes('SANTA CRUZ') },
    { label: 'MOBIRIO', filterFn: (row) => row.beneficiarioUsuario.fullName.includes('MUNICIPAL') },
    { label: 'CONCESSIONARIA DO VLT CARIOCA S.A.', filterFn: (row) => row.beneficiarioUsuario.fullName.includes('VLT') },
];

const predefinedFiltersStatus = [
    { label: 'Todos', filterFn: () => true },
    { label: 'Pago', filterFn: (row) => row.statusPago.includes('Pago') },
    { label: 'Erro', filterFn: (row) => row.statusPago.includes('Não Pago') },
];



const columns = [
    { field: 'beneficiarioUsuario', headerName: 'Beneficiário', width: 380, editable: false, cellClassName: 'noWrapName', renderCell: (params) => <p>{params?.value.fullName}</p> },
    { field: 'valorPagamentoUnico', headerName: 'Valor a ser pago', width: 145, editable: false, renderCell: (params) => <p >{params.value ? formatter.format(params?.value) : ''}</p> },
    { field: 'dataPagamentoUnico', headerName: 'Data Pagamento', width: 145, editable: false,  renderCell: (params) => <p >{params.value ? format(new Date(params?.value), 'dd/MM/yyyy'): ''}</p> },
    { field: 'diaSemana', headerName: 'Dia da semana', width: 180, editable: false },
    { field: 'tipoPagamento', headerName: 'Tipo Pagamento', width: 180, editable: false },
    {
        field: 'status',
        headerName: 'Status de Aprovação',
        width: 200,
        editable: false,
        renderCell: (params) => (
            <CustomBadge
                status={params.value}
                aprovacao={params.row.aprovacao}
            />
        )
    },
    { field: 'ocorrencia', headerName: 'Ações', width: 150, editable: false, cellClassName: 'noWrapName' },
];

const formatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
});

const CustomBadge = ({ status, aprovacao }) => {

    const getStatusLabel = () => {
        if (aprovacao === false) return "Livre de aprovação";
        if (status === true) return "Aprovado";
        if (status === false) return "Não Aprovado";
        return "";
    };

    const getColor = () => {
        if (aprovacao === false) return "info";
        return status ? "success" : "warning";
    };

    return (
        <Badge
            badgeContent={getStatusLabel()}
            color={getColor()}
        />
    );
};

export function TableRemessa() {
    const dispatch = useDispatch()
    const selectedDate = useSelector(state => state.release.selectedDate)
    const selectedYear = useSelector(state => state.release.selectedYear)
    const bookings = useSelector((state) => state.automation.bookings)

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
    const [errors, setErrors] = useState({
        mes: false,
        periodo: false,
    });
    const { register } = useForm()


   
    useEffect(() => {
        setRows(bookings)

    },[bookings])




 




 
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
               
            </div>


        </GridToolbarContainer>
    );

 

    return (

        <>
                <Box className="w-full md:mx-9 p-24 relative mt-32">

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
                            slots={{ toolbar: ToolBarCustom }}
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
        </>
    );
}
