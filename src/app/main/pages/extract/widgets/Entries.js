import { Paper, Skeleton, Typography } from "@mui/material"
import FuseSvgIcon from "@fuse/core/FuseSvgIcon"
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useState } from "react";
import { getMultipliedEntries, setSumInfo } from "app/store/extractSlice";
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
    const sumInfoDay = useSelector(state => state.extract.sumInfoDay)
    const searchingWeek = useSelector(state => state.extract.searchingWeek)
    const searchingDay = useSelector(state => state.extract.searchingDay)
    const pendingList = useSelector(state => state.extract.pendingList)
   
 

    useEffect(() => {
        if(searchingWeek && pendingList.length > 0){

            const allValues = statements.concat(pendingList)
            console.log(allValues)
            const sum = allValues.map((statement) => statement.valor)
                .reduce((accumulator, currentValue) => accumulator + currentValue, 0)
            dispatch(setSumInfo(sum))
        } else {
            const sum = statements.map((statement) => statement.valor)
                .reduce((accumulator, currentValue) => accumulator + currentValue, 0)
            dispatch(setSumInfo(sum))
        }
    }, [searchingWeek,pendingList])
    useEffect(() => {
            const date = new Date()
            const today = format(date, 'dd/MM/yyyy')
            setTodayInfo(today)
      
    }, [])
  

    useEffect(() => {
        if (statements?.length > 0) {


            const getDateValue = (item) => item?.data || item?.dataOrdem || item?.datetime_transacao;

            const firstDateValue = getDateValue(statements[statements.length - 1]);
            const lastDateValue = getDateValue(statements[0]);

            if (firstDateValue && lastDateValue) {
                const dateFirst = utcToZonedTime(new Date(firstDateValue));
                const dateLast = utcToZonedTime(new Date(lastDateValue));

                setFirstDate(format(dateFirst, 'dd/MM/yyyy'));
                setLastDate(format(dateLast, 'dd/MM/yyyy'));
            }
        }
    }, [statements]);

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
                      searchingDay ? 
                          formatter.format(type.type.includes("Pago") ? sumInfoDay : 0)
                          : formatter.format(type.type.includes("Pago") ? sumInfo?.valorTotal ?? sumInfo : sumInfo?.valorTotalPago)
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