import React, { useEffect, useState } from 'react';
import {
    DataGrid,
    GridToolbarContainer,
    GridToolbarExport,
    GridToolbarQuickFilter,
    ptBR as locale,
    useGridApiRef,
} from '@mui/x-data-grid';
import { Badge, Box, Typography } from '@mui/material';
import { format } from 'date-fns';
import { useSelector } from 'react-redux';

const columns = [
    { field: 'date', headerName: 'Dt. Efetivação', width: 145 },
    { field: 'dateExpire', headerName: 'Dt. Vencimento', width: 150 },
    { field: 'favorecido', headerName: 'Favorecido', width: 180, cellClassName: 'noWrapName' },
    { field: 'consorcio', headerName: 'Consórcio', width: 130 },
    {
        field: 'value', headerName: 'Valor Real Efetivado', width: 180,
        valueFormatter: (params) => formatToBRL(params.value)
    },
    {
        field: 'status',
        headerName: 'Status',
        width: 130,
        renderCell: (params) => <CustomBadge data={params.value} />,
    },
    { field: 'ocorrencia', headerName: 'Ocorrência', width: 150, cellClassName: 'noWrapName' },
];

const formatToBRL = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const CustomBadge = ({ data }) => {
    return (
        <Badge badgeContent={data} color={data === 'Pago' ? 'success' : 'error'} />
    );
};

const CustomToolbar = () => (
    <GridToolbarContainer>
        <GridToolbarQuickFilter />
        <GridToolbarExport />
    </GridToolbarContainer>
);

const GroupHeader = ({ consorcio, group }) => (
    <Box sx={{ backgroundColor: '#EAEAEA', p: 1 }}>
        <Typography variant="h6">{consorcio}</Typography>
        <Box display="flex" justifyContent="space-between">
            <Typography>Total: {group.total}</Typography>
            {Object.entries(group.totalsByStatus).map(([status, total]) => (
                <Typography key={`${consorcio}-${status}`}>Total {status}: {total}</Typography>
            ))}
        </Box>
    </Box>
);

export default function BasicEditingGrid() {
    const [rows, setRows] = useState([]);
    const synthData = useSelector(state => state.extract.synthData);

    useEffect(() => {
        setRows(transformData(synthData));
    }, [synthData]);

    const transformData = (data) => {
        const transformedRows = [];
        Object.entries(data).forEach(([consorcio, group]) => {
            transformedRows.push({ id: consorcio, isGroupHeader: true, consorcio, ...group });
            group.items.forEach(item => transformedRows.push(item));
        });
        return transformedRows;
    };

    return (
        <Box className="w-full md:mx-9 p-24 relative mt-32">
            <header className="flex justify-between items-center">
                <h3 className="font-semibold mb-24">
                    Data Vigente: {format(new Date(), 'dd/MM/yyyy')}
                </h3>
            </header>
            <div style={{ height: '65vh', width: '100%' }} className="overflow-scroll">
                <DataGrid
                    rows={rows}
                    columns={columns}
                    localeText={locale}
                    getRowId={(row) => row.id}
                    components={{
                        Toolbar: CustomToolbar,
                        Row: CustomRow,
                    }}
                />
            </div>
        </Box>
    );
}

const CustomRow = (props) => {
    const { id, row, ...other } = props;

    if (row.isGroupHeader) {
        return (
            <Box key={id} component="div" {...other}>
                <GroupHeader consorcio={row.consorcio} group={row} />
            </Box>
        );
    }

    return (
        <Box key={id} component="div" {...other}>
            <DataGrid.Row {...props} />
        </Box>
    );
};
