import { useEffect, useState } from 'react';
import { DataGrid, GridFilterListIcon, GridToolbar,ptBR as pt, useGridApiRef } from '@mui/x-data-grid';
import { Box, MenuItem, Stack, IconButton, FormGroup, Menu, FormControlLabel, Checkbox } from '@mui/material';

import { format } from 'date-fns';
import { useSelect } from '@mui/base';
import { DateRangePicker } from 'rsuite';
import { useDispatch } from 'react-redux';
import jwtServiceConfig from 'src/app/auth/services/jwtService/jwtServiceConfig';
import { api } from 'app/configs/api/api';

const locale = pt




const predefinedFilters = [
    {
        label: 'Todos',
        filterModel: { items: [] },
    },
    {
        label: 'STPC',
        filterModel: { items: [{ field: 'consorcio', operator: 'contains', value: 'STPC' }] },
    },
    {
        label: 'Processo B',
        filterModel: { items: [{ field: 'consorcio', operator: 'contains', value: 'Processo B' }] },
    },
    {
        label: 'Processo C',
        filterModel: { items: [{ field: 'consorcio', operator: 'contains', value: 'Processo C' }] },
    },

]


const columns = [
    { field: 'date', headerName: 'Data Efetivação', type: 'date', width: 180, editable: false },
    { field: 'favorecido', headerName: 'Favorecido', width: 220, editable: false, cellClassName: 'noWrapName' },
    {
        field: 'consorcio', headerName: 'Consórcio', width: 180, editable: false,
    },
    { field: 'value', headerName: 'Valor Real Efetivado', width: 180, editable: false },
    { field: 'status', headerName: 'Status', width: 180, editable: false },
    { field: 'ocorrencia', headerName: 'Ocorrência', width: 220, editable: false, cellClassName: 'noWrapName' },

];

export default function BasicEditingGrid() {
    const [rowModesModel, setRowModesModel] = useState({});
    const [initialRows, setInitialRows] = useState(false)
    const [sumTotal, setSumTotal] = useState()
    const [rows, setRows] = useState(initialRows)
    const [date, setDate] = useState([])
    const [checkedFilters, setCheckedFilters] = useState(
        new Array(predefinedFilters.length).fill(false)
    )
    const [anchorEl, setAnchorEl] = useState(null)
    const openMenu = Boolean(anchorEl);
    const apiRef = useGridApiRef()
    


    useEffect(() => {
        if (date.length > 0) {
        const fetch = async () => {
            const token = window.localStorage.getItem('jwt_access_token');

            let config = {
                method: 'get',
                maxBodyLength: Infinity,
                url: jwtServiceConfig.report + `?dt_inicio=${date[0]}&dt_fim=${date[1]}`,
                headers: { "Authorization": `Bearer ${token}` },
            }
            try {
                const response = await api.request(config)
                const formattedRows = response.data.map((item) => ({
                    id: item.id,
                    date: new Date(item.dataEfetivacao),
                    favorecido: item.favorecido,
                    consorcio: item.nomeConsorcio,
                    value: 'R$ ' + item.valor,
                    status: item.isPago,
                    ocorrencia: item.ocorrencias.map((i) => i).join(','),
                }));
                setRows(formattedRows);
            } catch (error) {
                console.error(error);
            }
        }
    fetch();
        }
    }, [date]);
    const handleDateChange = (data) => {
        if(data?.length > 0){
            const firstDate = format(data[0], 'yyyy-MM-dd')
            const lastDate = format(data[1], 'yyyy-MM-dd')
            setDate([firstDate, lastDate])
        }
    }

  
  
    const handleCheckboxChange = (index) => {
        console.log(index)
        const newCheckedFilters = [...checkedFilters];
        newCheckedFilters[index] = !newCheckedFilters[index];
        setCheckedFilters(newCheckedFilters);

        const activeFilters = predefinedFilters
            .filter((_, i) => newCheckedFilters[i])
            .map(({ filterModel }) => filterModel.items)
            .flat();

        apiRef.current.setFilterModel({
            items: activeFilters,
        });
        console.log(activeFilters)
    };


    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
    };

    return (
        <>
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
             
                {/* <Stack direction="row" gap={1} mb={1} flexWrap="wrap">
                    <IconButton onClick={handleClick}>
                        <GridFilterListIcon />
                    </IconButton>
                    <Menu anchorEl={anchorEl} open={openMenu} onClose={handleCloseMenu}>
                        <FormGroup>
                            {predefinedFilters.map(({ label }, index) => {
                                return (
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
                                );
                            })}
                        </FormGroup>
                    </Menu>
                </Stack> */}

                <div style={{ height: 600, width: '100%' }}>
                    <DataGrid
                        localeText={locale.components.MuiDataGrid.defaultProps.localeText}
                        rows={rows}
                        disableColumnFilter
                        disableColumnSelector
                        disableDensitySelector
                        apiRef={apiRef}
                        columns={columns}
                        pagination
                        slots={{ toolbar: GridToolbar }}
                        editMode="row"
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
                        experimentalFeatures={{ newEditingApi: true }}
                    />
                </div>
                <Box>
                    Valor Total:  R$ {sumTotal}
                </Box>
            </Box>
         


           

        
        </>
    );
}
