import { Badge } from '@mui/material';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import { useSelector } from 'react-redux';



export function CustomTable(data){
  const searchingDay = useSelector(state => state.extract.searchingDay);
  const searchingWeek = useSelector(state => state.extract.searchingWeek);
    const dayAmount = parseInt(data.data.transactions) * 4.3
  return  (
    data ? <TableRow key={data.data.id} className="hover:bg-gray-100 cursor-pointer">
      <TableCell component="th" scope="row" onClick={data.handleClickRow}>
        <Typography className={searchingDay ? "whitespace-nowrap" : "whitespace-nowrap underline"}>
          {data.date}
        </Typography>
      </TableCell>
      <TableCell component="th" scope="row">
        <Typography className="whitespace-nowrap">
          {searchingDay ? (
            <>R$ {dayAmount.toFixed(2)}</>
          ) : (
            <>R$ {(data.data.amount ?? data.data.multipliedAmount).toFixed(2)}</>
          )}
        </Typography>

      </TableCell>
      <TableCell component="th" scope="row">
        {searchingWeek ? data.data.transactions : <Badge className={data.c?.root}
          color={data.data.status === 'falha' ? 'error' : data.data.status === 'sucesso' ? 'success' : 'default'}
          badgeContent={data.data.status}
        />}
      </TableCell>
    </TableRow> : <p>Loading</p>
  )
}