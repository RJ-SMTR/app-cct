import { useContext, useEffect, useState } from 'react';
import { DataGrid, GridActionsCellItem, ptBR } from '@mui/x-data-grid';
import { Box, Button, Card, Modal, TextField, Typography, InputAdornment } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Close';
import { NumericFormat } from 'react-number-format';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { deleteRelease, handleAuthRelease, handleAuthValue } from 'app/store/releaseSlice';
import { AuthContext } from 'src/app/auth/AuthContext';
import { api } from 'app/configs/api/api';
import jwtServiceConfig from 'src/app/auth/services/jwtService/jwtServiceConfig';
import dayjs from 'dayjs';
import { selectUser } from 'app/store/userSlice';
import accounting from 'accounting';
var updateLocale = require('dayjs/plugin/updateLocale')
dayjs.extend(updateLocale)
require('dayjs/locale/pt-br')
dayjs.updateLocale('pt-br', {
    months: [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho",
        "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ]
})

dayjs.locale('pt-br')



const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '50rem',
    maxWidth: '90%',
    borderRadius: '.5rem',
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
};


export default function BasicEditingGrid(props) {
    const [rowModesModel, setRowModesModel] = useState({});
    const { success } = useContext(AuthContext)
    const user = useSelector(selectUser);
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const selectedDate = useSelector(state => state.release.selectedDate)
    const selectedPeriod = useSelector(state => state.release.selectedPeriod)
    const [open, setOpen] = useState(false)
    const [openDelete, setOpenDelete] = useState(false)
    const [initialRows, setInitialRows] = useState(false)
    const [selectedId, setSelectedId] = useState()
    const [dataAuth, setDataAuth] = useState()
    const [sumOfItems, setSumOfItems] = useState(0);
    const [dateOrder, setDateOrder] = useState({
        month: null,
        period: null

    })
    const [sumTotal, setSumTotal] = useState()
    const [rows, setRows] = useState(initialRows)
    const [password, setPassword] = useState("")
    const [openPasswordModal, setOpenPasswordModal] = useState(false)

    useEffect(() => {
        if (dataAuth) {
            const sum = dataAuth.algoritmo - dataAuth.glosa + dataAuth.recurso
            setSumOfItems(sum);
        }
    }, [dataAuth]);


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

    useEffect(() => {
        if (selectedDate.mes && selectedDate.periodo) {
            dispatch(handleAuthValue(selectedDate))
        }

    }, [selectedDate, selectedPeriod])

    async function getInfoAuth(id) {
        const token = window.localStorage.getItem('jwt_access_token');
        const response = await api.get(jwtServiceConfig.finanGetInfo + `/${id}`, {
            headers: { "Authorization": `Bearer ${token}` },
        });
        if (response.data.auth_usersIds) {
            const auth_usersIdsArray = response.data.auth_usersIds.split(",");
            response.data.auth_usersIds = auth_usersIdsArray;
        }
        setDataAuth(response.data)
        const dateString = response.data.data_ordem;
        const date = new Date(dateString);
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const period = day > 15 ? 2 : 1;
        setDateOrder({
            month: month,
            period: period
        });
    }

    const handleOpen = (id) => {
        getInfoAuth(id)
        setOpen(true)

    };
    const deleteInfo = (id) => () => {
        dispatch(deleteRelease(id))
            .then((response) => {
                setRows(rows.filter((row) => row.id !== id));
                success(response, "Deletado com sucesso!");
                setOpenDelete(false);
            })
            .catch((error) => {
                success(error, "Não autorizado!");
            })
    };
    const handleDeleteClick = (id) => () => {
        setOpenDelete(true)
        setSelectedId(id)
        getInfoAuth(id)
    };


    const handleClose = () => setOpen(false);
    const handleCloseDelete = () => setOpenDelete(false);
    const handleOpenPasswordModal = () => {
        setOpenPasswordModal(true);
    };

    const handleClosePasswordModal = () => {
        setOpenPasswordModal(false);
    };




    const handleEditClick = (id) => () => {
        navigate(`/lancamentos/editar/${id}`)
    };

    const handleAuthWithPassword = (id) => () => {
        dispatch(handleAuthRelease(selectedDate, id, password)) 
            .then((response) => {
                success(response, "Autorizado!");
                setOpen(false);
                const updatedRows = rows.map(row => {
                    if (row.id === id) {
                        const updatedAutorizadopor = props.data.find(item => item.id === id);
                        if (updatedAutorizadopor) {
                            return { ...row, authBy: updatedAutorizadopor.autorizadopor.map(i => i.fullName), };
                        }
                    }
                    return row;
                });

                setRows(updatedRows);
                setOpenPasswordModal(false);
            })
            .catch((error) => {
                success(error, "Não autorizado!");
            });
    };

    const processRowUpdate = (newRow) => {
        const updatedRow = { ...newRow, isNew: false };
        setRows(rows.map((row) => (row.id === newRow.id ? updatedRow : row)));
        return updatedRow;
    };
    ;
    const AuthButton = (id) => {
        const targetRow = id.rows.find(row => row.id === id.id);

        const hasMultipleAuthBy = targetRow && targetRow.authBy.length > 1;
        const hasSingleAuthBy = targetRow && targetRow.authBy.length === 1;

        return (
            <button
                onClick={() => handleOpen(id.id)}
                className={`rounded p-3 uppercase min-w-[91.98px] text-white font-medium px-10 text-xs ${hasMultipleAuthBy ? 'bg-green-500' : (hasSingleAuthBy ? 'bg-yellow-800' : 'bg-[#004A80]')
                    }`}
            >
                {hasMultipleAuthBy ? 'Autorizado' : (hasSingleAuthBy ? 'Autorizar (1)' : 'Autorizar')}
            </button>
        );
    };
    const CellActions = (id) => {
        const targetRow = id.rows.find(row => row.id === id.id)

        const hasMultipleAuthBy = targetRow && targetRow.authBy.length > 1;


        return [
            <GridActionsCellItem
                icon={<EditIcon sx={{ color: 'white' }} />}
                label="Edit"
                onClick={handleEditClick(id.id)}
                color="inherit"
                disabled={hasMultipleAuthBy}
                sx={{
                    backgroundColor: '#004A80',
                    '&:hover': {
                        backgroundColor: '#004A80',
                    },
                    '&:disabled': {
                        backgroundColor: 'gray',
                        opacity: 0.8
                    },
                }}

            />,
            <GridActionsCellItem
                icon={<DeleteIcon sx={{ color: 'white' }} />}
                label="Delete"
                onClick={handleDeleteClick(id.id)}
                color="inherit"
                disabled={hasMultipleAuthBy}
                sx={{
                    backgroundColor: 'red',
                    '&:hover': {
                        backgroundColor: 'red',
                    },
                    '&:disabled': {
                        backgroundColor: 'gray',
                        opacity: 0.8
                    },

                    
                }}
            />,

        ]
    }






    const columns = [
        { field: 'name', headerName: 'Consórcio/BRT', width: 180, editable: true },
        { field: 'processNumber', headerName: 'N.º Processo', width: 180, editable: true },
        {
            field: 'toPay', headerName: 'Valor a Pagar', width: 180, editable: false,
        },
        { field: 'setBy', headerName: 'Lançado Por', width: 180, editable: true },
        { field: 'paymentOrder', headerName: 'Data Ordem Pagamento', type: 'date', width: 220, editable: true },
        { field: 'authBy', headerName: 'Autorizado Por', width: 180, editable: true, cellClassName: 'authCell' },
        { field: 'effectivePayment', headerName: 'Data Pagamento Efetivo', type: 'date', width: 220, editable: true },
        {
            field: 'actions',
            type: 'actions',
            headerName: 'Ações',
            width: 200,
            cellClassName: 'actions',
            getActions: ({ id }) => {

                return [
                   <CellActions id={id} rows={rows}/>,

                    <AuthButton id={id} rows={rows} />
                ];
            },
        },
    ];

    return (
        <>
            <Box className="w-full md:mx-9 p-24 relative mt-32">
                <header className="flex justify-between items-center">
                    <h3 className="font-semibold mb-24">
                        Favorecidos
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
                <Box>
                    Valor Total:  R$ {sumTotal}
                </Box>
            </Box>
            <Modal
                open={open}
                onClose={handleClose}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box sx={style}>
                    <Box>
                        <Typography id="modal-modal-title" variant="h6" component="h2">
                            Favorecido: {dataAuth?.descricao}
                        </Typography>
                        <h4 id="modal-modal-title">
                            N.º Processo: {dataAuth?.numero_processo}
                        </h4>
                        <p>Mês: {dayjs().month(dateOrder?.month - 1).format('MMMM')}</p>
                        <Box className="md:flex justify-between w-full">
                            <p>
                                Período: {dateOrder.period} Quinzena -{' '}
                                {dateOrder.period === 1
                                    ? `05/${dayjs().month(dateOrder.month - 1).format('MM')}`
                                    : `20/${dayjs().month(dateOrder.month - 1).format('MM')}`}
                            </p>

                            {dataAuth?.auth_usersIds?.length > 1 ? <button className='rounded p-3 uppercase text-white bg-green-500  font-medium px-10 text-xs' disabled>
                                Autorizado
                            </button> : <button
                                onClick={() => handleOpenPasswordModal()}
                                className='rounded p-3 uppercase text-white bg-[#004A80]  font-medium px-10 text-xs'
                                disabled={user.role.id === 3}
                            >
                                Autorizar
                            </button>}
                        </Box>
                    </Box>
                    <hr className='mt-10' />
                    <Box className="grid gap-10  md:grid-cols-2 mt-12">
                        <Box>
                            <h4 className="font-semibold mb-5">
                                Valor Algoritmo
                            </h4>
                            <TextField prefix='R$' value={dataAuth?.algoritmo?.replace(/R\$/g, '')} disabled InputProps={{
                                startAdornment: <InputAdornment position='start'>R$</InputAdornment>,
                            }} />
                        </Box>
                        <Box>
                            <h4 className="font-semibold mb-5">
                                Valor Glosa
                            </h4>
                            <TextField className='glosa' prefix='R$' value={dataAuth?.glosa === '' ? '0,00' : dataAuth?.glosa?.replace(/R\$/g, '')} disabled InputProps={{

                                startAdornment: <InputAdornment position='start'>R$ </InputAdornment>,
                            }} />
                        </Box>
                        <Box>
                            <h4 className="font-semibold mb-5">
                                Valor Recurso
                            </h4>
                            <TextField prefix='R$' className={dataAuth?.recurso.includes('-') ? "glosa" : ""} value={dataAuth?.recurso === '' ? '0,00' : dataAuth?.recurso?.replace(/R\$/g, '')} disabled InputProps={{

                                startAdornment: <InputAdornment position='start'>R$</InputAdornment>,
                            }} />
                        </Box>
                        <Box>
                            <h4 className="font-semibold mb-5">
                               Anexo III
                            </h4>
                            <TextField prefix='R$' className={dataAuth?.anexo?.includes('-') ? "glosa" : ""} value={dataAuth?.anexo === null ? '0,00' : dataAuth?.anexo?.replace(/R\$/g, '')} disabled InputProps={{
                                
                                startAdornment: <InputAdornment position='start'>R$</InputAdornment>,
                            }} />
                        </Box>
                        <Box>
                            <h4 className="font-semibold mb-5">
                                Valor a Pagar
                            </h4>
                            <TextField prefix='R$' value={dataAuth?.valor_a_pagar?.replace(/R\$/g, '')} disabled InputProps={{

                                startAdornment: <InputAdornment position='start'>R$</InputAdornment>,
                            }} />
                        </Box>
                    </Box>
                </Box>
            </Modal>


            <Modal
                open={openDelete}
                onClose={handleCloseDelete}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box sx={style}>
                    <Box>
                        <Typography id="modal-modal-title text-center" variant="h6" component="h2" className='text-center'>
                            Tem certeza que deseja deletar este registro?
                        </Typography>
                        <p variant="h6" component="h2">
                            Favorecido: {dataAuth?.descricao}
                        </p>
                        <h4>
                            N.º Processo: {dataAuth?.numero_processo}
                        </h4>
                        <p>Mês: {dayjs().month(dateOrder?.month - 1).format('MMMM')}</p>
                        <p>
                            Período: {dateOrder.period} Quinzena -{' '}
                            {dateOrder.period === 1
                                ? `05/${dayjs().month(dateOrder.month - 1).format('MM')}`
                                : `20/${dayjs().month(dateOrder.month - 1).format('MM')}`}
                        </p>
                        <Box className="md:flex justify-between w-full">

                            <button
                                onClick={deleteInfo(selectedId)}
                                className='rounded p-3 uppercase text-white bg-red w-[100%]  font-medium px-10 mt-10'
                            >
                                Deletar
                            </button>
                        </Box>
                    </Box>

                </Box>
            </Modal>

            {/* MODAL SENHA */}
            <Modal
                open={openPasswordModal}
                onClose={handleClosePasswordModal}
                aria-labelledby="password-modal-title"
                aria-describedby="password-modal-description"
            >
                <Box sx={style}>
                    <Typography variant="h6" component="h2" gutterBottom>
                        Digite a senha:
                    </Typography>
                    <TextField
                        label="Senha"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        fullWidth
                        autoFocus
                        margin="normal"
                    />
                    <button
                        onClick={handleAuthWithPassword(dataAuth?.id)}
                        className='rounded p-3 uppercase text-white bg-[#004A80]  w-[100%]  font-medium px-10 mt-10'
                    >
                        Autorizar
                    </button>
                </Box>
            </Modal>
        </>
    );
}
