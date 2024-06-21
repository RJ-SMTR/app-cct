import { NumericFormat } from 'react-number-format';

export const initialRows = [
    { id: 1, name: "John Doe", toPay: 30, setBy: "João Spala", paymentOrder: new Date(), authBy: "Lauro Silvestre", effectivePayment: new Date() },
    { id: 2, name: "Jane Smith", toPay: 25, setBy: "João Spala", paymentOrder: new Date(), authBy: "Lauro Silvestre", effectivePayment: new Date() },
    { id: 3, name: "Alice Johnson", toPay: 35, setBy: "Louise Nideck", paymentOrder: new Date(), authBy: "Lauro Silvestre", effectivePayment: new Date() },
];
export  const columns = [
        { field: 'name', headerName: 'Consórcio/BRT', width: 180, editable: true },
        {
            field: 'toPay', headerName: 'Valor a Pagar', width: 180, type: 'number', editable: true, renderEditCell: (params) => (
                <NumericFormat
                    value={params.value}
                    thousandSeparator={true}
                    prefix={'$'}
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
                    thousandSeparator={true}
                    prefix={'$'}
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