import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import { Box, CircularProgress, Skeleton } from '@mui/material';



import { useSelector } from 'react-redux';
import { useEffect } from 'react';
import _ from 'lodash';



function TableTypes() {
    const formatter = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    });
    const listByType = useSelector(state => state.extract.listByType)
    const searchingWeek = useSelector(state => state.extract.searchingWeek)
    const searchingDay = useSelector(state => state.extract.searchingDay)
    const isLoadingWeek = useSelector((state) => state.extract.isLoadingWeek);

 
    return (
        <Paper className="flex flex-col flex-auto p-12 mt-24 shadow rounded-2xl overflow-hidden">
            <div className="flex flex-row justify-between">
                <Typography className="mr-16 text-lg font-medium tracking-tight leading-6 truncate">
                    {searchingWeek && !searchingDay ? 'Total das Transações da Semana' : 'Transações para o dia'}
                </Typography>


            </div>

            <Box className="flex flex-col flex-auto mt-24  overflow-hidden">


                <TableContainer>
                    <Table className="min-w-full table-fixed">
                        {listByType ? (
                            <TableHead>
                                <TableRow>
                                    <TableCell>
                                        <Typography variant="body2" className="font-semibold whitespace-nowrap">
                                            Tipo
                                        </Typography>
                                    </TableCell>
                                   
                                    <TableCell>
                                        <Typography variant="body2" className="font-semibold whitespace-nowrap">
                                            Catracadas
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" className="font-semibold whitespace-nowrap">
                                            Valor Transação
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                        ) : (
                            <Skeleton variant="rounded" width={1044} height={42} />
                        )}

                        <TableBody>
                            {isLoadingWeek ? 
                                    <TableRow>
                                        <TableCell colSpan={5}>
                                        <Box className="flex justify-center items-center m-10">
                                            <CircularProgress />
                                        </Box> 
                                        </TableCell>
                                    </TableRow>
                            : 
                                !_.isEmpty(listByType) ?
                                    Object.entries(listByType).map(([type, count]) => {
                                        return (
                                            <TableRow key={type} className="hover:bg-gray-100 cursor-pointer">
                                                <TableCell component="th" scope="row">
                                                    <Typography className="whitespace-nowrap">
                                                        {type}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell component="th" scope="row">
                                                    {count.count.toLocaleString()}
                                                </TableCell>
                                                <TableCell component="th" scope="row">
                                                    <Typography className="whitespace-nowrap">
                                                        {formatter.format(count.transactionValue)}
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                            :  
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

export default TableTypes