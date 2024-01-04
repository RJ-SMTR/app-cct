import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import { Badge, Box, CircularProgress, Skeleton, Tooltip } from '@mui/material';



import { useSelector } from 'react-redux';
import { useEffect } from 'react';


function TablePending() {
    const formatter = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    });

    return (
        <Paper className="flex flex-col flex-auto p-12 mt-24 shadow rounded-2xl overflow-hidden">
            <div className="flex flex-row justify-between">
                <Typography className="mr-16 text-lg font-medium tracking-tight leading-6 truncate">
                    Transações Dias Anteriores
                </Typography>


            </div>

            <Box className="flex flex-col flex-auto mt-24  overflow-hidden">


                <TableContainer>
                    <Table className="min-w-full">
                            <TableHead>
                                <TableRow>
                                    <TableCell>
                                        <Typography variant="body2" className="font-semibold whitespace-nowrap">
                                            Data Transação
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" className="font-semibold whitespace-nowrap">
                                        Data Processamento
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" className="font-semibold whitespace-nowrap">
                                            Valor
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" className="font-semibold whitespace-nowrap">
                                        Data Ordem Pagamento
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" className="font-semibold whitespace-nowrap">
                                        Data Pagamento Efetivo
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
                            <TableRow key={Math.random()}>
                                <TableCell component="th" scope="row">
                                    <Typography className="whitespace-nowrap">
                                        03/01/2024
                                    </Typography>
                                </TableCell>
                                <TableCell component="th" scope="row">
                                    <Typography className="whitespace-nowrap">
                                        04/01/2024
                                    </Typography>
                                </TableCell>
                                <TableCell component="th" scope="row">
                                    {formatter.format(Math.random())}
                                </TableCell>
                                <TableCell component="th" scope="row">
                                <Typography className="whitespace-nowrap">
                                    04/01/2024
                                </Typography>
                            </TableCell>
                                <TableCell component="th" scope="row">
                                <Typography className="whitespace-nowrap">
                                </Typography>
                            </TableCell>
                                <TableCell component="th" scope="row">
                                <Typography className="whitespace-nowrap">
                                        <Badge
                                        className='mt-[20px]
                                        '
                                            color="error"
                                            badgeContent="Pendente"
                                        />
                                </Typography>
                            </TableCell>
                                <TableCell component="th" scope="row">
                                <Typography className="whitespace-nowrap underline cursor-pointer">
                                        <Tooltip title=" Este código de erro indica que o banco não autorizou a transação" placement="top-start">
                                            s46
                                    </Tooltip>
                                </Typography>
                            </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>

            </Box>
        </Paper>
    );
}

export default TablePending