import { useEffect, useState } from 'react';
import { DataGrid, ptBR, GridCsvExportMenuItem, GridToolbarContainer, GridToolbarExportContainer, } from '@mui/x-data-grid';
import { Box, MenuItem, Select, InputLabel, FormControl, Button } from '@mui/material';

import accounting from 'accounting';

import {
    DateRangePicker
} from 'rsuite'; 
import 'rsuite/dist/rsuite.min.css';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR as dateFnsPtBR } from 'date-fns/locale';

import { LocalizationProvider } from '@mui/x-date-pickers';
import { useDispatch } from 'react-redux';
import { handleExtract } from 'app/store/releaseSlice';
import { format } from 'date-fns';




export default function BasicEditingGrid(props) {
    const dispatch = useDispatch()
    const [rowModesModel, setRowModesModel] = useState({});

    const [initialRows, setInitialRows] = useState(false)

    const [sumTotal, setSumTotal] = useState()
    const [rows, setRows] = useState([])

    const [dateRange, setDateRange] = useState([]);
    const [tipo, setTipo] = useState('');
    const [operacao, setOperacao] = useState('');

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
        dispatch(handleExtract({
            conta: 'cett',
            dataInicio: dateRange[0],
            dataFim: dateRange[1],
            tipo,
            operacao,
        }))
            .then((response) => {
                const rowsWithId = response.data.map((item, index) => ({
                    id: `${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`,
                    data: format(new Date(item.dataLancamento), 'dd/MM/yyyy', { timeZone: 'Etc/UTC' }),
                    //    data: item.dataLancamento,
                    valor: formatToBRL(item.valor),
                    tipo: item.tipo,
                    operacao: item.operacao

                }));
                setRows(rowsWithId);
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
        return (
            <GridToolbarContainer className="flex-col sm:flex-row w-full flex-wrap items-center gap-4 mb-4 justify-between" {...props}>
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
                <FormControl className="min-w-[180px] sm:w-[22%] w-full">
                    <InputLabel id="select-periodo">Tipo</InputLabel>
                    <Select
                        labelId="select-periodo"
                        value={tipo}
                        label="Tipo"
                        onChange={(e) => setTipo(e.target.value)}
                    >
                        <MenuItem value="débito">Débito</MenuItem>
                        <MenuItem value="crédito">Crédito</MenuItem>
                    </Select>
                </FormControl>

                <FormControl className="min-w-[180px] sm:w-[22%] w-full">
                    <InputLabel id="select-operacao">Operação</InputLabel>
                    <Select
                        labelId="select-operacao"
                        value={operacao}
                        label="Operação"
                        onChange={(e) => setOperacao(e.target.value)}
                    >
                        <MenuItem value="entrada">Entrada</MenuItem>
                        <MenuItem value="saida">Saída</MenuItem>
                    </Select>
                </FormControl>
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
                <header className="flex justify-between items-center">
                    <h4 className="font-semibold mb-24">
                        Conta de Estabilização Tarifária dos Transportes
                    </h4>
                </header>
                <div style={{ height: 500, width: '100%' }}>
                    <DataGrid
                        localeText={ptBR.components.MuiDataGrid.defaultProps.localeText}
                        rows={rows}
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
                    Valor Total:  R$ {sumTotal}
                </Box>
            </Box>



        </>
    );
}
