import React, { useEffect } from 'react'
import { Typography } from '@mui/material';
import { Box } from '@mui/system';
import  { TableUsers } from './components/Table';
import { useDispatch, useSelector } from 'react-redux';
import { getUser, getInfo } from 'app/store/adminSlice';
import { setSearchingWeek, setSearchingDay, setStatements } from 'app/store/extractSlice';


function AdminApp() {
    const dispatch = useDispatch()
    useEffect(() => {  
        dispatch(setSearchingWeek(false))
        dispatch(setSearchingDay(false)) 
        dispatch(setStatements([]))
        dispatch(getUser())
        dispatch(getInfo())
        
    }, [])
    return (
        <>
            <div className="p-24 pt-10">
                <Typography className='font-medium text-3xl'>Administração</Typography>
                <Box className='flex flex-col  justify-around'>
                  <TableUsers/>
                </Box>
                <br />
            </div>
        </>
    );
}

export default AdminApp