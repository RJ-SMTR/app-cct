import {  useEffect, useState } from 'react';
import { DataGrid,ptBR, GridCsvExportMenuItem, GridToolbarContainer, GridToolbarExportContainer, } from '@mui/x-data-grid';
import { Box, MenuItem, Select, InputLabel, FormControl } from '@mui/material';

import accounting from 'accounting';

import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR as dateFnsPtBR } from 'date-fns/locale';

import { LocalizationProvider } from '@mui/x-date-pickers';




export default function BasicEditingGrid(props) {
    const [rowModesModel, setRowModesModel] = useState({});
 
    const [initialRows, setInitialRows] = useState(false)

    const [sumTotal, setSumTotal] = useState()
    const [rows, setRows] = useState(initialRows)




    useEffect(() => {
        const sum = props.data.reduce((accumulator, item) => accumulator + accounting.unformat(item.valor.replace(/\./g, '').replace('.', ','), ','), 0);
        const formattedValue = accounting.formatMoney(sum, {
            symbol: "",
            decimal: ",",
            thousand: ".",
            precision: 2
        });
        setSumTotal(formattedValue)
        setRows(props.data.map((item, index) => {
            return {
                id: item.id,
                processNumber: item.numero_processo,
                name: item.descricao,
                toPay: 'R$ ' + item.valor,
                setBy: item.user.fullName,
                paymentOrder: new Date(item.data_ordem),
                authBy: item.autorizadopor.map(i => i.fullName

                ),
                effectivePayment: new Date(item.data_pgto)
            };
        }))
    }, [props])










 

    const processRowUpdate = (newRow) => {
        const updatedRow = { ...newRow, isNew: false };
        setRows(rows.map((row) => (row.id === newRow.id ? updatedRow : row)));
        return updatedRow;
    };







    const columns = [
        { field: 'date', headerName: 'Data', width: 180, editable: false, type: 'date', },
        { field: 'release', headerName: 'Lançamento', width: 180, editable: false },
        {
            field: 'operation', headerName: 'Operação', width: 180, editable: false,
        },
        { field: 'type', headerName: 'Tipo', width: 180, editable: false },
        { field: 'value', headerName: 'Valor', width: 180, editable: false },
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
            <GridToolbarContainer {...props}>
          
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={dateFnsPtBR}>

                    <DatePicker label={'Selecionar data de'} /> - <DatePicker label={'Até'} />

                </LocalizationProvider>
                <FormControl>
                    <InputLabel id="select-periodo">Tipo</InputLabel>
                   
                            <Select
                                labelId="select-periodo"
                                label="Tipo"
                                id="select-periodo"
                        className="min-w-[180px] mr-5"
                             
                            >
                                <MenuItem value={1}>Entrada</MenuItem>
                                <MenuItem value={2}>Saída</MenuItem>
                            </Select>
                  
                   
                </FormControl>
                <FormControl >

                    <InputLabel id="select-opearação">Operação</InputLabel>

                    <Select
                        labelId="select-opearação"
                        label="Operação"
                        id="select-opearação"
                        className="min-w-[180px] mr-5"

                    >
                        <MenuItem value={1}>Entrada</MenuItem>
                        <MenuItem value={2}>Saída</MenuItem>
                    </Select>
                  
                   
                </FormControl>
                <CustomExportButton />
            </GridToolbarContainer>
        );
    }

    return (
        <>
            <Box className="w-full md:mx-9 p-24 relative mt-32">
                <header className="flex justify-between items-center">
                    <h3 className="font-semibold mb-24">
                        Conta Bilhetagem
                    </h3>
                </header>
                <div style={{ height: 300, width: '100%' }}>
                    <DataGrid
                        localeText={ptBR.components.MuiDataGrid.defaultProps.localeText}
                        rows={rows}
                        columns={columns}
                        slots={{ toolbar: CustomToolbar }}
                        editMode="row"
                        rowModesModel={rowModesModel}
                        onRowEditStop={(params, event) => {
                            event.defaultMuiPrevented = true;
                        }}
                        processRowUpdate={processRowUpdate}

                        componentsProps={{
                            toolbar: { setRows, setRowModesModel },
                        }}
                        experimentalFeatures={{ newEditingApi: true }}
                    />
                </div>
                <Box>
                    Valor Total:  R$ {sumTotal}
                </Box>
            </Box>
 

       
        </>
    );
}
