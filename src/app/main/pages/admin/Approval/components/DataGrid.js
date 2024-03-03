import {useEffect, useState} from 'react';
import { DataGrid, GridActionsCellItem, ptBR } from '@mui/x-data-grid';
import { Box, Button, Card, TextField } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Close';
import PropTypes from 'prop-types';
import { NumericFormat } from 'react-number-format';

function EditToolbar(props) {
    const { setRows, setRowModesModel } = props;

    const handleClick = () => {
        const id = Math.random()
        setRows((oldRows) => [...oldRows, { id, name: '', age: '', isNew: true }]);
        setRowModesModel((oldModel) => ({
            ...oldModel,
            [id]: { mode: 'edit', fieldToFocus: 'name' },
        }));
    };

    return (
        <div>
            <Button color="primary" startIcon={<AddIcon />} onClick={handleClick}>
                Add record
            </Button>
        </div>
    );
}

EditToolbar.propTypes = {
    setRowModesModel: PropTypes.func.isRequired,
    setRows: PropTypes.func.isRequired,
};

export default function BasicEditingGrid(data) {
    useEffect(() => {
        console.log(data)
    }, [data])
    const initialRows = [
        { id: 1, name: "John Doe", toPay: 30, setBy: "João Spala", paymentOrder: new Date(), authBy: "Lauro Silvestre", effectivePayment: new Date() },
        { id: 2, name: "Jane Smith", toPay: 25, setBy: "João Spala", paymentOrder: new Date(), authBy: "Lauro Silvestre", effectivePayment: new Date() },
        { id: 3, name: "Alice Johnson", toPay: 35, setBy: "Louise Nideck", paymentOrder: new Date(), authBy: "Lauro Silvestre", effectivePayment: new Date() },
    ];
    const [rows, setRows] = useState(initialRows);
    const [rowModesModel, setRowModesModel] = useState({});

    const handleEditClick = (id) => () => {
        setRowModesModel({ ...rowModesModel, [id]: { mode: 'edit' } });
    };

    const handleSaveClick = (id) => () => {
        setRowModesModel({ ...rowModesModel, [id]: { mode: 'view' } });
    };

    const handleDeleteClick = (id) => () => {
        setRows(rows.filter((row) => row.id !== id));
    };

    const handleCancelClick = (id) => () => {
        setRowModesModel({
            ...rowModesModel,
            [id]: { mode: 'view', ignoreModifications: true },
        });

        const editedRow = rows.find((row) => row.id === id);
        if (editedRow.isNew) {
            setRows(rows.filter((row) => row.id !== id));
        }
    };

    const processRowUpdate = (newRow) => {
        const updatedRow = { ...newRow, isNew: false };
        setRows(rows.map((row) => (row.id === newRow.id ? updatedRow : row)));
        return updatedRow;
    };

  

    const columns = [
        { field: 'name', headerName: 'Consórcio/BRT', width: 180, editable: true },
        {
            field: 'toPay', headerName: 'Valor a Pagar', width: 180, editable: true, renderEditCell: (params) => (
                <NumericFormat
                    value={params.value}
                    thousandSeparator={'.'}
                    decimalSeparator={','}
                    prefix={'R$'}
                    onValueChange={(values) => {
                        const { value } = values;
                        params.api.setEditCellValue({ id: params.id, field: params.field, value });
                    }}
                    customInput={TextField}
                />
            ),
            renderCell: (params) => (
                <NumericFormat
                    value={params.value}
                    displayType={'text'}
                    thousandSeparator={'.'}
                    decimalSeparator={','}
                    prefix={'R$'}
                />
            ), },
        { field: 'setBy', headerName: 'Lançado Por',  width: 180, editable: true },
        { field: 'paymentOrder', headerName: 'Data Ordem Pagamento', type: 'date', width: 200, editable: true },
        { field: 'authBy', headerName: 'Autorizado Por', width: 180, editable: true },
        { field: 'effectivePayment', headerName: 'Data Pagamento Efetivo', type: 'date', width: 200, editable: true },
        {
            field: 'actions',
            type: 'actions',
            headerName: 'Ações',
            width: 200,
            cellClassName: 'actions',
            getActions: ({ id }) => {
                const isInEditMode = rowModesModel[id]?.mode === 'edit';

                if (isInEditMode) {
                    return [
                        <GridActionsCellItem
                            icon={<SaveIcon sx={{ color: 'white' }} />}
                            label="Save"
                            onClick={handleSaveClick(id)}
                            sx={{
                                backgroundColor: 'green',
                                '&:hover': {
                                    backgroundColor: 'green',
                                },
                            }}
                        />,
                        <GridActionsCellItem
                            icon={<CancelIcon sx={{ color: 'white' }} />}
                            label="Cancel"
                            onClick={handleCancelClick(id)}
                            color="inherit"
                            sx={{
                                backgroundColor: 'red',
                                '&:hover': {
                                    backgroundColor: 'red',
                                },
                            }}
                        />,
                    ];
                }

                return [
                    <GridActionsCellItem
                        icon={<EditIcon sx={{ color: 'white' }} />}
                        label="Edit"
                        onClick={handleEditClick(id)}
                        color="inherit"
                        sx={{
                            backgroundColor: '#004A80', 
                            '&:hover': {
                                backgroundColor: '#004A80', 
                            },
                        }}
                        
                    />,
                    <GridActionsCellItem
                        icon={<DeleteIcon sx={{ color: 'white' }} />}
                        label="Delete"
                        onClick={handleDeleteClick(id)}
                        color="inherit"
                        sx={{
                            backgroundColor: 'red',
                            '&:hover': {
                                backgroundColor: 'red',
                            },
                        }}
                    />,
                    <button className='rounded p-3 uppercase text-white bg-[#004A80]  font-medium px-10 text-xs'>
                        Autorizar
                    </button>,
                ];
            },
        },
    ];

    return (
          <Box className="w-full md:mx-9 p-24 relative mt-32">
                <header className="flex justify-between items-center">
                    <h3 className="font-semibold mb-24">
                        Novo Registro
                    </h3>
                </header>
        <div style={{ height: 300, width: '100%' }}>
            <DataGrid
                localeText={ptBR.components.MuiDataGrid.defaultProps.localeText} 
                rows={rows}
                columns={columns}
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
        </Box>

    );
}
