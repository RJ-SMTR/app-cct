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
import { utcToZonedTime } from 'date-fns-tz';


function TablePending() {
    const [selectedDate, setSelectedDate] = useState('')
    const [values, setValues] = useState([])
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
          const sum = pendingList.map((statement) => statement.valor)
                        .reduce((accumulator, currentValue) => accumulator + currentValue, 0)
                 
        setValues(sum)

    }, [pendingList]);


    return (
        <Paper className="flex flex-col flex-auto p-12 mt-24 shadow rounded-2xl overflow-hidden">
            <div className="flex flex-row justify-between">
                <Typography className="mr-16 text-lg font-medium tracking-tight leading-6 truncate">
                    Dias Anteriores
                </Typography>


            </div>
            <Typography className="mr-16 text-lg font-medium tracking-tight leading-6 truncate">
                Data Vigente: {selectedDate}
            </Typography>


            <Box className="flex flex-col flex-auto mt-24  overflow-hidden">

{/* VALOR PAGO */}
                <TableContainer>
                    <Table className="min-w-full">
                        <TableHead>
                            <TableRow>
                                <TableCell>
                                    <Typography variant="body2" className="font-semibold whitespace-nowrap">
                                        Data Ordem
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" className="font-semibold whitespace-nowrap">
                                        Data Ordem de Pagamento
                                    </Typography>
                                </TableCell>
                              
                                <TableCell>
                                    <Typography variant="body2" className="font-semibold whitespace-nowrap">
                                        Valor para pagamento
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
                            :  pendingList.length > 0 ? pendingList?.map((i) => {
                                return <TableRow key={Math.random()}>
                                    <TableCell component="th" scope="row">
                                        <Typography className="whitespace-nowrap">
                                            {format(utcToZonedTime(new Date(i.dataOrdem)), 'dd/MM/yyyy', 'UTC')}

                                        </Typography>
                                    </TableCell>
                                    <TableCell component="th" scope="row">
                                        <Typography className="whitespace-nowrap">
                                            {format(utcToZonedTime(new Date( i.dataCaptura)), 'dd/MM/yyyy', 'UTC')}

                                        </Typography>
                                    </TableCell>
                                  
                                    <TableCell component="th" scope="row">
                                        {formatter.format(i.valor ?? 0)}
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
                <Box className="mr-16">
                    <Typography className="font-bold">
                        Total Pago:  {formatter.format(values ?? 0)}
                    </Typography>
                </Box>
                {/* <Box className="mr-16">
                    <Typography className="font-bold">

                        Total a Pagar:  {formatter.format(pendingList.toPayValue ?? 0)}
                    </Typography>
                </Box> */}

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