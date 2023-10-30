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

export function TableUsers() {
    const userList = useSelector((state) => state.admin.userList)
    const dispatch = useDispatch()
    const [page, setPage] = useState(0)
    const [rowsPerPage, setRowsPerPage] = useState(10)
    const [open, setOpen] = useState(false)
    const [filtered, setFiltered] = useState(false)


  
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);


    const { control, handleSubmit, formState: { errors, dirtyFields, isValid }, reset } = useForm();


    const onSubmit = (data) => {
        const { selectedQuery, query, inviteStatus } = data;

        dispatch(getUserByInfo(selectedQuery, query, inviteStatus))
                .then((response) => {
                    handleClose()
                    setFiltered(true)
                    reset();
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
                <Paper className="flex flex-col flex-auto p-12 mt-24 shadow rounded-2xl overflow-hidden">
                    <div className="flex flex-row justify-between">
                        <Typography className="mr-16 text-lg font-medium tracking-tight leading-6 truncate">
                            Usuários
                        </Typography>

                   <div className='flex'>
                    {filtered ? <Button className='mx-4' onClick={() => removeFilters()}>
                        Remover filtros
                    </Button> : <></>}

                            <Button variant="contained"
                                color="secondary" onClick={handleOpen}>Pesquisar usuários</Button>
                   </div>
                     
                    </div>
                    <div className="table-responsive mt-24">
                        <Table className="simple w-full min-w-full">
                            <TableHead>
                              <TableRow>
                                  <TableCell>
                                      <Typography
                                          color="text.secondary"
                                          className="font-semibold text-12 whitespace-nowrap"
                                      >
                                          Código de permissão
                                      </Typography>
                                  </TableCell>
                                  <TableCell>
                                      <Typography
                                          color="text.secondary"
                                          className="font-semibold text-12 whitespace-nowrap"
                                      >
                                          Nome
                                      </Typography>
                                  </TableCell>
                                  <TableCell>
                                      <Typography
                                          color="text.secondary"
                                          className="font-semibold text-12 whitespace-nowrap"
                                      >
                                          E-mail
                                      </Typography>
                                  </TableCell>
                                  <TableCell>
                                      <Typography
                                          color="text.secondary"
                                          className="font-semibold text-12 whitespace-nowrap"
                                      >
                                        Status de convite
                                      </Typography>
                                  </TableCell>
                                  <TableCell>
                                      <Typography
                                          color="text.secondary"
                                          className="font-semibold text-12 whitespace-nowrap"
                                      >
                                          
                                      </Typography>
                                  </TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                                {userList.length > 0 ? userList.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((i) => {
                                    const emailStatus = (i) => {
                                        switch (i.aux_inviteStatus?.name) {
                                            case 'created':
                                                return 'Criado';
                                                break;
                                            case 'sent':
                                                return 'Enviado';
                                                break;
                                            case 'used':
                                                return 'Acessado';
                                                break;
                                        }
                                    }
                                    return <TableRow >
                                        <TableCell component="th" scope="row">
                                            <Typography className="" color="text.secondary">
                                                {i.permitCode}
                                            </Typography>
                                        </TableCell>
                                        <TableCell component="th" scope="row">
                                            <Typography className="whitespace-nowrap">
                                                {i.fullName ?? 'Fulano'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell component="th" scope="row">
                                            <Typography className="whitespace-nowrap">
                                                {i.email}
                                            </Typography>
                                        </TableCell>
                                        <TableCell component="th" scope="row">
                                            <Typography className="whitespace-nowrap">
                                                <Badge
                                                    className='top-[5px] mt-10'
                                                    color={emailStatus(i) ? 'success' : 'warning'}
                                                    badgeContent={emailStatus(i) ?? 'Convite não enviado'}
                                                />
                                            </Typography>
                                        </TableCell>
                                        <TableCell component="th" scope="row">
                                            <Typography className="whitespace-nowrap flex items-center">
                                                <Link to={`/admin/user/${i.id}`} className='rounded p-3 uppercase text-white bg-[#0DB1E3] h-[27px] min-h-[27px] font-medium px-10'>
                                                    Detalhes
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
                        count={userList.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        labelRowsPerPage="Linhas por página"
                        labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                        rowsPerPageOptions={[10, 25, 50, 100]}
                    />
                </Paper>
            </div>
            <Modal
                open={open}
                onClose={handleClose}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box sx={style}>
                    <Typography id="modal-modal-title" variant="h6" component="h2">
                       Pesquisar por usuário:
                    </Typography>

                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className='mb-4'>
                            <Controller
                                name="selectedQuery"
                                control={control}
                                defaultValue=""
                                render={({ field }) => (
                                    <Select displayEmpty {...field}>
                                        <MenuItem value="" selected disabled>
                                            Pesquisar por...
                                        </MenuItem>
                                        <MenuItem value="fullName">Nome</MenuItem>
                                        <MenuItem value="email">E-mail</MenuItem>
                                        <MenuItem value="permitCode">Código de permissão</MenuItem>
                                    </Select>
                                )}
                            />
                            <Controller
                                name="inviteStatus"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        className="mx-4 p-0"
                                        displayEmpty
                                        {...field}
                                        defaultValue=""
                                    >
                                        <MenuItem value="" selected disabled>
                                            Status de convite
                                        </MenuItem>
                                        <MenuItem value="queued">Na fila</MenuItem>
                                        {/* <MenuItem value="created">Criado</MenuItem> */}
                                        <MenuItem value="sent">Enviado</MenuItem>
                                        <MenuItem value="used">Acessado</MenuItem>
                                    </Select>
                                )}
                            />
                            {errors.selectedQuery && (
                                <p className="text-red-500">Campo obrigatório</p>
                            )}
                        </div>
                        <div>
                            <Controller
                                name="query"
                                control={control}
                                defaultValue=""
                                render={({ field }) => (
                                    <TextField
                                        color='black'
                                        className='w-[100%]'
                                        placeholder="Pesquisar"
                                        {...field}
                                    />
                                )}
                            />
                            <p>{errors.query?.message}</p>
                        </div>
                        <Button
                            variant="contained"
                            color="secondary"
                            className=" w-full mt-16 z-10"
                            aria-label="Pesquisar"
                            disabled={errors.selectedQuery || _.isEmpty(dirtyFields) || !isValid}
                            type="submit"
                            size="large"
                        >
                            Pesquisar
                        </Button>
                    </form>

                </Box>
            </Modal>
        </>
        
    );
}
