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
    const pendingValue = useSelector(state => state.extract.pendingValue)
    const formatter = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    });
    const CustomBadge = (i) => {
        console.log(i)
        return <Badge className='mt-[20px]'
            color={i.data.status === 'Pendente' ? 'error' : i.status === 'Pendente' ? 'waring' : 'warning'}
            badgeContent={i.data.status}
        />
    }
    useEffect(() => {
        if (pendingList && pendingList.length > 0) {
            const date = pendingList[0].date;
            const formattedDate = format(parseISO(date), 'dd/MM/yyyy');
            setValues(pendingValue)
            setSelectedDate(formattedDate);
        }
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
                           {pendingList ? pendingList.map((i) => {
                               return <TableRow key={Math.random()}>
                                   <TableCell component="th" scope="row">
                                       <Typography className="whitespace-nowrap">
                                         {format(parseISO(i.transactionDate), 'dd/MM/yyyy', {timeZone: 'Etc/UTC' })}
                                           
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
                                           {i.effectivePaymentDate ? format(parseISO(i.effectivePaymentDate), 'dd/MM/yyyy', { timeZone: 'Etc/UTC' }) : ''}
                                       </Typography>
                                   </TableCell>
                                   <TableCell component="th" scope="row">
                                       <Typography className="whitespace-nowrap">
                                         <CustomBadge data={i}/>
                                       </Typography>
                                   </TableCell>
                                   <TableCell component="th" scope="row">
                                       <Typography className="whitespace-nowrap underline cursor-pointer">
                                           <Tooltip title={i.error} placement="top-start">
                                              {i.errorCode}
                                           </Tooltip>
                                       </Typography>
                                   </TableCell>
                               </TableRow>
                           }) : <>
                           
                                   
                           </>}
                       
                              
                       
                        </TableBody>
                    </Table>
                </TableContainer>

            </Box>
            <Box className="flex justify-end">
                           <Box className="mr-16">
                    <Typography className="font-bold">
                        
                        Total a Pagar:  {formatter.format(values.toPay?.amountSum ?? 0) }
                    </Typography>
                           </Box>
                           <Box>
                    <Typography className="text-red font-bold">
                        Total Pendente:  {formatter.format(values.pending?.amountSum ?? 0) }
                    </Typography>
                           </Box>

            </Box>
        </Paper>
    );
}

export default TablePending