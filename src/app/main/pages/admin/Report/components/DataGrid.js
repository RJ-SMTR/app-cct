import React, { useEffect, useState } from 'react';
import {
    DataGrid,
    GridToolbarContainer,
    GridToolbarExport,
    GridToolbarQuickFilter,
    useGridApiRef
} from '@mui/x-data-grid';
import {
    Box,
    MenuItem,
    Stack,
    IconButton,
    FormGroup,
    Menu,
    FormControlLabel,
    Checkbox,
    Button
} from '@mui/material';
import { DateRangePicker } from 'rsuite';
import jwtServiceConfig from 'src/app/auth/services/jwtService/jwtServiceConfig';
import { api } from 'app/configs/api/api';
import { ptBR as pt } from '@mui/x-data-grid';
import FilterListIcon from '@mui/icons-material/FilterList';
import { parseISO, format } from 'date-fns';
import { Badge } from '@mui/material';

const locale = pt;

const predefinedFilters = [
    { label: 'Todos', filterFn: () => true },
    { label: 'STPC', filterFn: (row) => row.consorcio.includes('STPC') },
    { label: 'MobiRio', filterFn: (row) => row.consorcio.includes('MobiRio') },
    { label: 'Internorte', filterFn: (row) => row.consorcio.includes('Internorte') },
    { label: 'Intersul', filterFn: (row) => row.consorcio.includes('Intersul') },
    { label: 'Transcarioca', filterFn: (row) => row.consorcio.includes('Transcarioca') },
    { label: 'VLT', filterFn: (row) => row.consorcio.includes('VLT') },
];

const columns = [
    { field: 'date', headerName: 'Data Efetivação', width: 180, editable: false },
    { field: 'dateExpire', headerName: 'Data Vencimento', width: 180, editable: false },
    { field: 'favorecido', headerName: 'Favorecido', width: 220, editable: false, cellClassName: 'noWrapName' },
    { field: 'consorcio', headerName: 'Consórcio', width: 180, editable: false },
    { field: 'value', headerName: 'Valor Real Efetivado', width: 180, editable: false },
    {
        field: 'status',
        headerName: 'Status',
        width: 180,
        editable: false,
        renderCell: (params) => <CustomBadge data={params.value} />
    },
    { field: 'ocorrencia', headerName: 'Ocorrência', width: 220, editable: false, cellClassName: 'noWrapName' },
];

const formatToBRL = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const CustomBadge = (data) => {
    return (
        <Badge
            badgeContent={data.data === true ? 'Pago' : 'Erro'}
            color={data.data === true ? 'success' : 'error'}
        />
    );
};

export default function BasicEditingGrid() {
    const [rowModesModel, setRowModesModel] = useState({});
    const [rows, setRows] = useState([]);
    const [date, setDate] = useState([]);
    const [checkedFilters, setCheckedFilters] = useState(new Array(predefinedFilters.length).fill(false));
    const [loading, setLoading] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const openMenu = Boolean(anchorEl);
    const apiRef = useGridApiRef();

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
                        status: item.isPago,
                        ocorrencia: item.ocorrencias.join(', '),
                    }));
                    setRows(formattedRows);
                } catch (error) {
                    console.error(error);
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        }
    }, [date]);

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

    const applyFilters = () => {
        const activeFilters = predefinedFilters
            .filter((_, i) => checkedFilters[i])
            .map(({ filterFn }) => filterFn);

        if (activeFilters.length === 0) {
            return rows;
        }

        return rows.filter(row => activeFilters.some(filterFn => filterFn(row)));
    };

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
    };

    const filteredRows = applyFilters();



    const ToolBarCustom = () => (
        <GridToolbarContainer className='w-[100%] flex justify-between'>
            <GridToolbarQuickFilter />
            <GridToolbarExport  printOptions={{
                allColumns: true,
                fileName: 'my_exported_file',
                orientation: 'landscape',
                pageSize: 'A4',
                scale: 0.8,
            }}  />
        </GridToolbarContainer>
    );

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
            <Stack direction="row" gap={1} mb={1} flexWrap="wrap">
                <Box className="flex items-center">
                    <p onClick={handleClick}>Filtrar por consórcio</p>
                    <IconButton className='fs-small' onClick={handleClick}>
                        <FilterListIcon />
                    </IconButton>
                </Box>
                <Menu anchorEl={anchorEl} open={openMenu} onClose={handleCloseMenu}>
                    <FormGroup>
                        {predefinedFilters.map(({ label }, index) => (
                            <MenuItem key={label}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={checkedFilters[index]}
                                            onChange={() => handleCheckboxChange(index)}
                                            name={label}
                                        />
                                    }
                                    label={`${label}`}
                                />
                            </MenuItem>
                        ))}
                    </FormGroup>
                </Menu>
            </Stack>
            <div style={{ height: 600, width: '100%' }}>
                <DataGrid
                    localeText={locale.components.MuiDataGrid.defaultProps.localeText}
                    rows={filteredRows}
                    disableColumnFilter
                    disableColumnSelector
                    disableDensitySelector
                    disableMultipleColumnsFiltering={false}
                    apiRef={apiRef}
                    columns={columns}
                    slots={{ toolbar: ToolBarCustom }}
                    loading={loading}
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
            <Box>
                {/* Valor Total: R$ {sumTotal} */}
            </Box>
        </Box>
    );
}
