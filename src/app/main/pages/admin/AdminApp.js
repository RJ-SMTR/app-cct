import React, { useEffect, useState } from 'react';
import { Typography } from '@mui/material';
import { Box } from '@mui/system';
import { TableUsers } from './components/Table';
import { useDispatch } from 'react-redux';
import { getUser, getInfo } from 'app/store/adminSlice';
import {
    setSearchingWeek,
    setSearchingDay,
    setStatements,
    setDateRange,
    setValorAcumuladoLabel,
    setValorPagoLabel
} from 'app/store/extractSlice';
import { setReportList } from 'app/store/reportSlice';
import { Modal } from '@mui/material';

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '54rem',
    maxWidth: '90%',
    maxHeight: '85vh',
    borderRadius: '.5rem',
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
};

function AdminApp() {
    const [modal, setModal] = useState(false);
    const dispatch = useDispatch();

    useEffect(() => {
        const modalShown = sessionStorage.getItem('modalShown');
        if (!modalShown) {
            setModal(true);
            sessionStorage.setItem('modalShown', 'true');
        }

        dispatch(setSearchingWeek(false));
        dispatch(setSearchingDay(false));
        dispatch(setDateRange([]));
        dispatch(setStatements([]));
        dispatch(getUser());
        dispatch(getInfo());
        dispatch(setReportList([]));
        dispatch(setValorAcumuladoLabel('Valor Transação - Acumulado Mensal'));
        dispatch(setValorPagoLabel('Valor Pago - Acumulado Mensal'));
    }, [dispatch]);

    const handleClose = () => {
        setModal(false);
    };

    return (
        <>
            <div className="p-24 pt-10">
                <Typography className="font-medium text-3xl">Administração</Typography>
                <Box className="flex flex-col justify-around">
                    <TableUsers />
                </Box>
                <br />
            </div>
            {/* <Modal
                open={modal}
                onClose={handleClose}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box sx={style} className="overflow-scroll text-center">
                    <Typography id="modal-modal-title" variant="h6" component="h3">
                        Comunicado:
                    </Typography>
                    <p>As informações anteriores ao dia 31/12/24 estão temporariamente indisponíveis.
                        Qualquer dúvida, por favor, contacte o suporte!</p>

                </Box>
            </Modal> */}
        </>
    );
}

export default AdminApp;
