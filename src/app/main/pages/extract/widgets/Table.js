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
import { Box, CircularProgress, Hidden } from '@mui/material';
import Popover from '@mui/material/Popover';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { ExtractContext } from 'src/app/hooks/ExtractContext';
import { makeStyles } from '@mui/styles';
import { locale } from '../utils/locale';

import { CustomTable } from 'src/app/main/components/TableComponents';
import { format, parseISO, startOfWeek, endOfWeek, addDays, isAfter, startOfDay } from 'date-fns';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';

import { useDispatch, useSelector } from 'react-redux';

import { getStatements, setPreviousDays,  setDateRange,  setSearchingWeek, setSearchingDay, setValorAcumuladoLabel } from 'app/store/extractSlice';
import { useNavigate } from 'react-router-dom';
import { selectUser } from 'app/store/userSlice';

function TableTransactions({id}) {
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

    const navigate =  useNavigate()
    const useStyles = makeStyles(() => ({
        root: {
            "& .MuiTablePagination-spacer": { display: "none" },
            "& .MuiBadge-badge": {display: "inline", position: 'relative', padding: '3px'},
            "& .MuiBadge-badge": {display: "inline", position: 'relative', padding: '3px'},
        },
    }));
    const c = useStyles()

    const previousStatementsRef = useRef([]);
    useEffect(() => {
        if(searchingWeek || searchingDay){
            if (dateRange !== previousStatementsRef.current) {
                setLastDate([previousStatementsRef.current[0], previousStatementsRef.current[previousStatementsRef.current.length - 1]]);
                previousStatementsRef.current = dateRange;
            }
        }
    
    }, [dateRange])

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
        if(currentWeekStart){
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
        const previousDays = event.currentTarget.dataset.value;
        dispatch(setPreviousDays(previousDays))
        setFilterMenu(null)
        setPage(0)
        dispatch(setDateRange([]))
        dispatch(setSearchingWeek(false))
        dispatch(setSearchingDay(false))
        setIsLoading(true)
        dispatch(setValorAcumuladoLabel('Valor acumulado Mensal'))

    }

   
    const { afterToday } = DateRangePicker;

   

    const handleClickRow = (event) => {
        setIsLoading(true)
        const start = event.target.innerText;
        const [day, month, year] = start.split('/');
        const transformedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        const tz = 'America/Sao_Paulo';
        if(!searchingWeek) dispatch(setValorAcumuladoLabel('Valor acumulado Semanal'));
        if(searchingWeek) dispatch(setValorAcumuladoLabel('Valor acumulado Mensal'));
        if(fullReport){
            if (searchingWeek) {
                dispatch(setSearchingDay(true))
                dispatch(setValorAcumuladoLabel('Valor acumulado Diário'));
        
               dispatch(setDateRange([transformedDate, transformedDate]));
           } else {
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
      
        if(searchingDay){
            dispatch(setValorAcumuladoLabel('Valor acumulado Semanal'));
            dispatch(setDateRange(lastDate))
            setPage(0)
            dispatch(setSearchingDay(false))
            setIsLoading(true)
        } else {
            if (!searchingWeek) dispatch(setValorAcumuladoLabel('Valor acumulado Semanal'));
            if (searchingWeek) dispatch(setValorAcumuladoLabel('Valor acumulado Mensal'));
            dispatch(setDateRange([]))
            setPage(0)
            setIsLoading(true)
            dispatch(setSearchingWeek(false))
        }
    }


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

                        <label htmlFor="custom-date-input" className='py-6 px-8' >
                            <FuseSvgIcon className="text-48" size={24} color="action">material-outline:edit_calendar</FuseSvgIcon>
                        </label>
                        <DateRangePicker
                            id="custom-date-input"
                            showOneCalendar
                            className='mobile'
                            placeholder="Selecionar Data"
                            appearance='subtle'
                            disabledDate={afterToday()}
                            format='dd/MM/yy'
                            locale={locale}
                            character=' - '
                            onChange={(newValue) => (dispatch(setDateRange(newValue)), dispatch(setSearchingWeek(false)))}

                        />
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
                        <MenuItem role="button" onClick={handleDays} data-value={7}>
                            <ListItemText primary="7 dias" />
                        </MenuItem>
                        <MenuItem role="button" onClick={handleDays} data-value={14}>
                            <ListItemText primary="14 dias" />
                        </MenuItem>
                        <MenuItem role="button" onClick={handleDays} data-value=''>
                            <ListItemText primary="Mês todo" />
                        </MenuItem>
                    </Popover>

                    <Hidden smDown>
                        <div>
                            <DateRangePicker
                                showOneCalendar
                                placeholder="Selecionar datas"
                                className='mr-5'
                                disabledDate={afterToday()}
                                format='dd/MM/yy'
                                character=' - '
                                locale={locale}
                                onChange={(newValue) => (dispatch(setDateRange(newValue)), dispatch(setSearchingWeek(false)))}

                            />
                            <Button className={previousDays == 'lastWeek' ? 'active' : ''} variant="contained" onClick={handleDays} data-value={'lastWeek'}>7 dias</Button>
                            <Button className={`${previousDays == 'last2Weeks' ? 'active' : ''} mx-5 `} variant="contained" onClick={handleDays} data-value={'last2Weeks'}>14 dias</Button>
                            <Button className={previousDays !== 'lastWeek' && previousDays !== 'last2Weeks' ? 'active' : ''} variant="contained" onClick={handleDays} data-value={'lastMonth'}>Mês todo</Button>

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
                                            Data
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" className="font-semibold whitespace-nowrap">
                                            {searchingWeek ? 'Arrecadado' : 'Valor'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" className="font-semibold whitespace-nowrap">
                                            {searchingWeek ? 'Catracadas' : 'Status'}
                                        </Typography>
                                    </TableCell>
                                  
                                </TableRow>
                            </TableHead>
                            
                        <TableBody>
                       
                            {isLoading ? <TableCell colSpan={4}>
                                {/* <Box className="flex justify-center items-center m-10">
                                    <CircularProgress />
                                </Box> */}
                                <p>Não há dados para sem exibidos</p>
                            </TableCell> :  statements &&
                              
                                statements?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((i) => {
                                    const date = parseISO(i.date ?? i.dateTime ?? i.partitionDate);
                                    const formattedDate = format(date, 'dd/MM/yyyy', { timeZone: 'Etc/UTC' });
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
            </Box>
        </Paper>
    );
}

export default memo(TableTransactions);
 