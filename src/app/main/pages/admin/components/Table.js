import React, { useEffect, useState } from 'react'
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import Typography from '@mui/material/Typography';
import { useSelector } from 'react-redux';
import { Box, Button, Modal, TextField } from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';

const validationSchema = yup.object().shape({
    email: yup.string().email('E-mail inválido'),
})
export  function TableUsers() {
    const style = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 400,
        bgcolor: 'background.paper',
        boxShadow: 24,
        p: 4,
    };
    const { handleSubmit, control, formState: { errors },} = useForm({ validationSchema,
        defaultValues: {
            email: '',
        },
    })
    const userList = useSelector(state => state.admin.userList)
    const [selectedUser, setSelectedUser] = useState(null)
    const [modalOpen, setModalOpen] = useState(false)
    const [editedEmail, setEditedEmail] = useState('')

    const handleEmailChange = (event) => {
        setEditedEmail(event.target.value);
    }

    const openModal = (user) => {
        setSelectedUser(user)
        setModalOpen(true)
    }

    const closeModal = () => {
        setSelectedUser(null)
        setModalOpen(false)
    }

    const handleEditSubmit = (data) => {
        const updatedEmail = data.email;
        console.log('Updated Email:', updatedEmail);

        closeModal();
    }
   
  return (
      <div><Paper className="flex flex-col flex-auto p-12 mt-24 shadow rounded-2xl overflow-hidden">
          <div className="flex flex-row justify-between">
              <Typography className="mr-16 text-lg font-medium tracking-tight leading-6 truncate">
                  Usuários
              </Typography>

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
                                      
                                  </Typography>
                              </TableCell>
                          </TableRow>
                      </TableHead>

                      <TableBody>

                      {userList ?
                              userList.map((i) => {
                                 return <TableRow >
                                      <TableCell component="th" scope="row">
                                          <Typography className="" color="text.secondary">
                                              {i.permitCode}
                                          </Typography>
                                      </TableCell>
                                      <TableCell component="th" scope="row">
                                          <Typography className="whitespace-nowrap">
                                              {i.fullName}
                                          </Typography>
                                      </TableCell>
                                      <TableCell component="th" scope="row">
                                          <Typography className="whitespace-nowrap">
                                              {i.email}
                                          </Typography>
                                      </TableCell>
                                      <TableCell component="th" scope="row">
                                         <Typography className="whitespace-nowrap"> <Button onClick={() => openModal(i)}>Editar</Button> </Typography>
                                      </TableCell>
                                  </TableRow>
                              })
                           : <></>}
                             

                      </TableBody>
                
              </Table>

          </div>
      </Paper>
          <Modal open={modalOpen} onClose={closeModal}>
              <Box sx={style} className="modal-content">
                <header className='flex justify-between content-center mb-24'>
                    
                  <h2 className='leading-loose' >Editar usuário</h2>
                      <Button onClick={closeModal}> <FuseSvgIcon className="text-48 text-slate-100" size={24} color="action">heroicons-outline:x</FuseSvgIcon></Button>
                </header>
                  {selectedUser && (
                      <div>
                          <form onSubmit={handleSubmit(handleEditSubmit)}>
                              <label>
                                  <Controller
                                      name="email"
                                      control={control}
                                      render={({ field }) => (
                                          <TextField
                                              {...field}
                                              className="mb-24"
                                              label="Novo e-mail"
                                              type="email"
                                              error={!!errors.password}
                                              helperText={errors?.email?.message}
                                              variant="outlined"
                                              required
                                              fullWidth
                                          />
                                      )}
                                  />
                              </label>
                              <button type="submit">Salvar</button>
                          </form>
                      </div>
                  )}
               
              </Box>
          </Modal>
      
      
      
      </div>
      
  )
}
