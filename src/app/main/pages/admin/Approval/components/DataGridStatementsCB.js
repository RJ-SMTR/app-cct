import {  useEffect, useState } from 'react';
import { DataGrid,ptBR, GridCsvExportMenuItem, GridToolbarContainer, GridToolbarExportContainer, } from '@mui/x-data-grid';
import { Box, Autocomplete, TextField, InputLabel, FormControl, Button, CircularProgress } from '@mui/material';

import accounting from 'accounting';

import {
    DateRangePicker
} from 'rsuite'; 
import 'rsuite/dist/rsuite.min.css';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR as dateFnsPtBR } from 'date-fns/locale';

import { LocalizationProvider } from '@mui/x-date-pickers';
import { useDispatch, useSelector } from 'react-redux';
import { handleExtract } from 'app/store/releaseSlice';
import { format } from 'date-fns';




export default function BasicEditingGrid(props) {
    const dispatch = useDispatch()
    const [rowModesModel, setRowModesModel] = useState({});
 
    const [isLoading, setIsLoading] = useState(false);

    const [sumTotal, setSumTotal] = useState()
    const [rows, setRows] = useState([])

    const [dateRange, setDateRange] = useState([]);
    const [tipo, setTipo] = useState('');
    const [operacao, setOperacao] = useState('');
    const accountBalance = useSelector(state => state.release.accountBalance)

    const formatToBRL = (value) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };


    useEffect(() => {
        const sum = rows.reduce((accumulator, item) => accumulator + accounting.unformat(item.valor.replace(/\./g, '').replace('.', ','), ','), 0);
        const formattedValue = accounting.formatMoney(sum, {
            symbol: "",
            decimal: ",",
            thousand: ".",
            precision: 2
        });
        setSumTotal(formattedValue)
    }, [rows])

    const handleSearch = () => {
        setIsLoading(true);
        dispatch(handleExtract({
            conta: 'cb',
            dataInicio: dateRange[0],
            dataFim: dateRange[1],
            tipo,
            operacao,
        }))
            .then((response) => {
                const rowsWithId = response.data.extrato.map((item, index) => ({
                    id: `${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`,
                   data: format(new Date(item.dataLancamento), 'dd/MM/yyyy', { timeZone: 'Etc/UTC' }),
                    valor: formatToBRL(item.valor),
                    tipo: item.tipo,
                    operacao: item.operacao

                }));
                setRows(rowsWithId);
        })
        .finally(() => {
        setIsLoading(false);
    });

    };

    const columns = [
        { field: 'data', headerName: 'Data', width: 300, editable: false },
        { field: 'tipo', headerName: 'Tipo', width: 200, editable: false },
        {
            field: 'operacao', headerName: 'Operação', width: 200, editable: false,
        },
        { field: 'valor', headerName: 'Valor', width: 200, editable: false },
    ];
    const csvOptions = { delimiter: ';' };

    function CustomExportButton(props) {
        return (
            <GridToolbarExportContainer {...props}>
                <GridCsvExportMenuItem options={csvOptions} />
            </GridToolbarExportContainer>
        );
    }

    function CustomToolbar(props) {
         const tipoOptions = [
             { label: 'Saída', value: 'D' },
             { label: 'Entrada', value: 'C' },
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
         ];
     
         return (
             <GridToolbarContainer className="flex-col sm:flex-row w-full  items-center gap-4 mb-4 justify-between" {...props}>
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
                     value={tipoOptions.find(opt => opt.value === tipo) || null}
                     onChange={(e, newValue) => setTipo(newValue?.value || '')}
                     renderInput={(params) => (
                         <TextField {...params} label="Tipo" />
                     )}
                     className="min-w-[180px] sm:w-[22%] w-full"
                 />
                 <Autocomplete
                     multiple
                     options={operacaoOptions}
                     getOptionLabel={(option) => option.label}
                     value={operacaoOptions.filter((opt) => operacao.includes(opt.value))}
                     onChange={(e, newValues) => setOperacao(newValues.map(val => val.value))}
                     renderInput={(params) => (
                         <TextField {...params} label="Operação" />
                     )}
                     className="min-w-[22%] sm:w-auto w-full"
                 />
 
                 <Button
                     variant="contained"
                     color="secondary"
                     className='w-full sm:w-auto'
                     onClick={handleSearch}
                 >
                     Pesquisar
                 </Button>
                 <CustomExportButton />
 
             </GridToolbarContainer>
         );
     }

    return (
        <>
            <Box className="w-full md:mx-9 p-24 relative mt-32">
                <header className=" mb-24">
                    <h4 className="font-semibold">
                        Conta Bilhetagem
                    </h4>
                    <p>
                        Saldo da conta: {formatToBRL(accountBalance.cb)}
                    </p>
                </header>
                <div style={{ height: 500, width: '100%' }}>
                  <DataGrid
                            localeText={ptBR.components.MuiDataGrid.defaultProps.localeText}
                            rows={rows}
                            loading={isLoading}
                            columns={columns}
                            slots={{ toolbar: CustomToolbar }}
                            editMode="row"
                            rowModesModel={rowModesModel}
                            componentsProps={{
                                toolbar: { setRows, setRowModesModel },
                            }}
                        />
                  
                  
                </div>
                <Box>
                    Total movimentado:  R$ {sumTotal}
                </Box>
            </Box>
 

       
        </>
    );
}
