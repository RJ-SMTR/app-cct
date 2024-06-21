import { Badge, Tooltip } from '@mui/material';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import { useSelector } from 'react-redux';
import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';



export function CustomTable(data) {
  const [dayAmount, setDayAmount] = useState(null)
  const searchingDay = useSelector(state => state.extract.searchingDay);
  const searchingWeek = useSelector(state => state.extract.searchingWeek);
  const statements = useSelector(state => state.extract.statements);
  useEffect(() => {

    setDayAmount(parseInt(data.data.transactions) * 4.3);
  }, [data, searchingDay]);

  const formatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
  const dateUTC = (i) => {
    const tz = 'UTC'
    const parsed = new Date(i)
    const zonedDate = utcToZonedTime(parsed, tz)
    const formattedDate = format(zonedDate, 'dd/MM/yyyy HH:mm:ss');
    return formattedDate
  }
  const CustomBadge = (data) => {
    const i = data.data.data
    const getStatus = (i) => {

      return i.status
    }
    return <Badge className={`${data.c?.root}  whitespace-nowrap`}
      color={i.status === 'Pendente' ? 'error' : i.status === 'Pago' ? 'success' : i.status === 'A pagar' ? 'warning' : 'op'}

      badgeContent={getStatus(i)}
    />
  }
  const ErrorBadge = (data) => {
  
    const i = data.data.data
    const errorDescription = i.errors.length > 0 ? i.errors.map(error => `${error.code} - ${error.message}`).join(", ") : <></>;
    const getStatus = (i) => {
      return  (
        <span className='underline'> Erro  <InfoOutlinedIcon fontSize='small' /></span>
      )
    }
    if(i.errors.length > 0){
      return (
        <Tooltip title={errorDescription} arrow  enterTouchDelay={0}>
          <Badge className={`${data.c?.root}  whitespace-nowrap`}
            color='error'
            badgeContent={getStatus(i)}
          />
        </Tooltip>
      )

    } else {
      return null
    }
  }


  const MyTableCell = ({ data }) => {
    return (
      <TableCell className='status' component="th" scope='row'>
        <ErrorBadge data={data} />
      </TableCell>
    )
  }



  return (
    data ? <TableRow key={data.data.id} className="hover:bg-gray-100 cursor-pointer">
      <TableCell component="th" scope="row" onClick={searchingDay ? undefined : data.handleClickRow}>
        <Typography className={searchingDay ? "whitespace-nowrap " : "whitespace-nowrap underline"}>

          {searchingDay ? dateUTC(data.data.date) : data.date}

        </Typography>
      </TableCell>

      {searchingWeek ?
        <TableCell component="th" scope="row">
          {data.data.count?.toLocaleString()}
        </TableCell> : <></>}
      <TableCell component="th" scope="row">
        <Typography className="whitespace-nowrap">
          {searchingDay ? (
            <>
              {data.data.transactionType == "Botoeria" ? "R$ 0" : formatter.format(data.data.transactionValue ?? data.data.transactionValueSum)}
            </>
          ) : (
            <>{formatter.format(data.data.amount ?? data.data.transactionValueSum)}</>
          )}
        </Typography>

      </TableCell>
      <TableCell component="th" scope="row">
        {/* VALOR PAGO */}
        {searchingDay ? (
          <>
            {formatter.format(data.data.paidValue ?? data.data.paidValueSum ?? 0)}
          </>
        ) : (
          <>  {formatter.format(data.data.paidAmount ?? data.data.paidValueSum ?? 0)}</>
        )}


      </TableCell>
      {!searchingWeek ? <>
        <TableCell className='status' component="th" scope='row'> <CustomBadge data={data} /> </TableCell>
        <MyTableCell data={data} />
      </>
        : <> </>}




    </TableRow> : <p>Loading</p>
  )
}