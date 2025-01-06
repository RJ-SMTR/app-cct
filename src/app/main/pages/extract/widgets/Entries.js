import { Paper, Skeleton, Typography } from "@mui/material"
import FuseSvgIcon from "@fuse/core/FuseSvgIcon"
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useState } from "react";
import { getMultipliedEntries } from "app/store/extractSlice";
import { format } from "date-fns";
import { utcToZonedTime } from 'date-fns-tz';

function Entries(type) {
    const [todayInfo, setTodayInfo] = useState()
    const [firstDate, setFirstDate] = useState('')
    const [lastDate, setLastDate] = useState('')
    // const [dayDate, setDayDate] = useState('')
    const dispatch = useDispatch()
  
    const formatter = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    });

    const statements = useSelector(state => state.extract.statements);
    const sumInfo = useSelector(state => state.extract.sumInfo)
    const sumInfoWeek = useSelector(state => state.extract.sumInfoWeek)
    const searchingWeek = useSelector(state => state.extract.searchingWeek)
    const searchingDay = useSelector(state => state.extract.searchingDay)
   
 

    useEffect(() => {
            dispatch(getMultipliedEntries(statements, searchingDay, searchingWeek))
    }, [])
    useEffect(() => {
            const date = new Date()
            const today = format(date, 'dd/MM/yyyy')
            setTodayInfo(today)
      
    }, [])
  

    useEffect( () => {
        if(statements?.length >= 1){
            console.log(statements[0])
            const tz = 'UTC';
            const dateFirst = new Date(`${statements[statements?.length - 1]?.data ?? statements[statements?.length - 1]?.partitionDate}`)
            const dateLast = new Date(`${statements[0]?.data ?? statements[0]?.partitionDate}`)
            const zonedDateFirst = utcToZonedTime(dateFirst, tz);
            const zonedDateLast = utcToZonedTime(dateLast, tz);
             setFirstDate(format(zonedDateFirst, 'dd/MM/yyyy'))
             setLastDate(format(zonedDateLast, 'dd/MM/yyyy'))
        }
    }, [statements])
  return (
      <>{statements?.length ? <Paper className="relative flex flex-col flex-auto p-12 pr-12  rounded-2xl shadow overflow-hidden mx-5 mt-10 md:mt-0">
          <div className="flex items-center justify-between">
              <div className="flex flex-col">
                  <Typography className="text-lg font-medium tracking-tight leading-6 truncate">
                      {type.type}
                  </Typography>
                  <Typography className="font-medium text-sm"> {type.isDay == "true" ? todayInfo ?? '' :  searchingDay ? firstDate : `${firstDate} - ${lastDate}`}</Typography>

              </div>

          </div>
          <div className="flex flex-row flex-wrap mt-8 ">
              <Typography className="mt-8 font-medium text-3xl leading-none">
                  {
                      type.isDay == "true"
                          ? formatter.format(sumInfo?.todaySum)
                          : searchingWeek
                              ? formatter.format(type.type.includes("Pago") ? sumInfoWeek?.paidSum ?? 0 : sumInfoWeek?.amountSum)
                              : formatter.format(type.type.includes("Pago") ? sumInfo?.valorTotalPago : sumInfo?.valorTotal)
                  }

              </Typography>
          </div>
                       

          <div className="absolute bottom-0 ltr:right-0 rtl:left-0 w-96 h-96 -m-24">
              <FuseSvgIcon size={90} className="opacity-25 text-green-500 dark:text-green-400">
                  heroicons-outline:currency-dollar
              </FuseSvgIcon>

          </div>
      </Paper> : 
          <Paper className="relative flex flex-col flex-auto p-12 pr-12  rounded-2xl shadow overflow-hidden">
            <p>Não há dados para sem exibidos</p>
          </Paper>}
                </>
  )
}

export default Entries