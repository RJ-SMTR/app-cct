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
import { memo, useEffect, useRef } from 'react';
import { useState } from 'react';

import Button from '@mui/material/Button';
import { Box, CircularProgress, Hidden, Skeleton } from '@mui/material';
import Popover from '@mui/material/Popover';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { makeStyles } from '@mui/styles';

import { CustomTable } from 'src/app/main/components/TableComponents';
import { format, parseISO, isAfter, startOfDay, formatISO } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';

import { useDispatch, useSelector } from 'react-redux';

import {
    getStatements,
    setPreviousDays,
    setDateRange,
    setSearchingWeek,
    setSearchingDay,
    setValorAcumuladoLabel,
    setValorPagoLabel,
    setLoading, setLoadingWeek,
    setLoadingPrevious,
    setOrdemPgto,
    setMocked
} from 'app/store/extractSlice';

import { showMessage } from 'app/store/fuse/messageSlice';

import { useNavigate } from 'react-router-dom';
import { selectUser } from 'app/store/userSlice';

import { MobileDatePicker } from '@mui/x-date-pickers';
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
        isLoadingWeek,
        isLoading,
        ordemPgtoId,
        mocked
    } = useSelector((state) => state.extract);
    const MemoizedCustomTable = memo(CustomTable);

    // REMOVER CARD

    const [currentWeekStart, setCurrentWeekStart] = useState()
    const [isGreaterThanToday, setIsGreaterThanToday] = useState(false)
    const [filterMenu, setFilterMenu] = useState(null);
    const [page, setPage] = useState(0);
    const [lastId, setLastId] = useState()
    const [lastDate, setLastDate] = useState([])
    const [rowsPerPage, setRowsPerPage] = useState(8);
    const [selectedDate, setSelectedDate] = useState(null)
    const [dataOrderDay, setDataOrderDay] = useState('')


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
    const previousOrder = useRef();
    useEffect(() => {
        if (searchingWeek || searchingDay) {
            if (ordemPgtoId !== previousOrder.current) {

                setLastId(previousOrder.current);
                previousOrder.current = ordemPgtoId;
            }
        }

    }, [ordemPgtoId])

    const handleBackPage = (event) => {
        setPage(page - 1)
    }

    const handleNextPage = (event) => {
        setPage(page + 1)
    }

    // const handleNextWeek = () => {
    //     const nextWeekStart = new Date(currentWeekStart)
    //     nextWeekStart.setDate(nextWeekStart.getDate() + 7)
    //     setCurrentWeekStart(nextWeekStart)
    //     dispatch( setLoading(true))
    //     dispatch(setLoadingWeek(true))
    //     dispatch(setLoadingPrevious(true))

    // }


    // const handlePreviousWeek = () => {
    //     const previousWeekStart = new Date(currentWeekStart)
    //     previousWeekStart.setDate(previousWeekStart.getDate() - 7)
    //     setCurrentWeekStart(previousWeekStart)
    //     dispatch(setLoading(true))
    //     dispatch(setLoadingWeek(true))
    //     dispatch(setLoadingPrevious(true))
    // }

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
        setPreviousDays("");
        if (user.role.name.includes("Admin")) {
            dispatch(getStatements(dateRange, searchingDay, searchingWeek, id, ordemPgtoId, mocked))

        } else {
            dispatch(getStatements(dateRange, searchingDay, searchingWeek, id, ordemPgtoId))

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
        dispatch(setLoading(true))
        dispatch(setLoadingWeek(true))
        dispatch(setLoadingPrevious(true))
        dispatch(setValorAcumuladoLabel('Valor Operação - Acumulado Mensal'))
        dispatch(setValorPagoLabel('Valor - Acumulado Mensal'))

    }


    const handleSelectedDate = (newValue) => {
        setSelectedDate(newValue);
        const newDate = formatISO(newValue).substring(0, 7)
        dispatch(setDateRange(newDate))
    }


    const handleClickRow = (idOrder, event) => {
        if (idOrder === null) {
            dispatch(showMessage({ message: 'Não há valores para serem apresentados.' }))
        } else {
            dispatch(setLoading(true))
            dispatch(setLoadingWeek(true))
            const start = event.target.innerText;
            const [day, month, year] = start.split('/');
            const transformedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            const tz = 'America/Sao_Paulo';

            setDataOrderDay(start)
            if (fullReport) {
                // if (searchingWeek && !mocked) {
                //     dispatch(setMocked(true))
                //     dispatch(setDateRange([transformedDate, transformedDate]));


                // } else 
                if (searchingWeek) {
                    dispatch(setValorAcumuladoLabel('Valor Operação - Detalhado'));
                    dispatch(setValorPagoLabel('Valor - Detalhado'));
                    dispatch(setDateRange([transformedDate, transformedDate]));
                    dispatch(setOrdemPgto(idOrder))
                    dispatch(setSearchingDay(true))
                    setPage(0)
                } else {
                    if (!searchingWeek) dispatch(setValorAcumuladoLabel('Valor Operação - Acumulado Semanal'));
                    if (!searchingWeek) dispatch(setValorPagoLabel('Valor - Acumulado Semanal'));
                    if (searchingWeek) dispatch(setValorAcumuladoLabel('Valor Operação - Acumulado Mensal'));
                    if (searchingWeek) dispatch(setValorPagoLabel('Valor - Acumulado Mensal'));
                    const clickedDate = parseISO(transformedDate);
                    const clickedDateToday = utcToZonedTime(clickedDate, tz);
                    setCurrentWeekStart(clickedDateToday);
                    dispatch(setSearchingWeek(true));
                    setPage(0);
                    dispatch(setOrdemPgto(idOrder))

                }
            } else {
                navigate('/extrato')
            }
        }

    }

    const handleBack = () => {
        // if(mocked && !searchingDay){
        //     dispatch(setMocked(false))
        //     dispatch(setDateRange(lastDate))

        // } else {
        setSelectedDate(null);
        dispatch(setLoadingWeek(true))
        dispatch(setLoadingPrevious(true))
        dispatch(setLoading(true))
        // dispatch(setMocked(false))
        if (searchingDay) {
            dispatch(setValorAcumuladoLabel('Valor Operação - Acumulado Semanal'));
            dispatch(setValorPagoLabel('Valor - Acumulado Semanal'));
            dispatch(setDateRange(lastDate))
            dispatch(setOrdemPgto(lastId))
            setPage(0)
            // dispatch(setMocked(true))
            dispatch(setSearchingDay(false))


        } else {
            if (!searchingWeek) dispatch(setValorAcumuladoLabel('Valor Operação - Acumulado Semanal'));
            if (!searchingWeek) dispatch(setValorPagoLabel('Valor - Acumulado Semanal'));
            if (searchingWeek) dispatch(setValorAcumuladoLabel('Valor Operação - Acumulado Mensal'));
            if (searchingWeek) dispatch(setValorPagoLabel('Valor - Acumulado Mensal'));
            setPage(0)
            dispatch(setSearchingWeek(false))

            if (selectedDate !== null) {
                const newDate = formatISO(selectedDate).substring(0, 7)
                dispatch(setDateRange(newDate))
            } else {
                dispatch(setDateRange([]))

            }


        }

        // }
    }



    return (
        <Paper className="flex flex-col flex-auto p-12 mt-24 shadow rounded-2xl overflow-hidden">
            <div className="flex flex-row justify-between">
                <Typography className="mr-16 text-lg font-medium tracking-tight leading-6 truncate">
                    {searchingDay ? <p>Detalhes da ordem</p> : (searchingWeek ? <p>Valores da semana</p> : <p>Valores recebidos</p>)}
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
                                        {searchingDay ? 'Data Transação' : searchingWeek ? 'Data Ordem de Pagamento' : 'Data'}
                                    </Typography>
                                </TableCell>
                                {searchingDay ? <TableCell>
                                    <Typography variant="body2" className="font-semibold whitespace-nowrap">
                                        Data Ordem Pagamento
                                    </Typography>
                                </TableCell> : <></>}
                                <TableCell>
                                    <Typography variant="body2" className="font-semibold whitespace-nowrap">
                                        Valor Total para Pagamento
                                    </Typography>
                                </TableCell>
                                {searchingDay ? <TableCell>
                                    <Typography variant="body2" className="font-semibold whitespace-nowrap">
                                        Tipo Operação
                                    </Typography>
                                </TableCell> : <></>}
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

                            {isLoading ?
                                <TableCell colSpan={4}>
                                    <Box className="flex justify-center items-center m-10">
                                        <CircularProgress />
                                    </Box>
                                </TableCell>
                                : statements?.length > 0 ?
                                    statements?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((i) => {
                                        const tz = 'UTC'
                                        const date = parseISO(i.data ?? i.dataCaptura ?? i.datetime_processamento);
                                        const zonedDate = utcToZonedTime(date, tz)
                                        const formattedDate = format(zonedDate, 'dd/MM/yyyy');
                                        const idOrdem = searchingWeek ? i.ids : i.ordemPagamentoAgrupadoId
                                        return <MemoizedCustomTable data={i} c={c} date={formattedDate} handleClickRow={(event) => handleClickRow(idOrdem, event)} lastDate={dataOrderDay} />
                                    }) :
                                    <TableCell colSpan={4}>
                                        <p>Não há dados para sem exibidos</p>
                                    </TableCell>
                            }
                        </TableBody>
                    </Table>
                </TableContainer>

                {searchingDay || searchingWeek ?

                    <TablePagination
                        className={`overflow-visible ${c.root}`}
                        component="div"
                        count={statements.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        labelRowsPerPage="Linhas por página"
                        labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                        rowsPerPageOptions={[10, 50, 100, 150]}
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
                    : <></>}
            </Box>
        </Paper>
    );
}

export default memo(TableTransactions);
