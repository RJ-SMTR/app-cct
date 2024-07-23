import React, { useEffect, useState } from 'react';


import {
    Box,
    MenuItem,
    Stack,
    IconButton,
    FormGroup,
    Menu,
    FormControlLabel,
    Checkbox,
    Badge,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Autocomplete,
    TextField,
    Button
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import { ptBR as pt } from '@mui/x-data-grid';
import { parseISO, format } from 'date-fns';
import { useSelector } from 'react-redux';
import { DateRangePicker } from 'rsuite';

const locale = pt;



const predefinedFiltersStatus = [
    { label: 'Todos'},
    { label: 'Pago' },
    { label: 'Erro'},
];
const predefinedFilters = [
    { label: 'Todos'},
    { label: 'STPL'},
    { label: 'STPC'},
    { label: 'MobiRio'},
    { label: 'Internorte'},
    { label: 'Intersul'},
    { label: 'Transcarioca'},
    { label: 'Santa Cruz'},
    { label: 'VLT'},
];




export default function BasicEditingGrid() {
    const [rows, setRows] = useState([]);
    const synthData = useSelector(state => state.extract.synthData)
    const [checkedFilters, setCheckedFilters] = useState(new Array(predefinedFilters.length).fill(false));
    const [checkedFiltersStatus, setCheckedFiltersStatus] = useState(new Array(predefinedFiltersStatus.length).fill(false));
    const [consorcioAnchorEl, setConsorcioAnchorEl] = useState(null);
    const [statusAnchorEl, setStatusAnchorEl] = useState(null);
    const openConsorcioMenu = Boolean(consorcioAnchorEl);
    const openStatusMenu = Boolean(statusAnchorEl);

  useEffect(() => {
    setRows(synthData)
  }, [synthData])
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


    
    return (
        <Box className="w-full md:mx-9 p-24 relative mt-32">
            <header className="flex justify-between items-center">
                <h3 className="font-semibold mb-24">
                    Data Vigente: {format(new Date(), 'dd/MM/yyyy')}
                </h3>
              
            </header>
            
            <div style={{ height: '65vh', width: '100%' }} className='overflow-scroll'>
                <Table>
               
                    <TableHead className='items-center mb-4 '>
                        <Box className="flex items-center py-10 gap-10"> 
                            <Autocomplete
                                id='favorecidos'
                                className='w-[25rem] p-1'
                                options={[
                                    'João Salles de albuquerrque',
                                    'Transoeste International'
                                ]}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label='Selecionar Favorecido'
                                        variant='outlined'
                                        name='nome'

                                    />
                                )}
                            />
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
                                <DateRangePicker
                                    id="custom-date-input"
                                    showOneCalendar
                                    showHeader={false}
                                    placement='auto'
                                    placeholder="Selecionar Data"
                                    format='dd/MM/yy'
                                    character=' - '
                                />
                            </Box> 
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
                    
                        
                    </TableHead>
                    <TableBody>
                        {Object.entries(rows).map(([consorcio, group]) => (
                            <React.Fragment key={consorcio}>
                                <TableRow className='bg-slate-100'>
                                    <TableCell component="th" colSpan={8} style={{ backgroundColor: '#EAEAEA'}}>
                                        <Box className="flex justify-between">
                                            <p style={{ fontSize: '1.8rem', fontWeight: 'bold', }}> {consorcio}</p>
                                            <Box className="flex items-center gap-8">
                                                <p> Total: {group.total}</p>
                                                {Object.entries(group.totalsByStatus).map(([status, total]) => (
                                                    <Box key={`${consorcio}-${status}`}>
                                                        <p >Total {status}: {total}</p>
                                                    </Box>
                                                ))}
                                            </Box>
                                        </Box>
                                        
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell style={{ fontWeight: 'bold'}}>Data Efetivação</TableCell>
                                    <TableCell style={{ fontWeight: 'bold'}}>Data Vencimento</TableCell>
                                    <TableCell style={{ fontWeight: 'bold'}}>Favorecido</TableCell>
                                    <TableCell style={{ fontWeight: 'bold'}}>Consórcio</TableCell>
                                    <TableCell style={{ fontWeight: 'bold'}}>Valor transação</TableCell>
                                    <TableCell style={{ fontWeight: 'bold'}}>Status</TableCell>
                                    <TableCell style={{ fontWeight: 'bold'}}>Ocorrência</TableCell>
                                </TableRow>
                                {group.items.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.date}</TableCell>
                                        <TableCell>{item.dateExpire}</TableCell>
                                        <TableCell>{item.favorecido}</TableCell>
                                        <TableCell>{item.consorcio}</TableCell>
                                        <TableCell>{item.value}</TableCell>
                                        <TableCell>{item.status}</TableCell>
                                        <TableCell>{item.ocorrencia}</TableCell>
                                    </TableRow>
                                ))}
                                <TableRow>
                                    
                                </TableRow>
                                {Object.entries(group.totalsByStatus).map(([status, total]) => (
                                    <TableRow key={`${consorcio}-${status}`}>
                                        <TableCell colSpan={4} align="right">Total {status}:</TableCell>
                                        <TableCell colSpan={2}>{total}</TableCell>
                                    </TableRow>
                                ))}
                            </React.Fragment>
                        ))}
                    </TableBody>
                </Table>
            </div>

        </Box>
    );
}
