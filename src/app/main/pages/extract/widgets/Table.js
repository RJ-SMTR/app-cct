import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableFooter from '@mui/material/TableFooter';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import { memo, useContext, useEffect } from 'react';
import { useState } from 'react';
import DateRangePicker from 'rsuite/DateRangePicker';

import Button from '@mui/material/Button';
import { Hidden, Skeleton } from '@mui/material';
import Popover from '@mui/material/Popover';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { ExtractContext } from 'src/app/hooks/ExtractContext';
import { makeStyles } from '@mui/styles';
import { locale } from '../utils/locale';
import { Badge } from '@mui/material';
import { setDate } from 'date-fns';


function TableTransactions() {
    const [currentWeekStart, setCurrentWeekStart] = useState(new Date())
    const [searchingWeek, setSearchingWeek] = useState(false)
    const [filterMenu, setFilterMenu] = useState(null);
    const { getStatements, previousDays, setPreviousDays, statements, setDateRange, dateRange } = useContext(ExtractContext);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(8);
    // CUSTOM STYLES
    const useStyles = makeStyles(() => ({
        root: {

            "& .muiltr-1psng7p-MuiTablePagination-spacer": { display: "none" },
            "& .muiltr-1oaobgk-MuiBadge-badge": {display: "inline", position: 'relative', padding: '3px'},
            "& .muiltr-1nnvbx6-MuiBadge-badge": {display: "inline", position: 'relative', padding: '3px'},
        },
    }));
    const c = useStyles()
    // <----------------------->

    // PAGINANTION
    const handleNextWeek = () => {
        const nextWeekStart = new Date(currentWeekStart)
        nextWeekStart.setDate(nextWeekStart.getDate() + 7)
        setCurrentWeekStart(nextWeekStart)
        setPage(0)
    }

    const handlePreviousWeek = () => {
        const previousWeekStart = new Date(currentWeekStart)
        previousWeekStart.setDate(previousWeekStart.getDate() - 7)
        setCurrentWeekStart(previousWeekStart)
        setPage(0)
    }


        useEffect(() => {
            const startDate = new Date(currentWeekStart)
            const endDate = new Date(currentWeekStart)
            endDate.setDate(endDate.getDate() + 6)
            console.log(startDate, endDate)
            setDateRange([startDate, endDate])
        }, [currentWeekStart])

    const handleChangePage = (event, newPage) => {
        setPage(newPage)
    }

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(+event.target.value)
        setPage(0)
    }

    useEffect(() => {
        getStatements(previousDays, dateRange)
    }, [previousDays, dateRange])
    useEffect(() => {
            setDateRange([])
    }, [])

    const filterMenuClick = (event) => {
        setFilterMenu(event.currentTarget);
    }

    const filterMenuClose = () => {
        setFilterMenu(null);
    }
    const handleDays = (event) => {
        setPreviousDays(parseInt(event.currentTarget.dataset.value))
        setFilterMenu(null)
        setPage(0)
        setDateRange([])
        setSearchingWeek(false)
    }

   
    const { afterToday } = DateRangePicker;

   

    const handleClickRow = (event) => {
        const start = event.target.innerText
        const [day, month, year] = start.split('/')
         const transformedDate =   `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
        setCurrentWeekStart(new Date(transformedDate))
        setSearchingWeek(true)
        setPage(0)
    }

    return (
        <Paper className="flex flex-col flex-auto p-12 mt-24 shadow rounded-2xl overflow-hidden">
            <div className="flex flex-row justify-between">
                <Typography className="mr-16 text-lg font-medium tracking-tight leading-6 truncate">
                    Valores recebidos
                </Typography>

                <Hidden smUp >
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
                            onChange={(newValue) => setDateRange(newValue)}

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
                            onChange={(newValue) => setDateRange(newValue)}

                        />
                        <Button className={previousDays == 7 ? 'active' : ''} variant="contained" onClick={handleDays} data-value={7}>7 dias</Button>
                        <Button className={`${previousDays == 14 ? 'active' : ''} mx-5 `} variant="contained" onClick={handleDays} data-value={14}>14 dias</Button>
                        <Button className={previousDays !== 7 && previousDays !== 14 ? 'active' : ''} variant="contained" onClick={handleDays} data-value=''>Mês todo</Button>

                    </div>
                </Hidden>

            </div>

            <div className="table-responsive mt-24">
                <Table className="simple w-full min-w-full">
                    {statements ? <>
                        <TableHead>

                            <TableRow>

                                <TableCell>
                                    <Typography
                                        color="text.secondary"
                                        className="font-semibold text-12 whitespace-nowrap"
                                    >
                                        Data
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography
                                        color="text.secondary"
                                        className="font-semibold text-12 whitespace-nowrap"
                                    >
                                        Valor
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography
                                        color="text.secondary"
                                        className="font-semibold text-12 whitespace-nowrap"
                                    >
                                        Status
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {statements
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((i) => {
                                    const date = new Date(`${i.date}T00:00:00Z`).toLocaleDateString('pt-BR', { timeZone: 'Etc/UTC', year: 'numeric', month: '2-digit', day: '2-digit' })
                                    return <TableRow key={i.id} className="hover:bg-gray-100 cursor-pointer">
                                            <TableCell component="th" scope="row" onClick={handleClickRow}>
                                                <Typography className="whitespace-nowrap">
                                                    {date}
                                                </Typography>
                                            </TableCell>
                                            <TableCell component="th" scope="row">
                                                <Typography className="whitespace-nowrap">
                                                    R$ {i.amount}
                                                </Typography>
                                            </TableCell>
                                            <TableCell component="th" scope="row">
                                                <Badge className={c.root}
                                                    color={i.status === 'falha' ? 'error' : i.status === 'sucesso' ? 'success' : 'default'}
                                                    badgeContent={i.status}
                                                />


                                            </TableCell>
                                        </TableRow>
                                })}

                        </TableBody>
                        {statements.length > 8 ?
                            <TableFooter>
                                <TablePagination
                                    className={`overflow-visible  ${c.root}`}
                                    rowsPerPageOptions={[5]}
                                    component="div"
                                    count={statements.length}
                                    rowsPerPage={rowsPerPage}
                                    page={page}
                                    onPageChange={handleChangePage}
                                    onRowsPerPageChange={handleChangeRowsPerPage}
                                />

                            </TableFooter>
                            : <></>}
                        {searchingWeek ? <TablePagination
                            className={`overflow-visible  ${c.root}`}
                            rowsPerPageOptions={[5]}
                            component="div"
                            count={statements.length}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                            ActionsComponent={() => (
                                <div className='my-24 flex'>
                                    <Button variant="contained" onClick={handlePreviousWeek} className="mr-5">
                                        Anterior
                                    </Button>
                                    <Button variant="contained" onClick={handleNextWeek}>
                                      Próxima
                                    </Button>
                                </div>
                            )}
                        />
                        : null}
                    </>
                        : <Skeleton variant='rounded' width={1044} height={342} />}
                </Table>

            </div>
        </Paper>
    );
}

export default memo(TableTransactions);
