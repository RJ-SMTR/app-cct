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


function TableTypes() {
    const formatter = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    });
    const listByType = useSelector(state => state.extract.listByType)
 
    return (
        <Paper className="flex flex-col flex-auto p-12 mt-24 shadow rounded-2xl overflow-hidden">
            <div className="flex flex-row justify-between">
                <Typography className="mr-16 text-lg font-medium tracking-tight leading-6 truncate">
                    Tipos de transação
                </Typography>


            </div>

            <Box className="flex flex-col flex-auto mt-24  overflow-hidden">


                <TableContainer>
                    <Table className="min-w-full">
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
                                            Valor arrecadado
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" className="font-semibold whitespace-nowrap">
                                            Catracadas
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                        ) : (
                            <Skeleton variant="rounded" width={1044} height={42} />
                        )}

                        <TableBody>
                            {listByType ?
                                Object.entries(listByType).map(([type, count]) => {
                                    return (
                                        <TableRow key={type} className="hover:bg-gray-100 cursor-pointer">
                                            <TableCell component="th" scope="row">
                                                <Typography className="whitespace-nowrap">
                                                    {type}
                                                </Typography>
                                            </TableCell>
                                            <TableCell component="th" scope="row">
                                                <Typography className="whitespace-nowrap">
                                                {formatter.format(count.transactionValue)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell component="th" scope="row">
                                                {count.count.toLocaleString()}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            :  (
                                    <TableCell colSpan={4}> 
                                        <p>Não há dados para sem exibidos</p>
                                        {/* <Box className="flex justify-center items-center m-10">
                                            <CircularProgress />
                                        </Box> */}
                                    </TableCell> 
                        ) }
                        </TableBody>
                    </Table>
                </TableContainer>

            </Box>
        </Paper>
    );
}

export default TableTypes