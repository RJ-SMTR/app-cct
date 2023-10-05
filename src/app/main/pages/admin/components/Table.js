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
import { Badge} from '@mui/material';
import { Link, redirect } from 'react-router-dom';
export  function TableUsers() {

    const userList = useSelector(state => state.admin.userList)
    console.log(userList)



    const handleLink = (user) => {
      redirect(`admin/users/${user.id}`)
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

                      {userList ?
                              userList.map((i) => {
                                const emailStatus = (i) => {
                                    switch(i.aux_inviteStatus.name){
                                        case 'created':
                                            return 'Criado';
                                            break;
                                        case 'queued':
                                            return 'Na Fila';
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
                                                 color='success'
                                                 badgeContent={emailStatus(i)}
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
                                  </TableRow>
                              })
                           : <></>}
                             

                      </TableBody>
                
              </Table>

          </div>
      </Paper>
      
      
      </div>
      
  )
}
