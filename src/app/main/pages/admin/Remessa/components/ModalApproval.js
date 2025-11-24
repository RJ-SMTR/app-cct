import { useForm } from 'react-hook-form';
import { Modal, Box, Typography, TextField } from '@mui/material';
import dayjs from 'dayjs';
import { useDispatch } from 'react-redux';
import {  editPayment } from 'app/store/automationSlice';
import { showMessage } from 'app/store/fuse/messageSlice';
import { useState } from 'react';
import { format, parse } from 'date-fns';
import { utcToZonedTime, formatInTimeZone } from "date-fns-tz";

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

export const ModalApproval = ({ openApproval, handleCloseApproval, row, setOpenApproval  }) => {
     const [password, setPassword] = useState('');
    

    function formatHorario(horario) {
        if (!horario || typeof horario !== "string") return "--";

        const regex = /^\d{2}:\d{2}(:\d{2})?$/;
        if (!regex.test(horario)) return "--";

        try {
            const normalized = horario.length === 5 ? `${horario}:00` : horario;

            const utcDate = parse(normalized, "HH:mm:ss", new Date());

            const spTime = utcToZonedTime(utcDate, "America/Sao_Paulo");

            return formatInTimeZone(spTime, "America/Sao_Paulo", "HH:mm");
        } catch {
            return "--";
        }
    }



     const { handleSubmit} = useForm();
    const dispatch = useDispatch()
    
    const formatter = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    });


   

    const checkPassword = (inputPassword) => {
        const correctPassword = "admin123";
        if (inputPassword === correctPassword) {
            let approveData = {
                ...row, status: true,
                valorPagamentoUnico: parseFloat(row.valorPagamentoUnico)
            };

            dispatch(editPayment(approveData))
                .then((response) => {

                    if (response.status === 202) {
                        dispatch(showMessage({ message: "Aprovado com sucesso!" }));
                        setOpenApproval(false)
                        setPassword('')
                    }
                })
                .catch((error) => {
                    console.log(error)
                });
        } else {
            dispatch(showMessage({ message: "Senha incorreta!" }));
        }
    }
    const onSubmit = () => {
        checkPassword(password);
    };

    return (
        <Modal
            open={openApproval}
            onClose={handleCloseApproval}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
        >
            <Box
                component="form"
                onSubmit={handleSubmit(onSubmit)}
                className="
                    absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                    w-[50rem] max-w-[90%]
                    bg-white rounded-lg shadow-xl
                    p-8 space-y-6
                "
            >
                {/* Header */}
                <div className="flex justify-between items-center border-b pb-3">
                    <h2 className="font-semibold text-xl">Aprovação de Pagamento</h2>

                    <button
                        type="button"
                        onClick={handleCloseApproval}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        ✕
                    </button>
                </div>

                {/* Campos */}
                <div className="space-y-4 text-gray-700">

                    <div className="flex gap-2">
                        <span className="font-semibold">ID:</span>
                        <span>{row?.id}</span>
                    </div>

                    <div className="flex gap-2">
                        <span className="font-semibold">Beneficiário:</span>
                        <span>{row?.beneficiarioUsuario?.fullName}</span>
                    </div>

                    <div className="flex gap-2">
                        <span className="font-semibold">Valor Gerado:</span>
                        <span>{formatter.format(row?.aprovacaoPagamento?.valorAprovado)}</span>
                    </div>

                    <div className="flex gap-2">
                        <span className="font-semibold">Data do Pagamento:</span>
                        <span>{row?.aprovacaoPagamento ? format(new Date(row?.aprovacaoPagamento?.detalheA?.dataVencimento), 'dd/MM/yy') : ''}</span>
                    </div>

                    <div className="flex gap-2">
                        <span className="font-semibold">Hora do Pagamento:</span>
                        <span>{formatHorario(row?.horario)}</span>

                    </div>
                </div>
                    <div >
                    <p className="font-semibold my-10">Digite sua senha para aprovar:</p>
                    <TextField
                        id="motivoPagamentoUnico"
                        label="Senha"
                        variant="outlined"
                        type='password'
                        className="w-full p-1"
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    </div>
                     
                {/* Botão */}
                <button
                    type="submit"
                    className="
                        w-full py-3 mt-4
                        bg-[#0DB1E3] hover:bg-[#0CA0CC]
                        text-white font-medium uppercase rounded
                        transition-all
                    "
                >
                    Aprovar
                </button>
            </Box>
        </Modal>
    );
};
