import React, { useEffect, useState } from 'react';
import { utils, writeFile as writeFileXLSX } from 'xlsx';

import {
    DataGrid,
    GridActionsCellItem,
    GridToolbarContainer,
    GridToolbarQuickFilter,
    useGridApiRef
} from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
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
    FormControl,
    Typography
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
import { getBookings } from 'app/store/automationSlice';
import { ModalDelete } from './ModalDelete';
import { ModalApproval } from './ModalApproval';


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

// Normalize helper to remove diacritics and lowercase for robust comparisons
const normalize = (s) => s?.toString().normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

const predefinedFiltersDay = [
    { label: 'Todos', filterFn: () => true },
    { label: 'Segunda', filterFn: (row) => normalize(row.diaSemana ?? '').includes('segunda') },
    { label: 'Terça', filterFn: (row) => normalize(row.diaSemana ?? '').includes('terca')},
    { label: 'Quarta', filterFn: (row) => normalize(row.diaSemana ?? '').includes('quarta')},
    { label: 'Quinta', filterFn: (row) => normalize(row.diaSemana ?? '').includes('quinta')},
    { label: 'Sexta', filterFn: (row) => normalize(row.diaSemana ?? '').includes('sexta')},
    { label: 'Sábado', filterFn: (row) => normalize(row.diaSemana ?? '').includes('sabado')},
    { label: 'Domingo', filterFn: (row) => normalize(row.diaSemana ?? '').includes('domingo')},
];




