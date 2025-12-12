import { Badge, Tooltip } from '@mui/material';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import { useSelector } from 'react-redux';
// import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { utcToZonedTime, formatInTimeZone } from 'date-fns-tz';
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

    return formatInTimeZone(new Date(i), 'UTC', 'dd/MM/yyyy HH:mm:ss');
  }
  const dateUTCMonth = (i) => {
    const tz = 'UTC'
    const parsed = new Date(i)
    const zonedDate = utcToZonedTime(parsed, tz)
    const formattedDate = format(zonedDate, 'dd/MM/yyyy');
    return formattedDate
  }


  const CustomBadge = (data) => {
    const i = data.data.data;

    const getStatus = (i) => {
      switch (i.statusRemessa) {
        case 3:
          return 'Pago';
        case 4:
          return 'Pendente';
        case 5:
          return 'Pendencia Paga';
        default:
          return 'A pagar';
      }
    };

    const getColor = (status) => {
      switch (status) {
        case 3:
          return 'success';
        case 4:
          return 'error';
        case 5:
          return 'info';
        case 2:
          return 'warning';
        case 1:
          return 'warning';
        case 0:
          return 'warning';
        default:
          return 'op';
      }
    };

    return (
      <Badge
        className={`${data.c?.root} whitespace-nowrap`}
        color={getColor(i.statusRemessa)}
        badgeContent={getStatus(i)}
      />
    );
  };

  const ErrorBadge = (data) => {
    const i = data.data.data
    const errorDescription = i.motivoStatusRemessa ? i.descricaoMotivoStatusRemessa : <></>;
    const getStatus = (i) => {
      return (
        <span className='underline'> Erro  <InfoOutlinedIcon fontSize='small' /></span>
      )
    }
    if (i.statusRemessa === 4) {
      return (

        <Tooltip title={errorDescription} arrow enterTouchDelay={10} leaveTouchDelay={10000}>
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

          {
            searchingDay
              ? (data.data?.datetime_transacao ? dateUTC(data.data.datetime_transacao) : "--")
              : searchingWeek
                ? (data.data?.dataCaptura ? dateUTCMonth(data.data.dataCaptura) : "--")
                : (data.data?.data ? dateUTCMonth(data.data.data) : "--")
          }

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




      {
        !searchingDay ? (
          <TableCell component="th" scope="row">
            <Typography className="whitespace-nowrap">
              {
                (() => {
                  console.log("🔍 statusRemessa:", data.data.statusRemessa);
                  console.log("📅 dataPagamento:", data.dataPagamento);
                  return data.data.statusRemessa === 5 ? data.dataPagamento : <></>;
                })()
              }
            </Typography>
          </TableCell>
        ) : (
          <></>
        )
      }
      {
        searchingDay && (
          <TableCell component="th" scope="row">
            <Typography className="whitespace-nowrap">

              {data.data.tipo_transacao}

            </Typography>

          </TableCell>)
      }
      {
        !searchingWeek ? <>
          <TableCell className='status' component="th" scope='row'> <CustomBadge data={data} /> </TableCell>
          <MyTableCell data={data} />
        </>
          : <> </>
      }

    </TableRow > : <p>Loading</p>
  )
}
