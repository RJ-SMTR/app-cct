import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
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
    get24
} from 'app/store/extractSlice';

import { useNavigate } from 'react-router-dom';
import { selectUser } from 'app/store/userSlice';

import { MobileDatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers';
import ptBR from 'date-fns/locale/pt-BR';

function TableTransactions({ data }) {
    const dispatch = useDispatch()
    const user = useSelector(selectUser)
    const {
        list24,
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

    const [filterMenu, setFilterMenu] = useState(null);
    const [page, setPage] = useState(0);
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











    const filterMenuClick = (event) => {
        setFilterMenu(event.currentTarget);
    }

    const filterMenuClose = () => {
        setFilterMenu(null);
    }



    const handleSelectedDate = (newValue) => {
        setSelectedDate(newValue)
        dispatch(get24(newValue, data.id))
    }





    return (
        <Paper className="flex flex-col flex-auto p-12 mt-24 shadow rounded-2xl overflow-hidden">
            <div className="flex sm:flex-row flex-col justify-between">
                <Typography className="mr-16 text-lg font-medium tracking-tight leading-6 truncate">
                    <p>Valores recebidos</p>
                </Typography>

                <Hidden smUp >
                    <div className="flex align-center">

                        {!searchingWeek && !searchingDay ?
                            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
                                <MobileDatePicker
                                    label="Selecionar Mês"
                                    openTo="month"
                                    closeOnSelect
                                    minDate={new Date('2024-09-01')}
                                    maxDate={new Date('2025-01-01')}
                                    defaultValue={new Date('2024-12-31')}
                                    views={['month']}
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

                </Popover>

                <Hidden smDown>
                    <div className='flex flex-wrap content-center justify-center'>

                        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
                            <MobileDatePicker
                                label="Selecionar Mês"
                                openTo="month"
                                closeOnSelect
                                minDate={new Date('2024-06-01')}

                                maxDate={new Date('2025-01-01')}
                                defaultValue={new Date('2024-12-31')}
                                views={['month']}
                                value={selectedDate}
                                onChange={handleSelectedDate}
                            />

                        </LocalizationProvider>

                    </div>
                </Hidden>

            </div>

            <Box className="flex flex-col flex-auto mt-24  overflow-hidden">

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
                                        Valor Pago
                                    </Typography>
                                </TableCell>
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

                            </TableRow>
                        </TableHead>

                        <TableBody>

                            {isLoading ?
                                <TableCell colSpan={4}>
                                    <Box className="flex justify-center items-center m-10">
                                        <CircularProgress />
                                    </Box>
                                </TableCell>
                                : list24?.length > 0 ?
                                    list24?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((i) => {
                                        const tz = 'UTC'
                                        const zonedDate = utcToZonedTime(i.dataVencimento, tz)
                                        const formattedDate = format(zonedDate, 'dd/MM/yyyy');
                                        return <MemoizedCustomTable data={i} c={c} date={formattedDate} lastDate={dataOrderDay} ano={24} />
                                    }) :
                                    <TableCell colSpan={4}>
                                        <p>Não há dados para sem exibidos</p>
                                    </TableCell>
                            }
                        </TableBody>
                    </Table>
                </TableContainer>

            </Box>
        </Paper>
    );
}

export default memo(TableTransactions);
