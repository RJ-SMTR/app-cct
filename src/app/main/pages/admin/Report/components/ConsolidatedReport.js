import React, { useEffect, useState } from 'react';
import {
    Box,
    MenuItem,
    IconButton,
    FormGroup,
    Menu,
    FormControlLabel,
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
    CircularProgress
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import { ptBR as pt } from '@mui/x-data-grid';
import { format } from 'date-fns';
import { useDispatch, useSelector } from 'react-redux';
import { DateRangePicker } from 'rsuite';
import { useForm, Controller } from 'react-hook-form';
import { handleReportInfo } from 'app/store/reportSlice';
import { getUser } from 'app/store/adminSlice';

const locale = pt;

const predefinedFiltersStatus = [
    { label: 'Todos' },
    { label: 'Pago' },
    { label: 'Erro' },
];
const predefinedFilters = [
    { label: 'Todos' },
    { label: 'STPL' },
    { label: 'STPC' },
    { label: 'MobiRio' },
    { label: 'Internorte' },
    { label: 'Intersul' },
    { label: 'Transcarioca' },
    { label: 'Santa Cruz' },
    { label: 'VLT' },
];

export default function BasicEditingGrid() {
    const reportType = useSelector(state => state.report.reportType);
    const reportList = useSelector(state => state.report.reportList)
    const userList = useSelector(state => state.admin.userList) || []
    const [favorecidoSearch, setFavorecidoSearch] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [loadingUsers, setLoadingUsers] = useState(false)
    const [userOptions, setUserOptions] = useState([])
    const [checkedFilters, setCheckedFilters] = useState(new Array(predefinedFilters.length).fill(false));
    const [checkedFiltersStatus, setCheckedFiltersStatus] = useState(new Array(predefinedFiltersStatus.length).fill(false));
    const [consorcioAnchorEl, setConsorcioAnchorEl] = useState(null);
    const [statusAnchorEl, setStatusAnchorEl] = useState(null);
    const openConsorcioMenu = Boolean(consorcioAnchorEl);
    const openStatusMenu = Boolean(statusAnchorEl);

    const dispatch = useDispatch()

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

    const { control, handleSubmit, register } = useForm({
        defaultValues: {
            nome: null,
            dateRange: []
        }
    });

    const onSubmit = (data) => {
        dispatch(handleReportInfo(data, reportType))
    };

    const fetchUsers = async () => {
        setLoadingUsers(true);
        dispatch(getUser());
        setLoadingUsers(false);
    };
    useEffect(() => {
        fetchUsers()
    },[])
    useEffect(() => {
        if (reportList.length > 0) {
            setIsLoading(false)
        }
    }, [reportList])

    useEffect(() => {
        if (userList && userList.length > 0) {
            const options = userList.map((user) => ({
                label: favorecidoSearch === 'cpf/cnpj' ? `${user.cpfCnpj} - ${user.fullName}` : `${user.fullName}`,
                value: user
            }));
            setUserOptions(options);
        } else {
            setUserOptions([]);
        }
    }, [favorecidoSearch, userList]);


    const handleSelectfavorecido = (event) => {
        setFavorecidoSearch(event.target.value);
    };
    useEffect(() => {
        console.log(userOptions)
    }, [userOptions])

    return (
        <>
            <Paper>
                <Box className="w-full md:mx-9 p-24 relative mt-32">
                    <header>
                        Filtros de Pesquisa
                    </header>

                    <Box className="flex items-center py-10 gap-10">
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <FormControl style={{ minWidth: '22rem' }}>
                                <InputLabel id="favorecido-select-label">Pesquisar favorecido por:</InputLabel>
                                <Select
                                    value={favorecidoSearch}
                                    labelId="favorecido-select-label"
                                    id='favorecido-select'
                                    label="Pesquisar favorecido por:"
                                    onChange={handleSelectfavorecido}
                                >
                                    <MenuItem value="cpf/cnpj">CPF/CNPJ</MenuItem>
                                    <MenuItem value="nome">Nome</MenuItem>
                                </Select>
                            </FormControl>
                            
                                    <Autocomplete
                                    {...register('name')}
                                        id="favorecidos"
                                        multiple
                                        className="min-w-[25rem] p-1"
                                            getOptionLabel={(option) => option.label}
                                         filterSelectedOptions
                                        options={userOptions}
                                        loading={loadingUsers}
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
                                        />
                                    )}
                                />
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
                    </header>

                    <div style={{ height: '65vh', width: '100%' }} className="overflow-scroll">
                        <Table>
                            <TableHead className="items-center mb-4">

                                <TableRow>
                                    <TableCell>Nome</TableCell>
                                    <TableCell>Valor</TableCell>
                                    <TableCell>Count</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {!isLoading ? reportList.map((report, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{report.nomeFavorecido}</TableCell>
                                        <TableCell>{report.valorRealEfetivado}</TableCell>
                                        <TableCell>{report.count}</TableCell>
                                    </TableRow>
                                )) : <></>}
                            </TableBody>
                        </Table>
                    </div>
                </Box>
            </Paper>
        </>
    );
}