export function TableRemessa() {

    const dispatch = useDispatch()
    const bookings = useSelector((state) => state.automation.bookings)

    const [rowModesModel, setRowModesModel] = useState({});
    const [rows, setRows] = useState([]);
    const [openDelete, setOpenDelete] = useState(false)
    const [openApproval, setOpenApproval] = useState(false)
    const [selectedRow, setSelectedRow] = useState()
    const [checkedFilters, setCheckedFilters] = useState(new Array(predefinedFilters.length).fill(false));
    const [checkedFiltersStatus, setCheckedFiltersStatus] = useState(new Array(predefinedFiltersStatus.length).fill(false));
    const [checkedFiltersDay, setCheckedFiltersDay] = useState(new Array(predefinedFiltersDay.length).fill(false));
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

    }, [bookings])





    const CellActions = ({id, row}) => {


        return [
      
            <GridActionsCellItem
                icon={<EditIcon sx= {{ color: `white`, opacity: 1 }} />}
                label="Delete"
                onClick={handleDeleteClick(row)}
                color="inherit"
                sx={{
                    backgroundColor: '#0288d1',
                    '&:hover': {
                        backgroundColor: '#0288d1',
                    },
                    '&:disabled': {
                        backgroundColor: 'gray',
                        opacity: 0.8
                    },



                }}
            />,
            <GridActionsCellItem
                icon={<DeleteIcon sx= {{ color: `white`, opacity: 1 }} />}
                label="Delete"
                onClick={handleDeleteClick(row)}
                color="inherit"
                sx={{
                    backgroundColor: '#FF4C4C',
                    '&:hover': {
                        backgroundColor: '#FF4C4C',
                    },
                    '&:disabled': {
                        backgroundColor: 'gray',
                        opacity: 0.8
                    },



                }}
            />,
         
            <GridActionsCellItem icon={
                <Typography >
                    {row.status === true ? 'Aprovado' : 'Aprovar'} 
                </Typography>
            }
                className={`rounded p-1 uppercase text-white ${row.status === true ? 'disabled:bg-green disabled:text-white' : 'bg-[#0DB1E3]'}  disabled:bg-gray  min-h-[12px]  min-w-[90.82px] font-small px-10`}
                onClick={handleApprovalClick(row)}
                disabled={row.aprovacao === false || row.status === true}

                                                         
                                              />

        ]
    }


    const handleDeleteClick = (row) => () => {
        
        setOpenDelete(true)
        setSelectedRow(row)
    };

    const handleApprovalClick = (row) => () => {
        setOpenApproval(true)
        setSelectedRow(row)
    };

    

    const columns = [
        {
            field: 'beneficiarioUsuario',
            headerName: 'Beneficiário',
            width: 380,
            editable: false,
            cellClassName: 'noWrapName',
            valueGetter: (params) => params.row?.beneficiarioUsuario?.fullName || '',
            renderCell: (params) => <p>{params?.value}</p>
        },
        { field: 'valorPagamentoUnico', headerName: 'Valor a ser pago', width: 145, editable: false, renderCell: (params) => <p >{params.value ? formatter.format(params?.value) : ''}</p> },
        { field: 'dataPagamentoUnico', headerName: 'Data Pagamento', width: 145, editable: false, renderCell: (params) => <p >{params.value ? format(new Date(params?.value), 'dd/MM/yyyy') : ''}</p> },
        { field: 'diaSemana', headerName: 'Dia da semana', width: 150, editable: false , },
        { field: 'horario', headerName: 'Horário', width: 90, editable: false, renderCell: (params) => <p >{params.value ? params?.value.split(':').slice(0, 2).join(':') : ''}</p> },
        { field: 'tipoPagamento', headerName: 'Tipo Pagamento', width: 180, editable: false },
        {
            field: 'status',
            headerName: 'Status de Aprovação',
            width: 200,
            editable: false,
            valueGetter: (params) => {
                const aprovacao = params.row?.aprovacao;
                const status = params.row?.status;
                if (aprovacao === false) return 'Livre de aprovação';
                if (status === true) return 'Aprovado';
                if (status === false) return 'Não Aprovado';
                return '';
            },
            renderCell: (params) => (
                <CustomBadge
                    status={params.row?.status}
                    aprovacao={params.row?.aprovacao}
                />
            )
        },
        {
            field: 'id', type: 'actions', headerName: 'Ações', width: 200, editable: false, cellClassName: 'actions', getActions: ({ id, row }) => {
                return [<CellActions id={id} row={row} />];
            },

        },
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
            className='mt-20'
                badgeContent={getStatusLabel()}
                color={getColor()}
            />
        );
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

    const handleCheckboxChangeDay = (index) => {
        const newCheckedFiltersDay = [...checkedFiltersDay];
        newCheckedFiltersDay[index] = !newCheckedFiltersDay[index];
        setCheckedFiltersDay(newCheckedFiltersDay);
    };

    const applyFilters = () => {
        const activeFilters = predefinedFilters
            .filter((_, i) => checkedFilters[i])
            .map(({ filterFn }) => filterFn);

        const activeFiltersStatus = predefinedFiltersStatus
            .filter((_, i) => checkedFiltersStatus[i])
            .map(({ filterFn }) => filterFn);

        const activeFiltersDay = predefinedFiltersDay
            .filter((_, i) => checkedFiltersDay[i])
            .map(({ filterFn }) => filterFn);

        if (activeFilters.length === 0 && activeFiltersStatus.length === 0 && activeFiltersDay.length === 0) {
            return rows;
        }

        return rows.filter(row =>
            (activeFilters.length === 0 || activeFilters.some(filterFn => filterFn(row))) &&
            (activeFiltersStatus.length === 0 || activeFiltersStatus.some(filterFn => filterFn(row))) &&
            (activeFiltersDay.length === 0 || activeFiltersDay.some(filterFn => filterFn(row)))
        );
    };

    const handleConsorcioClick = (event) => {
        setConsorcioAnchorEl(event.currentTarget);
    };

    const handleStatusClick = (event) => {
        setStatusAnchorEl(event.currentTarget);
    };

    const [diaAnchorEl, setDiaAnchorEl] = useState(null);
    const openDiaMenu = Boolean(diaAnchorEl);

    const handleDiaClick = (event) => {
        setDiaAnchorEl(event.currentTarget);
    };

    const handleCloseDiaMenu = () => {
        setDiaAnchorEl(null);
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
                <Box className="flex items-center">
                    <p>Filtrar por dia</p>
                    <IconButton
                        id="dia-filter-button"
                        aria-controls={openDiaMenu ? 'dia-menu' : undefined}
                        aria-haspopup="true"
                        aria-expanded={openDiaMenu ? 'true' : undefined}
                        onClick={handleDiaClick}
                    >
                        <FilterListIcon />
                    </IconButton>
                    <Menu
                        id="dia-menu"
                        anchorEl={diaAnchorEl}
                        open={openDiaMenu}
                        onClose={handleCloseDiaMenu}
                    >
                        <FormGroup>
                            {predefinedFiltersDay.map((filter, index) => (
                                <MenuItem key={filter.label}>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={checkedFiltersDay[index]}
                                                onChange={() => handleCheckboxChangeDay(index)}
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



    const handleCloseDelete = () => setOpenDelete(false);
    const handleCloseApproval = () => setOpenApproval(false);
 

    return (

        <>
                <Box className="w-full md:mx-9 p-10 relative mt-32">

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
            <ModalDelete
                openDelete={openDelete}
                handleCloseDelete={handleCloseDelete}
                row={selectedRow}
                setOpenDelete={setOpenDelete}
              
            />

            <ModalApproval
                openApproval={openApproval}
                handleCloseApproval={handleCloseApproval}
                row={selectedRow}
                setOpenApproval={setOpenApproval}
              
            />
              
        </>
    );
}
