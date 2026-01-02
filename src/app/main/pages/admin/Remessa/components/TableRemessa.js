import React, { useEffect, useMemo, useState } from 'react';
import { utils, writeFile as writeFileXLSX } from 'xlsx';

import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import { MRT_Localization_PT_BR } from 'material-react-table/locales/pt-BR';
import {
    MRT_ToggleDensePaddingButton,
    MRT_ShowHideColumnsButton,
    MRT_ToggleFiltersButton,
} from 'material-react-table';
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
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
import Tooltip from '@mui/material/Tooltip';
import dayjs from 'dayjs';
import FilterListIcon from '@mui/icons-material/FilterList';
import { parseISO, format, getISODay } from 'date-fns';
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
import { editPayment, getBookings } from 'app/store/automationSlice';
import { ModalDelete } from './ModalDelete';
import { ModalApproval } from './ModalApproval';
import { ModalEdit } from './ModalEdit';
import { useLocation, useNavigate } from 'react-router-dom';
import { ColumnVisibility } from '@tanstack/react-table';



const predefinedFilters = [
    { label: 'Todos', filterFn: () => true },
    { label: 'CONSORCIO INTERSUL TRANSPORTES', filterFn: (row) => row.beneficiarioUsuario.fullName.includes('INTERSUL') },
    { label: 'CONSORCIO INTERNORTE TRANSPORTES', filterFn: (row) => row.beneficiarioUsuario.fullName.includes('INTERNORTE') },
    { label: 'CONSORCIO TRANSCARIOCA DE TRANSPORTES', filterFn: (row) => row.beneficiarioUsuario.fullName.includes('TRANSCARIOCA') },
    { label: 'CONSORCIO SANTA CRUZ TRANSPORTES', filterFn: (row) => row.beneficiarioUsuario.fullName.includes('SANTA CRUZ') },
    { label: 'MOBIRIO', filterFn: (row) => row.beneficiarioUsuario.fullName.includes('MUNICIPAL') },
    { label: 'CONCESSIONARIA DO VLT CARIOCA S.A.', filterFn: (row) => row.beneficiarioUsuario.fullName.includes('VLT') },
];

const predefinedApprovalStatus = [
    { label: 'Todos', filterFn: () => true },
    { label: 'Livre de aprovação', filterFn: (row) => row.aprovacao === false },
    { label: 'Aprovado', filterFn: (row) => row?.aprovacaoPagamento?.status === 1 },
    { label: 'Não Aprovado', filterFn: (row) => row?.aprovacao !== false && row?.aprovacaoPagamento?.status !== 1 },
];


const normalize = (s) => s?.toString().normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();


const weekdayNames = [null, 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];
const getDiaSemanaLabel = (row) => {
    const n = row?.diaSemana;
    if (typeof n === 'number') return weekdayNames[n] || '';
    if (typeof n === 'string' && /^\d+$/.test(n)) return weekdayNames[parseInt(n, 10)] || '';
    const dateVal = row?.dataPagamentoUnico ? new Date(row.dataPagamentoUnico) : null;
    if (dateVal && !isNaN(dateVal)) {
        const iso = getISODay(dateVal);
        return weekdayNames[iso] || '';
    }
    return '';
};

const predefinedFiltersDay = [
    { label: 'Todos', filterFn: () => true },
    { label: 'Segunda', filterFn: (row) => normalize(getDiaSemanaLabel(row)).includes('segunda') },
    { label: 'Terça', filterFn: (row) => normalize(getDiaSemanaLabel(row)).includes('terca')},
    { label: 'Quarta', filterFn: (row) => normalize(getDiaSemanaLabel(row)).includes('quarta')},
    { label: 'Quinta', filterFn: (row) => normalize(getDiaSemanaLabel(row)).includes('quinta')},
    { label: 'Sexta', filterFn: (row) => normalize(getDiaSemanaLabel(row)).includes('sexta')},
    { label: 'Sábado', filterFn: (row) => normalize(getDiaSemanaLabel(row)).includes('sabado')},
    { label: 'Domingo', filterFn: (row) => normalize(getDiaSemanaLabel(row)).includes('domingo')},
];




