import React, { useEffect, useState } from 'react'
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import Typography from '@mui/material/Typography';
import { useDispatch, useSelector } from 'react-redux';
import { Badge} from '@mui/material';
import { Link, redirect } from 'react-router-dom';
import { getUser, getUserByInfo, getUserByInvite } from 'app/store/adminSlice';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { useForm, Controller } from 'react-hook-form';
import Modal from '@mui/material/Modal';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import { showMessage } from 'app/store/fuse/messageSlice';
import { format } from 'date-fns';

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    borderRadius: '.5rem',
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
};

export function TableRemessa() {
    const bookings = useSelector((state) => state.automation.bookings)
    const dispatch = useDispatch()
    const [page, setPage] = useState(0)
    const [rowsPerPage, setRowsPerPage] = useState(50)
    const [open, setOpen] = useState(false)
    const [filtered, setFiltered] = useState(false)


  
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);


    const { control, handleSubmit, formState: { errors, dirtyFields, isValid }, reset } = useForm();

    const formatter = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    });

    const onSubmit = (data) => {
        const { selectedQuery, query, inviteStatus } = data;

        dispatch(getUserByInfo(selectedQuery, query, inviteStatus))
                .then((response) => {
                    handleClose()
                    setFiltered(true)
                    setPage(0)
                    reset();
                }).catch((error) => {
                    if (error.response.data.status === 401) {
                        dispatch(showMessage({ message: 'Erro de autenticação. Faça login novamente' }))
                    } else {
                        dispatch(showMessage({ message: 'Houve um erro desconhecido, tente novamente mais tarde.' }));
                    }
                })
    }

  
    function removeFilters(){
            dispatch(getUser())
            setFiltered(false)
    }

    const handleChangePage = (event, newPage) => {
        setPage(newPage)
    }

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(+event.target.value)
        setPage(0)
    }

    return (
        <>
            <div>
                    {/* <div className="flex flex-row justify-between">
                        <Typography className="mr-16 text-lg font-medium tracking-tight leading-6 truncate">
                            Usuários
                        </Typography>

                   <div className='flex'>
                    {filtered ? <Button className='mx-4' onClick={() => removeFilters()}>
                        Remover filtros
                    </Button> : <></>}

                            <Button variant="contained"
                                color="secondary" onClick={handleOpen}>Pesquisar usuários</Button>
                   </div> */}
                     
                    {/* </div> */}
                    {/* <TablePagination
                        component="div"
                        count={bookings.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        labelRowsPerPage="Linhas por página"
                        labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                        rowsPerPageOptions={[10, 50, 100, 250, 500, 1000]}
                    /> */}
                    <div style={{ height: '30vh', overflow: 'auto', marginTop: '24px' }}>
                        <Table className="w-full min-w-full" >
                            <TableHead>
                              <TableRow>
                                  <TableCell>
                                      <Typography
                                         
                                          className="font-semibold  whitespace-nowrap"
                                      >
                                          Beneficiário
                                      </Typography>
                                  </TableCell>
                                  <TableCell>
                                      <Typography
                                         
                                          className="font-semibold  whitespace-nowrap"
                                      >
                                          Valor a ser pago
                                      </Typography>
                                  </TableCell>
                                  <TableCell>
                                      <Typography
                                         
                                          className="font-semibold  whitespace-nowrap"
                                      >
                                          Data Pagamento
                                      </Typography>
                                  </TableCell>
                                  <TableCell>
                                      <Typography
                                         
                                          className="font-semibold  whitespace-nowrap"
                                      >
                                          Dia da semana
                                      </Typography>
                                  </TableCell>
                                  <TableCell>
                                      <Typography
                                         
                                          className="font-semibold  whitespace-nowrap"
                                      >
                                        Pagamento Recorrente
                                      </Typography>
                                  </TableCell>
                                  <TableCell>
                                      <Typography
                                         
                                          className="font-semibold  whitespace-nowrap"
                                      >
                                        Status de aprovação
                                      </Typography>
                                  </TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                                {bookings.length > 0 ? bookings.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((i) => {
                                    const emailStatus = (i) => {
                                        switch (i.status) {
                                            case true:
                                                return 'Aprovado';
                                                break;
                                            case false:
                                                return 'Não Aprovado';
                                                break;
                                        }
                                    }
                                    return <TableRow >
                                        <TableCell component="th" scope="row">
                                            <Typography className="">
                                                {i.beneficiarioUsuario.fullName}
                                            </Typography>
                                        </TableCell>
                                        <TableCell component="th" scope="row">
                                            <Typography className="whitespace-nowrap">
                                                {i.valorPagamentoUnico ? formatter.format(i.valorPagamentoUnico) : ''}
                                            </Typography>
                                        </TableCell>
                                        <TableCell component="th" scope="row">
                                            <Typography className="whitespace-nowrap">
                                               
                                                {i.dataPagamentoUnico ?format(new Date(i.dataPagamentoUnico), 'dd/MM/yyyy') : ''}
                                            </Typography>
                                        </TableCell>
                                        <TableCell component="th" scope="row">
                                            <Typography className="whitespace-nowrap">
                                                {i.diaSemana}
                                            </Typography>
                                        </TableCell>
                                        <TableCell component="th" scope="row">
                                            <Typography className="whitespace-nowrap">
                                                {i.tipoPagamento}
                                            </Typography>
                                        </TableCell>
                                        {i.aprovacao ?
                                            <TableCell component="th" scope="row">
                                                <Typography className="whitespace-nowrap">
                                                    <Badge
                                                        className='top-[5px] mt-10'
                                                        color={i.status ? 'success' : 'warning'}
                                                        badgeContent={emailStatus(i)}
                                                    />
                                                </Typography>
                                            </TableCell> :
                                            <TableCell component="th" scope="row">
                                                <Typography className="whitespace-nowrap">
                                                    <Badge
                                                        className='top-[5px] mt-10'
                                                        color={'success'}
                                                        badgeContent={'Livre de aprovação'}
                                                    />
                                                </Typography>
                                            </TableCell> 
                                        }
                                        <TableCell component="th" scope="row">
                                            <Typography className="whitespace-nowrap flex items-center">
                                                <Link to={`/admin/user/${i.id}`} aria-disabled className='rounded p-3 uppercase text-white bg-[#0DB1E3] h-[27px] min-h-[27px] font-medium px-10'>
                                                    Aprovar
                                                </Link>
                                            </Typography>
                                        </TableCell>
                                    </TableRow>}) : <>
                               <Typography variant='h6' component="h2">
                                Não obtivemos resultados para esta consulta
                               </Typography>
                               </> }
                            </TableBody>
                        </Table>
                    </div>
                
                    <TablePagination
                        component="div"
                        count={bookings.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        labelRowsPerPage="Linhas por página"
                        labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                        rowsPerPageOptions={[ 50, 100, 250, 500, 1000]}
                    />
            </div>
          
        </>
        
    );
}
