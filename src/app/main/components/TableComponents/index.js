import { Badge, Tooltip } from '@mui/material';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import { useSelector } from 'react-redux';
// import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';



export function CustomTable(data) {
  // const [dayAmount, setDayAmount] = useState(null)
  const searchingDay = useSelector(state => state.extract.searchingDay);
  const searchingWeek = useSelector(state => state.extract.searchingWeek);
  // const statements = useSelector(state => state.extract.statements);


  const formatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
  const dateUTC = (i) => {
    // const tz = 'UTC'
    const parsed = new Date(i)
    const formattedDate = format(parsed, 'dd/MM/yyyy HH:mm:ss');
    return formattedDate
  }
  // const dateUTCMonth = (i) => {
  //   const tz = 'UTC'
  //   const parsed = new Date(i)
  //   const zonedDate = utcToZonedTime(parsed, tz)
  //   const formattedDate = format(zonedDate, 'dd/MM/yyyy');
  //   return formattedDate
  // }
  const CustomBadge = (data) => {
    const i = data.data.data
    const getStatus = (i) => {
      let status = ''
      switch (i.statusRemessa){
        case 3:
          status = 'Pago';
          break;
          case 4:
           status =  'Pendente'
           break;
        default:
          status ='A pagar';
      }
     return status
    }
    return <Badge className={`${data.c?.root}  whitespace-nowrap`}
      color={i.statusRemessa === 4 ? 'error' : i.statusRemessa === 3 ? 'success' : i.statusRemessa === null ? 'op' : 'warning'}

      badgeContent={getStatus(i)}
    />
  }
  const ErrorBadge = (data) => {
    const i = data.data.data
    const error24 = i.motivo
    const errorDescription = i.motivoStatusRemessa ? i.descricaoMotivoStatusRemessa : <></>;
    const getStatus = (i) => {
      return  (
        <span className='underline'> Erro  <InfoOutlinedIcon fontSize='small' /></span>
      )
    }
    if(i.statusRemessa === 4 || i.status === 'Não Pago'){
      return (
            
        <Tooltip   title={data.data.ano === 24 ? error24 :errorDescription} arrow enterTouchDelay={10} leaveTouchDelay={10000}>
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
    data ? <TableRow key={data.data.ordemPagamentoAgrupadoId} className="hover:bg-gray-100 cursor-pointer">
      <TableCell component="th" scope="row" onClick={searchingDay ? null : data.handleClickRow}>
        <Typography className={searchingDay ? "whitespace-nowrap " : "whitespace-nowrap underline"}>

          {searchingDay ? dateUTC(data.data.datetime_transacao) : searchingWeek ? data.date :  data.date}

        </Typography>
      </TableCell>

      {searchingDay && (
        <TableCell component="th" scope="row">
          {data.lastDate}
        </TableCell>
      )
      // ULTIMA DATA
       }
     
        {/* Valor */}
        {searchingDay ? (
          <>
          </>
        ) : (
          <TableCell component="th" scope="row">
            <>  {formatter.format(data.data.valorTotal ?? data.data.valor ?? 0)}</>
      </TableCell>
        )}


      {searchingDay && (
      <TableCell component="th" scope="row">
        <Typography className="whitespace-nowrap">
      
              {data.data.tipo_transacao_smtr}
    
        </Typography>

      </TableCell>)}
      {!searchingWeek ? <>
        {data.ano != 24 ? 
        <>
            <TableCell className='status' component="th" scope='row'>
              <CustomBadge data={data} />
            </TableCell>
            <MyTableCell data={data} />
        
        </>
        
        :    
            <>
          <TableCell className='status' component="th" scope='row'>
              <Badge className={`${data.c?.root}  whitespace-nowrap`}
                color={data.data.status === 'Não Pago' ? 'error' : data.data.status === 'Pago' ? 'success' : 'warning'}

                badgeContent={data.data.status}
              />
          </TableCell>
          <MyTableCell data={data} /></>}
      </>
        : <> </>}




    </TableRow> : <p>Loading</p>
  )
}
