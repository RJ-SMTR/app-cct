import {useState} from 'react';
import { DataGrid, GridActionsCellItem, ptBR } from '@mui/x-data-grid';
import { Box, Button, Card } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Close';
import PropTypes from 'prop-types';

function EditToolbar(props) {
    const { setRows, setRowModesModel } = props;

    const handleClick = () => {
        const id = Math.random(); // Generating random ID
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

export default function BasicEditingGrid() {
    const initialRows = [
        { id: 1, name: "John Doe", age: 30, setBy: "João Spala", lastLogin: new Date() },
        { id: 2, name: "Jane Smith", age: 25, setBy: "João Spala", lastLogin: new Date() },
        { id: 3, name: "Alice Johnson", age: 35, setBy: "Louise Nideck", lastLogin: new Date() },
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
        { field: 'age', headerName: 'Age', type: 'number', editable: true },
        { field: 'setBy', headerName: 'Lançado Por',  width: 180, editable: true },
        { field: 'lastLogin', headerName: 'Data Ordem Pagamento', type: 'date', width: 200, editable: true },
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
                            icon={<SaveIcon />}
                            label="Save"
                            onClick={handleSaveClick(id)}
                        />,
                        <GridActionsCellItem
                            icon={<CancelIcon />}
                            label="Cancel"
                            onClick={handleCancelClick(id)}
                            color="inherit"
                        />,
                    ];
                }

                return [
                    <GridActionsCellItem
                        icon={<EditIcon />}
                        label="Edit"
                        onClick={handleEditClick(id)}
                        color="inherit"
                    />,
                    <GridActionsCellItem
                        icon={<DeleteIcon />}
                        label="Delete"
                        onClick={handleDeleteClick(id)}
                        color="inherit"
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
                // components={{
                //     Toolbar: EditToolbar,
                // }}
                componentsProps={{
                    toolbar: { setRows, setRowModesModel },
                }}
                experimentalFeatures={{ newEditingApi: true }}
            />
        </div>
        </Box>

    );
}
