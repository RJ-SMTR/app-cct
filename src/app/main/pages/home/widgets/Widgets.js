import Paper from '@mui/material/Paper';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import { motion } from 'framer-motion';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { MapContainer, TileLayer } from 'react-leaflet';
import { format, parseISO } from 'date-fns';

import { Box } from '@mui/system';
import {HeatmapLayer} from 'react-leaflet-heatmap-layer-v3';
import { useEffect, useRef, useState } from 'react';

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
export function TripsResume({mapInfo, statements}){
    const points = mapInfo.map(i => [i.lat, i.lon, i.amount])
    const transactions = statements.reduce((a,b) => a + b.transactions, 0)
    const mapRef = useRef(null)
    const [zoom, setZoom] = useState(9)
    useEffect(() => {
        if (mapInfo.length > 0 && mapRef.current) {
            const averageLat = mapInfo.reduce((sum, point) => sum + point.lat, 0) / mapInfo.length;
            const averageLon = mapInfo.reduce((sum, point) => sum + point.lon, 0) / mapInfo.length;
            mapRef.current.setView([averageLat,averageLon], zoom);
        }
    }, [mapInfo])
    const state = {
        mapHidden: false,
        layerHidden: false,
        points,
        radius: 6,
        blur: 6,
        max: 0.5,
        limitshape: true,
    };

    const gradient = {
        0.1: '#89BDE0', 0.2: '#96E3E6', 0.4: '#82CEB6',
        0.6: '#FAF3A5', 0.8: '#F5D98B', '1.0': '#DE9A96'
    };

    
    return(
        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1, transition: { delay: 0.1 } }}
        >
            <Card
                className='cursor-pointer mt-12'
            >
              
            <Box className="overflow-hidden">
                    <MapContainer ref={mapRef} className='h-[220px]' center={[0, 0]} zoom={zoom}>
                        {!state.layerHidden &&
                            <HeatmapLayer
                                fitBoundsOnLoad
                                fitBoundsOnUpdate
                                points={state.points}
                                longitudeExtractor={m => m[1]}
                                latitudeExtractor={m => m[0]}
                                gradient={gradient}
                                intensityExtractor={m => parseFloat(m[2])}
                                radius={Number(state.radius)}
                                blur={Number(state.blur)}
                                max={Number.parseFloat(state.max)}
                            />
                        }
                        <TileLayer
                            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                            subdomains="abcd"
                        />
                    </MapContainer>

            </Box>

        
                <Typography className="px-20 my-4  font-semibold" color='text.secondary'>20/08/2023</Typography>


                    <Typography className="px-20 mb-10  text-xl font-bold" component="div">
                 Passageiros pagantes: {transactions}
                    </Typography>

           
              

           
            
            </Card>
        </motion.div>
    )

}

