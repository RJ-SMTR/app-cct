import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { Badge, Box, CircularProgress, Skeleton, TableFooter, Tooltip } from '@mui/material';



import { useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';


function TablePending() {
    const [selectedDate, setSelectedDate] = useState('')
    const [values, setValues] = useState({})
    const pendingList = useSelector(state => state.extract.pendingList)
    const isLoadingPrevious = useSelector(state => state.extract.isLoadingPrevious)
    const {
        dateRange
    } = useSelector((state) => state.extract);
    const formatter = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    });
    const CustomBadge = (i) => {
        return <Badge className='mt-[20px]'
            color={i.data.status === 'Erro' ? 'error' : i.data.status == 'A pagar' ? 'warning' : 'success'}
            badgeContent={i.data.status}
        />
    }
    useEffect(() => {
        const now = new Date(); 
        const isoString = now.toISOString();
        setSelectedDate(format(parseISO(isoString), 'dd/MM/yyyy'));
      console.log(pendingList)
    }, [pendingList]);


    return (
        <Paper className="flex flex-col flex-auto p-12 mt-24 shadow rounded-2xl overflow-hidden">
            <div className="flex flex-row justify-between">
                <Typography className="mr-16 text-lg font-medium tracking-tight leading-6 truncate">
                    Transações Dias Anteriores
                </Typography>


            </div>
            <Typography className="mr-16 text-lg font-medium tracking-tight leading-6 truncate">
                Data Vigente: {selectedDate}
            </Typography>


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
                                        Valor da Transação
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" className="font-semibold whitespace-nowrap">
                                        Data Ordem Pagamento
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" className="font-semibold whitespace-nowrap">
                                        Valor para pagamento
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
                            {isLoadingPrevious ?
                                    <TableRow>
                                    <TableCell colSpan={8}>
                                        <Box className="flex justify-center items-center m-10">
                                            <CircularProgress />
                                        </Box>
                                    </TableCell>
                                    </TableRow>
                            :  pendingList.count > 0 ? pendingList.data?.map((i) => {
                                return <TableRow key={Math.random()}>
                                    <TableCell component="th" scope="row">
                                        <Typography className="whitespace-nowrap">
                                            {format(parseISO(i.transactionDate), 'dd/MM/yyyy', { timeZone: 'Etc/UTC' })}

                                        </Typography>
                                    </TableCell>
                                    <TableCell component="th" scope="row">
                                        <Typography className="whitespace-nowrap">
                                            {format(parseISO(i.processingDate), 'dd/MM/yyyy', { timeZone: 'Etc/UTC' })}
                                        </Typography>
                                    </TableCell>
                                    <TableCell component="th" scope="row">
                                        {formatter.format(i.amount ?? 0)}
                                    </TableCell>
                                    <TableCell component="th" scope="row">
                                        <Typography className="whitespace-nowrap">
                                            {i.paymentOrderDate ? format(parseISO(i.paymentOrderDate), 'dd/MM/yyyy', { timeZone: 'Etc/UTC' }) : ''}

                                        </Typography>
                                    </TableCell>
                                    <TableCell component="th" scope="row">
                                        <Typography className="whitespace-nowrap">
                                            {formatter.format(i.paidAmount ?? 0)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell component="th" scope="row">
                                        <Typography className="whitespace-nowrap">
                                            {i.effectivePaymentDate ? format(parseISO(i.effectivePaymentDate), 'dd/MM/yyyy', { timeZone: 'Etc/UTC' }) : ''}
                                        </Typography>
                                    </TableCell>
                                    <TableCell component="th" scope="row">
                                        <Typography className="whitespace-nowrap">
                                            <CustomBadge data={i} />
                                        </Typography>
                                    </TableCell>
                                    <TableCell component="th" scope="row">
                                        <Typography className="whitespace-nowrap underline cursor-pointer">
                                            <Tooltip title={i.error} placement="top-start">
                                            </Tooltip>
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            }) : <TableCell colSpan={4}>
                                Não há dados para serem exibidos

                            </TableCell>}



                        </TableBody>

                        {/* <TableFooter>
                        ADD paginação
                        </TableFooter> */}
                    </Table>
                </TableContainer>

            </Box>
            <Box className="flex justify-end">
                {/* <Box className="mr-16">
                    <Typography className="font-bold">

                        Total Pago:  {formatter.format(pendingList.paidValue)}
                    </Typography>
                </Box> */}
                <Box className="mr-16">
                    <Typography className="font-bold">

                        Total a Pagar:  {formatter.format(pendingList.toPayValue ?? 0)}
                    </Typography>
                </Box>

                {/* <Box>
                    <Typography className="text-red font-bold">
                        Total Pendente:  {formatter.format(pendingList.pendingValue)}
                    </Typography>
                </Box> */}

            </Box>
        </Paper>
    );
}

export default TablePending