import { Badge } from '@mui/material';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import { useSelector } from 'react-redux';
import { useState, useEffect } from 'react';



export function CustomTable(data) {
  const [dayAmount, setDayAmount] = useState(null)
  const searchingDay = useSelector(state => state.extract.searchingDay);
  const searchingWeek = useSelector(state => state.extract.searchingWeek);
  useEffect(() => {
  
      setDayAmount(parseInt(data.data.transactions) * 4.3);
  
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
  return (
    data ? <TableRow key={data.data.id} className="hover:bg-gray-100 cursor-pointer">
      <TableCell component="th" scope="row" onClick={data.handleClickRow}>
        <Typography className={searchingDay ? "whitespace-nowrap" : "whitespace-nowrap underline"}>
          {data.date}
        </Typography>
      </TableCell>
      <TableCell component="th" scope="row">
        <Typography className="whitespace-nowrap">
          {searchingDay ? (
            <> 
            {data.data.transactionType == "free" ? "R$ 0" :formatter.format(dayAmount) }
            </>
          ) : (
            <>{formatter.format(data.data.amount ?? data.data.multipliedAmount)}</>
          )}
        </Typography>

      </TableCell>
      <TableCell component="th" scope="row">
        {searchingWeek ? data.data.transactions?.toLocaleString() : <Badge className={data.c?.root}
          color={data.data.status === 'falha' ? 'error' : data.data.status === 'sucesso' ? 'success' : 'default'}
          badgeContent={data.data.status}
        />}
      </TableCell>
      {searchingDay ? <TableCell component="th" scope="row">
        {transactionType(data.data)}
      </TableCell> : <></> }
     
    </TableRow> : <p>Loading</p>
  )
}