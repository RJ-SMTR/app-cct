import Paper from '@mui/material/Paper';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import { motion } from 'framer-motion';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { MapContainer } from 'react-leaflet/MapContainer'
import { Polyline } from 'react-leaflet';

import {shape} from  './shape'
import { TileLayer } from 'react-leaflet/TileLayer'
import { Box } from '@mui/system';

 export  function CurrentStatementWidget({classes}) {

    return (
        <Paper className={`relative flex flex-col flex-auto p-12 pr-12 pb-12 rounded-2xl shadow overflow-hidden ${classes}` }>
            <div className="flex items-center justify-between">
                <div className="flex flex-col">
                    <Typography className="text-lg font-medium tracking-tight leading-6 truncate">
                        Valores a receber
                    </Typography>
                    <Typography className="text-green-600 font-medium text-sm">1 a 6 de agosto</Typography>
               
                </div>
             
            </div>
            <div className="flex flex-row flex-wrap mt-8 ">
                <Typography className="mt-8 font-medium text-3xl leading-none">
                  R$ 9.450,00
                </Typography>
            </div>

            <div className="absolute bottom-0 ltr:right-0 rtl:left-0 w-96 h-96 -m-24">
                    <FuseSvgIcon size={90} className="opacity-25 text-green-500 dark:text-green-400">
                    heroicons-outline:currency-dollar
                    </FuseSvgIcon>
          
            </div>
        </Paper>
    );
}
export function TripsResume({ date, amount}){
    const blackOptions = { color: 'black' }
    shape.sort((a, b) => a.shape_pt_sequence - b.shape_pt_sequence);
    const points = shape.map(i => [i.shape_pt_lat, i.shape_pt_lon]);
    
    return(
        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1, transition: { delay: 0.1 } }}
        >
            <Card
                className='cursor-pointer mt-12'
            >
              
            <Box className="overflow-hidden">
                    <MapContainer className="h-[220px] " center={[-22.960278, -43.204315]} zoom={12.5} scrollWheelZoom={false} dragging={false} >
                        <TileLayer
                            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                            subdomains="abcd"
                        />
                    <Polyline pathOptions={blackOptions} positions={points}/>
                    </MapContainer>
            </Box>

        
                <Typography className="px-20 my-8  font-semibold">{date ?? '20/07/23'}</Typography>


                    <Typography className="px-20  text-2xl font-bold" component="div">
                     
                    {amount ?? 'R$ 1.250,00'}
                    </Typography>

           

                    <ul className="px-20 my-8 flex flex-wrap list-reset">
                            <li  className="flex items-center w-full">
                                <FuseSvgIcon color='secondary' size={20}>
                                    heroicons-outline:check-circle
                                </FuseSvgIcon>
                                <Typography
                                    className='truncate mx-8'
                                    color='text.secondary'
                                >
                                    content
                                </Typography>
                            </li>
                    </ul>

            
            </Card>
        </motion.div>
    )

}

