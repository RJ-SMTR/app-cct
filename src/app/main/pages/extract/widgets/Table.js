import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import { memo } from 'react';
import { useState } from 'react';

import Button from '@mui/material/Button';
import { Hidden } from '@mui/material';
import Popover from '@mui/material/Popover';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';


function TableTransactions() {
    const [filterMenu, setFilterMenu] = useState(null);

    const filterMenuClick = (event) => {
        setFilterMenu(event.currentTarget);
    };

    const filterMenuClose = () => {
        setFilterMenu(null);
    };
    return (
        <Paper className="flex flex-col flex-auto p-12 mt-24 shadow rounded-2xl overflow-hidden">
            <div className="flex flex-row justify-between">
                <Typography className="mr-16 text-lg font-medium tracking-tight leading-6 truncate">
                   Transações Recentes
                </Typography>
                <Hidden smUp>
                    <Button onClick={filterMenuClick}>
                        <FuseSvgIcon className="text-48" size={24} color="action">feather:filter</FuseSvgIcon>
                    </Button>
                </Hidden>
                <Popover
                    open={Boolean(filterMenu)}
                    anchorEl={filterMenu}
                    onClose={filterMenuClose}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'center',
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'center',
                    }}
                    classes={{
                        paper: 'py-8',
                    }}
                >
                    <MenuItem  role="button">
                        
                        <ListItemText primary="1 semana" />
                    </MenuItem>
                    <MenuItem  role="button">
                        
                        <ListItemText primary="40 dias" />
                    </MenuItem>
                </Popover>

              <Hidden smDown>
                    <div className="">
                        <Button variant="contained">1 semana</Button>
                        <Button variant="contained">40 dias</Button>
                    </div>
              </Hidden>
                
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
                                       ID da transação
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography
                                        color="text.secondary"
                                        className="font-semibold text-12 whitespace-nowrap"
                                    >
                                        Data
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography
                                        color="text.secondary"
                                        className="font-semibold text-12 whitespace-nowrap"
                                    >
                                        Dia da semana
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography
                                        color="text.secondary"
                                        className="font-semibold text-12 whitespace-nowrap"
                                    >
                                        Valor
                                    </Typography>
                                </TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                            <TableRow>
                                                <TableCell component="th" scope="row">
                                                    <Typography className="" color="text.secondary">
                                                    #OXCCT003
                                                    </Typography>
                                                </TableCell>
                
                                                <TableCell component="th" scope="row">
                                                    <Typography className="">
                                                        20/07/23
                                                    </Typography>
                                                </TableCell>
                                      
                                                <TableCell component="th" scope="row">
                                                    <Typography className="">
                                                       Quinta-feira
                                                    </Typography>
                                                </TableCell>
                                  
                                                <TableCell component="th" scope="row">
                                                    <Typography className="">
                                                       R$ 1.750,00
                                                    </Typography>
                                                </TableCell>
                                  
                                   
                            </TableRow>
                            <TableRow>
                                                <TableCell component="th" scope="row">
                                                    <Typography className="" color="text.secondary">
                                                    #OXCCT002
                                                    </Typography>
                                                </TableCell>
                
                                                <TableCell component="th" scope="row">
                                                    <Typography className="">
                                                        19/07/23
                                                    </Typography>
                                                </TableCell>
                                      
                                                <TableCell component="th" scope="row">
                                                    <Typography className="">
                                                       Quarta-feira
                                                    </Typography>
                                                </TableCell>
                                  
                                                <TableCell component="th" scope="row">
                                                    <Typography className="">
                                                       R$ 1.750,00
                                                    </Typography>
                                                </TableCell>
                                  
                                   
                            </TableRow>
                            <TableRow>
                                                <TableCell component="th" scope="row">
                                                    <Typography className="" color="text.secondary">
                                                    #OXCCT001
                                                    </Typography>
                                                </TableCell>
                
                                                <TableCell component="th" scope="row">
                                                    <Typography className="">
                                                        18/07/23
                                                    </Typography>
                                                </TableCell>
                                      
                                                <TableCell component="th" scope="row">
                                                    <Typography className="">
                                                       Terça-feira
                                                    </Typography>
                                                </TableCell>
                                  
                                                <TableCell component="th" scope="row">
                                                    <Typography className="">
                                                       R$ 1.750,00
                                                    </Typography>
                                                </TableCell>
                                  
                                   
                            </TableRow>
                         
                    </TableBody>
                </Table>
              
            </div>
        </Paper>
    );
}

export default memo(TableTransactions);
