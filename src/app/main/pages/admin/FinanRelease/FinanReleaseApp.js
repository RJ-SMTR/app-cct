import React, { useEffect } from 'react'
import { Typography } from '@mui/material';
import { Box } from '@mui/system';



function FinanRelease() {
 
    return (
        <>
            <div className="p-24 pt-10">
                <Typography className='font-medium text-3xl'>Lançamentos</Typography>
                <Box className='flex flex-col  justify-around'>
                </Box>
                <br />
            </div>
        </>
    );
}

export default FinanRelease