export function TableRemessa() {

    const location = useLocation();
    const navigate = useNavigate();

    const dispatch = useDispatch()
    const bookings = useSelector((state) => state.automation.bookings)

    const [rows, setRows] = useState([]);
    const [openDelete, setOpenDelete] = useState(false)
    const [openApproval, setOpenApproval] = useState(false)
    const [openEdit, setOpenEdit] = useState(false)
    const [selectedRow, setSelectedRow] = useState()
    const [checkedFilters, setCheckedFilters] = useState(new Array(predefinedFilters.length).fill(false));
    const [checkedFiltersStatus, setCheckedFiltersStatus] = useState(new Array(predefinedApprovalStatus.length).fill(false));
    const [filterDate, setFilterDate] = useState(null);
    const [checkedFiltersDay, setCheckedFiltersDay] = useState(new Array(predefinedFiltersDay.length).fill(false));
    const [loading, setLoading] = useState(false);
    const [consorcioAnchorEl, setConsorcioAnchorEl] = useState(null);
    const [statusAnchorEl, setStatusAnchorEl] = useState(null);
    const [expandedGroupIds, setExpandedGroupIds] = useState([]);
    const openConsorcioMenu = Boolean(consorcioAnchorEl);
    const openStatusMenu = Boolean(statusAnchorEl);
    const [errors, setErrors] = useState({
        mes: false,
        periodo: false,
    });
    const { register } = useForm()



    useEffect(() => {
        setRows(bookings)

    }, [bookings])


    const CellLink = () => (
        <Button
            variant="contained"
            size="small"
            onClick={() => navigate('/aprovar')}
            sx={{
                backgroundColor: '#0DB1E3',
                color: '#fff',
               
                '&:hover': { backgroundColor: '#0CA0CC' },
            }}
        >
            Ver Mais
        </Button>
    );


    const CellActions = ({ row }) => (
        <Box className="flex items-center gap-6">
            <Tooltip title="Editar" arrow>
                <IconButton size="small" onClick={() => { setOpenEdit(true); setSelectedRow(row); }} sx={{ fontSize: '1.1rem', color: '#0288d1' }}>
                    <EditIcon fontSize="small" />
                </IconButton>
            </Tooltip>
            <Tooltip title="Excluir" arrow>
                <IconButton size="small" onClick={handleDeleteClick(row)} sx={{ fontSize: '1.1rem', color: '#FF4C4C' }}>
                    <DeleteIcon fontSize="small" />
                </IconButton>
            </Tooltip>
            <Button
                variant="contained"
                size="small"
                onClick={handleAtivar(row)}
                // disabled={row.aprovacao === false || row.aprovacaoPagamento?.status === 1}
                sx={{ fontSize: '1.1rem',
                    backgroundColor: 'green',
                    color: '#fff',
                    '&:hover': { backgroundColor: 'green' }
                }}
            >
                {row?.status ? 'Desativar' : 'Ativar'}
            </Button>
            <Button
                variant="contained"
                size="small"
                onClick={handleApprovalClick(row)}
                disabled={row.aprovacao === false || row.aprovacaoPagamento?.status === 1}
                sx={{ fontSize: '1.1rem',
                    backgroundColor: '#0DB1E3',
                    color: '#fff',
                    '&:hover': { backgroundColor: '#0DB1E3' }
                }}
            >
                {row.aprovacaoPagamento?.status === 1 ? 'Aprovado' : 'Aprovar'}
            </Button>
        </Box>
    );


    const handleDeleteClick = (row) => () => {
        
        setOpenDelete(true)
        setSelectedRow(row)
    };

    const handleApprovalClick = (row) => () => {
        setOpenApproval(true)
        setSelectedRow(row)
    };

    const handleAtivar = (row) => async () => {
        const status = !row.status
        try{

       const response = await dispatch(editPayment({
            id: row.id,
            status: status
        } ))
        if (response && [200, 201, 204].includes(response.status)) {
            dispatch(showMessage({ message: 'Ativado com sucesso!' }));
        }
        } catch (err) {
                  console.error(err);
                  dispatch(showMessage({ message: 'Erro ao ativar' }));
              }

    }

    

   

    const columns = [
        {
            accessorFn: (row) => `${row?.tipoBeneficiario ?? ''}|${getDiaSemanaLabel(row) ?? ''}|${row?.horario ? String(row.horario).split(':').slice(0, 2).join(':') : ''}`,
            id: 'grupoKey',
            header: 'Grupo',
            enableGrouping: true,
            Cell: ({ row }) => {
                if (row?.original?.isGroup) return <strong>{row.original.groupLabel}</strong>;
                return <span>{row.original.tipoBeneficiario}</span>;
            },
        },
        {
            accessorKey: 'beneficiarioUsuario.fullName',
            header: 'Beneficiário',
            size: 200,
            Cell: ({ row, cell }) => {
                if (row?.original?.isGroup) return <strong>{row.original.groupLabel}</strong>;
                return <span>{row.original.beneficiarioUsuario.fullName}</span>;
            },
        },
        {
            accessorKey: 'valorPagamentoUnico',
            header: 'Valor a ser pago',
            size: 145,
            aggregationFn: 'sum',
            Cell: ({ row,cell }) => {
                console.log(row.original)
                const valor = row?.original?.aprovacaoPagamento?.valorAprovado 
                if(valor > 0)
               return <span>{valor > 0 ? formatter.format(valor) : ''}</span>;
                const v = cell.getValue();
                return <span>{v ? formatter.format(v) : ''}</span>;
            },
         
        },
        {
            accessorKey: 'dataPagamentoUnico',
            header: 'Data Pagamento',
            size: 145,
            Cell: ({ cell }) => {
                const val = cell.getValue();
                return <span>{val ? format(new Date(val), 'dd/MM/yyyy') : ''}</span>;
            },
        },
        {
            accessorKey: 'diaSemana',
            header: 'Dia da semana',
            size: 150,
            Cell: ({ row }) => <span>{getDiaSemanaLabel(row.original)}</span>,
        },
        {
            accessorKey: 'horario',
            header: 'Horário',
            size: 75,
            Cell: ({ cell, row }) => {
                if (row?.original?.isGroup) return null;
                const val = cell.getValue();
                return <span>{val ? String(val).split(':').slice(0, 2).join(':') : ''}</span>;
            },
        },
        { accessorKey: 'tipoPagamento', header: 'Tipo', size: 110 },
        {
            accessorKey: 'status',
            header: 'Rodando',
            size: 100,
            Cell: ({ row, cell }) => 
                row?.original?.isGroup ? null : (
                    <span>{
                        cell.getValue() ? 'Ativo' : 'Pausado'}</span>)
        },
        {
            accessorKey: 'aprovacao',
            header: 'Status de Aprovação',
            size: 200,
            Cell: ({ row }) => (
                row?.original?.isGroup ? null : (
                    <CustomBadge
                        status={row?.original?.aprovacaoPagamento?.status}
                        aprovacao={row?.original?.aprovacao}
                    />
                )
            ),
        },
        {
            header: 'Ações',
            size: 260,
            Cell: ({ row }) => (
                row?.original?.isGroup
                    ? null
                    : (location.pathname === '/agendar' ? <CellLink /> : <CellActions row={row.original} />)
            ),
        },
    ];

    const formatter = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    });

    const CustomBadge = ({ status, aprovacao }) => {

        const getStatusLabel = () => {
            if (aprovacao === false) return "Livre de aprovação";
            if (status === 1) return "Aprovado";
            if (status !== 1) return "Não Aprovado";
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

        const activeFiltersStatus = predefinedApprovalStatus
            .filter((_, i) => checkedFiltersStatus[i])
            .map(({ filterFn }) => filterFn);

        const activeFiltersDay = predefinedFiltersDay
            .filter((_, i) => checkedFiltersDay[i])
            .map(({ filterFn }) => filterFn);

        if (activeFilters.length === 0 && activeFiltersStatus.length === 0 && activeFiltersDay.length === 0 && !filterDate) {
            return rows;
        }

        return rows.filter(row =>
            (activeFilters.length === 0 || activeFilters.some(filterFn => filterFn(row))) &&
            (activeFiltersStatus.length === 0 || activeFiltersStatus.some(filterFn => filterFn(row))) &&
            (activeFiltersDay.length === 0 || activeFiltersDay.some(filterFn => filterFn(row))) &&
            (!filterDate || (row.dataPagamentoUnico && format(new Date(row.dataPagamentoUnico), 'dd/MM/yy') === format(new Date(filterDate), 'dd/MM/yy')))
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



    const displayedRows = filteredRows;

    
  




    const ToolBarCustom = () => (
        <GridToolbarContainer className='w-[100%] flex justify-center my-20'>
            <div className="flex items-center">

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
                    <p>Filtrar por status de aprovação</p>
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
                            {predefinedApprovalStatus.map((filter, index) => (
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
                <Box className="flex items-center ml-6">
                    <p>Filtrar por data</p>
                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
                        <DatePicker
                            value={filterDate}
                            onChange={(newVal) => setFilterDate(newVal)}
                            format="dd/MM/yy"
                            slotProps={{ textField: { size: 'small' } }}
                        />
                    </LocalizationProvider>
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
            <div className='flex gap-10 ml-10'>
                <MRT_ShowHideColumnsButton table={table} />
                <MRT_ToggleDensePaddingButton table={table} />
            </div>


        </GridToolbarContainer>
    );



    const handleCloseDelete = () => setOpenDelete(false);
    const handleCloseApproval = () => setOpenApproval(false);


    const rowsForTable = useMemo(() => {
        if (!displayedRows || displayedRows.length === 0) return [];

        const map = new Map();
        displayedRows.forEach(row => {
            const diaSemana = getDiaSemanaLabel(row);
            const hora = row?.horario ? String(row.horario).split(':').slice(0, 2).join(':') : '';
            const key = `${row?.tipoBeneficiario ?? ''}|${diaSemana ?? ''}|${hora}`;
            const list = map.get(key) || [];
            list.push(row);
            map.set(key, list);
        });

        const out = [];
        map.forEach((list, key) => {
            if (list.length > 1) {
                const [tipo, dia, hora] = key.split('|');
                out.push({
                    id: `group-${key}`,
                    isGroup: true,
                    groupLabel: `${tipo} • ${dia} • ${hora} (${list.length})`,
                    children: list,
                });
            } else {
                out.push(list[0]);
            }
        });

        return out;
    }, [displayedRows]);


const columnVisibility = useMemo(() => {
    const base = { grupoKey: false };
    if (location.pathname === '/agendar') {
        return {
            ...base,
            valorPagamentoUnico: false,
            dataPagamentoUnico: false,
            tipoPagamento: false,
            aprovacao: false,
            status: false,
        };
    }
    return base;
}, [location.pathname]);

    const table = useMaterialReactTable({
        columns,
        data: rowsForTable,
        localization: MRT_Localization_PT_BR,
        enableTopToolbar: false,
        renderTopToolbarCustom: () => <ToolBarCustom />,
        enableColumnActions: false,
        enableColumnFilters: false,
        enableExpanding: true,
        getSubRows: (row) => (row.isGroup ? row.children : undefined),
        initialState: {
            density: 'compact',
            columnVisibility,
        },
        enablePagination: true,
        enableDensityToggle: true,
        state: { showProgressBars: loading, columnVisibility },
        muiTableBodyRowProps: { sx: { height: 42 } },
        muiTableContainerProps: { sx: { height: '45vh', overflowY: 'auto', backgroundColor: '#fff', boxShadow: 'none' } },
        muiTableBodyCellProps: { sx: { backgroundColor: '#fff', boxShadow: 'none', fontSize: '1.1rem' } },
        muiTableHeadRowProps: { sx: { backgroundColor: '#fff', boxShadow: 'none' } },
        muiTableHeadCellProps: { sx: { fontSize: '1.1rem' } },
        muiTablePaperProps: { elevation: 0, sx: { backgroundColor: '#fff', boxShadow: 'none' } },
    });

    return (
        <>
          
          
                <MaterialReactTable
                    table={table}
                />

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
            <ModalEdit
                openEdit={openEdit}
                handleCloseEdit={() => setOpenEdit(false)}
                row={selectedRow}
                setOpenEdit={setOpenEdit}
            />
              
        </>
    );
}
