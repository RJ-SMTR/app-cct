import { Badge } from '@mui/material';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import { useSelector } from 'react-redux';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';



export function CustomTable(data) {
  const [dayAmount, setDayAmount] = useState(null)
  const searchingDay = useSelector(state => state.extract.searchingDay);
  const searchingWeek = useSelector(state => state.extract.searchingWeek);
  const statements = useSelector(state => state.extract.statements);
  useEffect(() => {

    setDayAmount(parseInt(data.data.transactions) * 4.3);
    console.log(data)
  }, [data, searchingDay]);

  const formatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
  const transactionType = (i) => {
    if (i.transactionType === "free") {
      return 'Gratuidade'
    } else if (i.transactionType === 'half') {
      return 'Integração'
    } else {
      return 'Integral'
    }
  }
  const CustomBadge = (data) => {
    const i = data.data.data
    const getStatus = (i) => {
      if (i.statusCode == "accumulated") {
        return 'A ser pago'
      } else if (i.statusCode == "paid") {
        return 'Pago'
      } else {
        return 'Falha'
      }
    }
  
    return <Badge className={data.c?.root}
      color={i.status === 'falha' ? 'error' : i.statusCode === 'paid' ? 'success' : 'warning'}
      badgeContent={getStatus(i)}
    />
  }
  return (
    data ? <TableRow key={data.data.id} className="hover:bg-gray-100 cursor-pointer">
      <TableCell component="th" scope="row" onClick={searchingDay ? undefined : data.handleClickRow}>
        <Typography className={searchingDay ? "whitespace-nowrap " : "whitespace-nowrap underline"}>
       
          {searchingDay ? format(new Date(data.data.processingDateTime), 'dd/MM/yyyy hh:mm:ss')  : data.date }
          
        </Typography>
      </TableCell>
      <TableCell component="th" scope="row">
        <Typography className="whitespace-nowrap">
          {searchingDay ? (
            <>
              {data.data.transactionType == "Botoeria" ? "R$ 0" : formatter.format(data.data.transactionValue)}
            </>
          ) : (
            <>{formatter.format(data.data.amount ?? data.data.transactionValueSum)}</>
          )}
        </Typography>

      </TableCell>
      <TableCell component="th" scope="row">
        {searchingDay ? <>1</> : searchingWeek? data.data.count?.toLocaleString() : <CustomBadge data={data} />}
      </TableCell>
     

    </TableRow> : <p>Loading</p>
  )
}