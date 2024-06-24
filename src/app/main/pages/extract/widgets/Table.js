import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import { memo, useContext, useEffect, useRef } from 'react';
import { useState } from 'react';
import DateRangePicker from 'rsuite/DateRangePicker';

import Button from '@mui/material/Button';
import { Box, CircularProgress, Hidden, Skeleton } from '@mui/material';
import Popover from '@mui/material/Popover';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { ExtractContext } from 'src/app/hooks/ExtractContext';
import { makeStyles } from '@mui/styles';
import { locale } from '../utils/locale';

import { CustomTable } from 'src/app/main/components/TableComponents';
import { format, parseISO, startOfWeek, endOfWeek, addDays, isAfter, startOfDay, getMonth, getYear, formatISO } from 'date-fns';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';

import { useDispatch, useSelector } from 'react-redux';

import { getStatements, setPreviousDays, setDateRange, setSearchingWeek, setSearchingDay, setValorAcumuladoLabel, setValorPagoLabel } from 'app/store/extractSlice';
import { useNavigate } from 'react-router-dom';
import { selectUser } from 'app/store/userSlice';

import { DatePicker, MobileDatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers';
import ptBR from 'date-fns/locale/pt-BR';

function TableTransactions({ id }) {
    const dispatch = useDispatch()
    const user = useSelector(selectUser)
    const {
        statements,
        previousDays,
        dateRange,
        searchingDay,
        searchingWeek,
        fullReport,
    } = useSelector((state) => state.extract);
    const MemoizedCustomTable = memo(CustomTable);



    const [currentWeekStart, setCurrentWeekStart] = useState()
    const [isGreaterThanToday, setIsGreaterThanToday] = useState(false)
    const [filterMenu, setFilterMenu] = useState(null);
    const [page, setPage] = useState(0);
    const [lastDate, setLastDate] = useState([])
    const [rowsPerPage, setRowsPerPage] = useState(8);
    const [isLoading, setIsLoading] = useState(true)
    const [selectedDate, setSelectedDate] = useState(null)

    const navigate = useNavigate()
    const useStyles = makeStyles(() => ({
        root: {
            "& .MuiTablePagination-spacer": { display: "none" },
            "& .MuiBadge-badge": { display: "inline", position: 'relative', padding: '3px' },
            "& .MuiBadge-badge": { display: "inline", position: 'relative', padding: '3px' },
        },
    }));
    const c = useStyles()

    const previousStatementsRef = useRef([]);
    useEffect(() => {
        if (searchingWeek || searchingDay) {
            if (dateRange !== previousStatementsRef.current) {
                setLastDate([previousStatementsRef.current[0], previousStatementsRef.current[previousStatementsRef.current.length - 1]]);
                previousStatementsRef.current = dateRange;
            }
        }

    }, [dateRange])

    const handleBackPage = (event) => {
        setPage(page - 1)
    }

    const handleNextPage = (event) => {
        setPage(page + 1)
    }

    const handleNextWeek = () => {
        const nextWeekStart = new Date(currentWeekStart)
        nextWeekStart.setDate(nextWeekStart.getDate() + 7)
        setCurrentWeekStart(nextWeekStart)
        setIsLoading(true)

    }


    const handlePreviousWeek = () => {
        const previousWeekStart = new Date(currentWeekStart)
        previousWeekStart.setDate(previousWeekStart.getDate() - 7)
        setCurrentWeekStart(previousWeekStart)
        setIsLoading(true)
    }

    function isEndDateGreaterThanToday(endDate) {
        const today = new Date();
        const startOfToday = startOfDay(today)

        return isAfter(endDate, startOfToday)
    }
    useEffect(() => {
        const startDate = new Date(currentWeekStart)
        const endDate = new Date(currentWeekStart)
        endDate.setDate(endDate.getDate() - 6)
        startDate.setDate(startDate.getDate())
        if (currentWeekStart) {
            setIsGreaterThanToday(isEndDateGreaterThanToday(startDate))
            dispatch(setDateRange([endDate, startDate]))
        }
    }, [currentWeekStart])


    const handleChangePage = (event, newPage) => {
        setPage(newPage)
    }

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(+event.target.value)
        setPage(0)
    }

    useEffect(() => {
        setPreviousDays("lastMonth");
        if (user.role.name === "Admin") {
            dispatch(getStatements(previousDays, dateRange, searchingDay, searchingWeek, id))
                .then((response) => {
                    setIsLoading(false)
                })
        } else {
            dispatch(getStatements(previousDays, dateRange, searchingDay, searchingWeek))
                .then((response) => {
                    setIsLoading(false)
                })
        }


    }, [previousDays, dateRange])



    const filterMenuClick = (event) => {
        setFilterMenu(event.currentTarget);
    }

    const filterMenuClose = () => {
        setFilterMenu(null);
    }
    const handleDays = (event) => {
        setSelectedDate(null);
        const previousDays = event.currentTarget.dataset.value;
        dispatch(setPreviousDays(previousDays))
        setFilterMenu(null)
        setPage(0)
        dispatch(setDateRange([]))
        dispatch(setSearchingWeek(false))
        dispatch(setSearchingDay(false))
        setIsLoading(true)
        dispatch(setValorAcumuladoLabel('Valor Transação - Acumulado Mensal'))
        dispatch(setValorPagoLabel('Valor Pago - Acumulado Mensal'))

    }


    const handleSelectedDate = (newValue) => {
        console.log("newDate", newDate)
        setSelectedDate(newValue);
        const newDate = formatISO(newValue).substring(0, 7)
        dispatch(setDateRange(newDate))
    }


    const handleClickRow = (event) => {
        setIsLoading(true)
        const start = event.target.innerText;
        const [day, month, year] = start.split('/');
        const transformedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        const tz = 'America/Sao_Paulo';

        if (fullReport) {
            if (searchingWeek) {
                dispatch(setSearchingDay(true))
                dispatch(setValorAcumuladoLabel('Valor Transação - Acumulado Diário'));
                dispatch(setValorPagoLabel('Valor Pago - Acumulado Diário'));

                dispatch(setDateRange([transformedDate, transformedDate]));
            } else {
                if (!searchingWeek) dispatch(setValorAcumuladoLabel('Valor Transação - Acumulado Semanal'));
                if (!searchingWeek) dispatch(setValorPagoLabel('Valor Pago - Acumulado Semanal'));

                if (searchingWeek) dispatch(setValorAcumuladoLabel('Valor Transação - Acumulado Mensal'));
                if (searchingWeek) dispatch(setValorPagoLabel('Valor Pago - Acumulado Mensal'));
                const clickedDate = parseISO(transformedDate);
                const clickedDateToday = utcToZonedTime(clickedDate, tz);
                setCurrentWeekStart(clickedDateToday);
                dispatch(setSearchingWeek(true));
                setPage(0);
            }
        } else {
            navigate('/extrato')
        }
    }

    const handleBack = () => {
        setSelectedDate(null);
        if (searchingDay) {
            dispatch(setValorAcumuladoLabel('Valor Transação - Acumulado Semanal'));
            dispatch(setValorPagoLabel('Valor Pago - Acumulado Semanal'));
            dispatch(setDateRange(lastDate))
            setPage(0)
            dispatch(setSearchingDay(false))
            setIsLoading(true)
        } else {
            if (!searchingWeek) dispatch(setValorAcumuladoLabel('Valor Transação - Acumulado Semanal'));
            if (!searchingWeek) dispatch(setValorPagoLabel('Valor Pago - Acumulado Semanal'));
            if (searchingWeek) dispatch(setValorAcumuladoLabel('Valor Transação - Acumulado Mensal'));
            if (searchingWeek) dispatch(setValorPagoLabel('Valor Pago - Acumulado Mensal'));
            dispatch(setDateRange([]))
            setPage(0)
            setIsLoading(true)
            dispatch(setSearchingWeek(false))
        }
    }

    const { afterToday } = DateRangePicker;

    return (
        <Paper className="flex flex-col flex-auto p-12 mt-24 shadow rounded-2xl overflow-hidden">
            <div className="flex flex-row justify-between">
                <Typography className="mr-16 text-lg font-medium tracking-tight leading-6 truncate">
                    {searchingDay ? <p>Catracadas durante o dia</p> : (searchingWeek ? <p>Catracadas da semana</p> : <p>Valores recebidos</p>)}
                </Typography>

                {fullReport ? <> <Hidden smUp >
                    <div className="flex align-center">
                        <Button onClick={filterMenuClick}>
                            <FuseSvgIcon className="text-48" size={24} color="action">feather:filter</FuseSvgIcon>
                        </Button>

                        {!searchingWeek && !searchingDay ?
                            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
                                <MobileDatePicker
                                    label="Selecionar Mês"
                                    openTo="month"
                                    disableFuture
                                    closeOnSelect
                                    views={['year', 'month']}
                                    value={selectedDate}
                                    onChange={handleSelectedDate}
                                />

                            </LocalizationProvider> : <></>}
                    </div>
                </Hidden>
                    <Popover
                        open={Boolean(filterMenu)}
                        anchorEl={filterMenu}
                        onClose={filterMenuClose}
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'center',
                        }}
                        transformOrigin={{
                            vertical: 'top',
                            horizontal: 'center',
                        }}
                        classes={{
                            paper: 'py-8',
                        }}
                    >
                        <MenuItem role="button" onClick={handleDays} data-value=''>
                            <ListItemText primary="Mês Atual" />
                        </MenuItem>
                    </Popover>

                    <Hidden smDown>
                        <div className='flex flex-wrap content-center justify-center'>

                            {!searchingWeek && !searchingDay ?
                                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
                                    <MobileDatePicker
                                        label="Selecionar Mês"
                                        openTo="month"
                                        disableFuture
                                        closeOnSelect
                                        views={['year', 'month']}
                                        value={selectedDate}
                                        onChange={handleSelectedDate}
                                    />

                                </LocalizationProvider> : <></>}


                            <Button className='self-center ml-10' variant="contained" onClick={handleDays} data-value={'lastMonth'}>Mês Atual</Button>

                        </div>
                    </Hidden></> : <></>}

            </div>

            <Box className="flex flex-col flex-auto mt-24  overflow-hidden">
                <div className="flex flex-row justify-between items-center mb-4">
                    {searchingWeek && (
                        <Button onClick={handleBack} variant="outlined">
                            Voltar
                        </Button>
                    )}
                </div>

                <TableContainer>
                    <Table className="min-w-full">
                        <TableHead>
                            <TableRow>
                                <TableCell>
                                    <Typography variant="body2" className="font-semibold whitespace-nowrap">
                                        {!searchingWeek ? 'Data' : 'Data Processamento'}
                                    </Typography>
                                </TableCell>
                                {searchingWeek ? <TableCell>
                                    <Typography variant="body2" className="font-semibold whitespace-nowrap">
                                        Catracadas
                                    </Typography>
                                </TableCell> : <></>}
                                <TableCell>
                                    <Typography variant="body2" className="font-semibold whitespace-nowrap">
                                        Valor Transação
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" className="font-semibold whitespace-nowrap">
                                        Valor para pagamento
                                    </Typography>
                                </TableCell>
                                {searchingWeek ? <></> :
                                    <>
                                        <TableCell>
                                            <Typography variant="body2" className="font-semibold whitespace-nowrap">
                                                Status
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" className="font-semibold whitespace-nowrap">
                                                Erro
                                            </Typography>
                                        </TableCell>
                                    </>}


                            </TableRow>
                        </TableHead>

                        <TableBody>

                            {isLoading || statements.length == 0 ? <TableCell colSpan={4}>

                                <p>Não há dados para sem exibidos</p>
                            </TableCell> : statements &&

                            statements?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((i) => {
                                const tz = 'UTC'
                                const date = parseISO(i.date ?? i.dateTime ?? i.partitionDate);
                                const zonedDate = utcToZonedTime(date, tz)
                                const formattedDate = format(zonedDate, 'dd/MM/yyyy');
                                return <MemoizedCustomTable data={i} c={c} date={formattedDate} handleClickRow={handleClickRow} />
                            })
                            }
                        </TableBody>
                    </Table>
                </TableContainer>

                {searchingWeek && !searchingDay && (
                    <TablePagination
                        className={`overflow-visible ${c.root}`}
                        rowsPerPageOptions={[5]}
                        component="div"
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        ActionsComponent={() => (
                            <div className="my-4 flex space-x-2">
                                <Button variant="text" onClick={handlePreviousWeek}>
                                    &lt; Semana Anterior                                </Button>
                                <Button disabled={isGreaterThanToday} variant="text" onClick={handleNextWeek}>
                                    Próxima Semana &gt;
                                </Button>
                            </div>
                        )}
                    />
                )}
                {searchingDay && (
                    //  Add legenda, 
                    <TablePagination
                        className={`overflow-visible ${c.root}`}
                        rowsPerPageOptions={[8]}
                        component="div"
                        count={statements.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        ActionsComponent={() => (
                            <div className="my-4 flex space-x-2">
                                <Button variant="text" onClick={handleBackPage} disabled={page === 0}>
                                    &lt; Página Anterior                                </Button>
                                <Button variant="text" onClick={handleNextPage} disabled={page >= Math.ceil(statements.length / rowsPerPage) - 1}>
                                    Próxima Página &gt;
                                </Button>
                            </div>
                        )}

                    />
                )}
            </Box>
        </Paper>
    );
}

export default memo(TableTransactions);
