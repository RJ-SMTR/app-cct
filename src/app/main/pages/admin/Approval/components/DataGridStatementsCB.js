import { useEffect, useState } from 'react';
import {
  Box,
  Autocomplete,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination
} from '@mui/material';
import accounting from 'accounting';
import { DateRangePicker } from 'rsuite';
import 'rsuite/dist/rsuite.min.css';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR as dateFnsPtBR } from 'date-fns/locale';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { useDispatch, useSelector } from 'react-redux';
import { handleExtract, setAccountBalance } from 'app/store/releaseSlice';
import ExportButton from './ExportButton';

export default function BasicEditingGrid() {
  const dispatch = useDispatch(); const [isLoading, setIsLoading] = useState(false);

  const [sumTotal, setSumTotal] = useState();
  const [sumTotalEntry, setSumTotalEntry] = useState();
  const [sumTotalExit, setSumTotalExit] = useState();
  const [rows, setRows] = useState([]);

  const [dateRange, setDateRange] = useState([]);
  const [tipo, setTipo] = useState('');
  const [operacao, setOperacao] = useState('');
  const accountBalance = useSelector((state) => state.release.accountBalance);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const formatToBRL = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formattedValue = (sum) => {
    return accounting.formatMoney(sum, {
      symbol: '',
      decimal: ',',
      thousand: '.',
      precision: 2
    });
  };

  const type = (type, valor) => {
    if (type === 'Saída') {
      return parseFloat(valor) * -1
    }
    return valor
  }

  function formatISODateToBR(dateString) {
    const [year, month, day] = dateString.split('T')[0].split('-');
    return `${day}/${month}/${year}`;
  }

  const handleSearch = () => {
    setIsLoading(true);
    dispatch(
      handleExtract({
        conta: 'cb',
        dataInicio: dateRange[0],
        dataFim: dateRange[1],
        tipo,
        operacao
      })
    )
      .then((response) => {
        const rowsWithId = response.data.extrato.map((item, index) => {
          const formatted = formatISODateToBR(item.dataLancamento);

          const itemType = item.tipo === 'Saída' ? 'Saída' : 'Entrada';
          return {
            id: `${item.id ?? index}-${Math.random()}`,
            data: formatted,
            valor: type(item.tipo, item.valor),
            tipo: itemType,
            operacao: item.operacao
          };
        });
        setRows(rowsWithId);
        setPage(0)

        const totalMovimentado = response.data.extrato.reduce((acc, item) => {
          const valor = typeof item.valor === 'string' ? parseFloat(item.valor) : item.valor;
          return acc + Math.abs(valor);
        }, 0);
        setSumTotal(formattedValue(totalMovimentado));

        const entradas = response.data.extrato.filter((item) => item.tipo === 'Entrada');
        const totalEntrada = entradas.reduce((acc, item) => {
          const valor = typeof item.valor === 'string' ? parseFloat(item.valor) : item.valor;
          return acc + valor;
        }, 0);
        setSumTotalEntry(formattedValue(totalEntrada));

        const saidas = response.data.extrato.filter((item) => item.tipo === 'Saída');
        const totalSaida = saidas.reduce((acc, item) => {
          const valor = typeof item.valor === 'string' ? parseFloat(item.valor) : item.valor;
          return acc + valor;
        }, 0);
        setSumTotalExit(formattedValue(totalSaida));
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    dispatch(
      setAccountBalance({
        key: 'cb',
        value:
          parseFloat(
            accounting.unformat(sumTotalEntry?.replace(/\./g, '').replace('.', ','), ',')
          ) -
          accounting.unformat(sumTotalExit?.replace(/\./g, '').replace('.', ','), ',')
      })
    );
  }, [sumTotalEntry, sumTotalExit]);

  const tipoOptions = [
    { label: 'Saída', value: 'D' },
    { label: 'Entrada', value: 'C' }
  ];

  const operacaoOptions = [
    { label: 'APL AUTOM', value: 'APL AUTOM' },
    { label: 'APL FUNDO', value: 'APL FUNDO' },
    { label: 'CRED.AUTOR', value: 'CRED.AUTOR' },
    { label: 'CRED TED', value: 'CRED TED' },
    { label: 'CRED PIX', value: 'CRED PIX' },
    { label: 'DEB.AUTOR.', value: 'DEB.AUTOR.' },
    { label: 'EST PG FOR', value: 'EST PG FOR' },
    { label: 'PAG FORNEC', value: 'PAG FORNEC' },
    { label: 'RESG AUTOM', value: 'RESG AUTOM' },
    { label: 'RSG FUNDO', value: 'RSG FUNDO' },
    { label: 'MANUT CTA', value: 'MANUT CTA' },
    { label: 'DEVOLUCAO DE TED', value: 'DEVOLUCAO DE TED' },
    { label: 'DOC/TED INTERNET', value: 'DOC/TED INTERNET' },
    { label: 'ENVIO DE TED', value: 'ENVIO DE TED' },
    { label: 'ENVIO TED', value: 'ENVIO TED' },
    { label: 'PIX RECEBIDO', value: 'PIX RECEBIDO' },
    { label: 'RECEBIMENTO TED', value: 'RECEBIMENTO TED' },
    { label: 'RESGATE AUTOMAT - CLIENTE', value: 'RESGATE AUTOMAT - CLIENTE' }
  ];

  return (
    <Box className="w-full md:mx-9 p-24 relative mt-32">
      <header className="mb-24">
        <h4 className="font-semibold">Conta Bilhetagem</h4>
        <p className="font-semibold">Saldo da conta: {formatToBRL(accountBalance.cb)}</p>
      </header>

      <Box className="flex flex-col sm:flex-row w-full items-center gap-4 mb-4 justify-between">
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={dateFnsPtBR}>
          <DateRangePicker
            value={dateRange}
            onChange={(range) => setDateRange(range)}
            id="custom-date-input"
            showOneCalendar
            showHeader={false}
            placement="auto"
            placeholder="Selecionar Data"
            format="dd/MM/yy"
            character=" - "
            className="custom-date-range-picker sm:w-[22%] w-full"
          />
        </LocalizationProvider>

        <Autocomplete
          options={tipoOptions}
          getOptionLabel={(option) => option.label}
          value={tipoOptions.find((opt) => opt.value === tipo) || null}
          onChange={(e, newValue) => setTipo(newValue?.value || '')}
          renderInput={(params) => <TextField {...params} label="Tipo" />}
          className="min-w-[180px] sm:w-[22%] w-full"
        />

        <Autocomplete
          multiple
          options={operacaoOptions}
          getOptionLabel={(option) => option.label}
          value={operacaoOptions.filter((opt) => operacao.includes(opt.value))}
          onChange={(e, newValues) => setOperacao(newValues.map((val) => val.value))}
          renderInput={(params) => <TextField {...params} label="Operação" />}
          className="min-w-[22%] sm:w-auto w-full"
        />

        <Button variant="contained" color="secondary" className="w-full sm:w-auto" onClick={handleSearch}>
          Pesquisar
        </Button>

        <ExportButton
          data={{
            rows,
            dateRange,
            sumTotal,
            sumTotalEntry,
            sumTotalExit,
            conta: 'CB',
            saldo: formatToBRL(accountBalance.cb)
          }}
        />
      </Box>

      <TableContainer
        sx={{
          height: 500,
        }}
      >
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Data</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Operação</TableCell>
              <TableCell>Valor</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : (
              rows
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.data}</TableCell>
                    <TableCell>{row.tipo}</TableCell>
                    <TableCell>{row.operacao}</TableCell>
                    <TableCell
                      style={{ color: row.tipo === 'Saída' ? 'red' : 'inherit' }}
                    >
                      {formatToBRL(row.valor)}
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>

      </TableContainer>

      <TablePagination
        component="div"
        count={rows.length}
        page={page}
        onPageChange={(e, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        labelRowsPerPage="Linhas por página"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[25, 50, 100, 200]}
      />


      <Box className="font-semibold mt-4">
        Total movimentado: R$ {sumTotal ?? '0,00'}
      </Box>
      <Box className="font-semibold">
        Total de entrada no período: R$ {sumTotalEntry ?? '0,00'}
      </Box>
      <Box className="font-semibold text-red">
        Total de saídas no período: - R$ {sumTotalExit ?? '0,00'}
      </Box>
    </Box>
  );
}
