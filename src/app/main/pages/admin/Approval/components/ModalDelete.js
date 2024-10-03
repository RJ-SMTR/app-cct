import { useForm } from 'react-hook-form';
import { Modal, Box, Typography, TextField } from '@mui/material';
import dayjs from 'dayjs';
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

export const ModalDelete = ({ openDelete, handleCloseDelete, dataAuth, dateOrder, selectedId, deleteInfo }) => {
    const { register, handleSubmit, formState: { errors } } = useForm();

    const onSubmit = (data) => {
        const { justification, password } = data;
        deleteInfo(selectedId, justification, password);  
    };

    return (
        <Modal
            open={openDelete}
            onClose={handleCloseDelete}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
        >
            <Box sx={style}>
                <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                    <Typography id="modal-modal-title" variant="h6" component="h2" className='text-center'>
                        Tem certeza que deseja deletar este registro?
                    </Typography>
                    <p variant="h6" component="h2">
                        Favorecido: {dataAuth?.clienteFavorecido?.nome}
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

                    <TextField
                        fullWidth
                        label="Justificativa"
                        multiline
                        rows={4}
                        variant="outlined"
                        margin="normal"
                        {...register('justification', { required: 'Justificativa é obrigatória' })}
                        error={!!errors.justification}
                        helperText={errors.justification ? errors.justification.message : ''}
                    />

                    
                    <TextField
                        fullWidth
                        label="Senha"
                        type="password"
                        variant="outlined"
                        margin="normal"
                        {...register('password', { required: 'Senha é obrigatória' })}
                        error={!!errors.password}
                        helperText={errors.password ? errors.password.message : ''}
                    />
                   
                    
               
                    <Box className="md:flex justify-between w-full gap-10">
                        <button
                            onClick={handleCloseDelete}
                            className='rounded p-3 uppercase text-white bg-grey w-[100%] font-medium px-10 mt-10'
                        >
                            Voltar
                        </button>
                        <button
                            type='submit'
                            className='rounded p-3 uppercase text-white bg-red w-[100%] font-medium px-10 mt-10'
                        >
                            Deletar
                        </button>
                    </Box>
                  
                </Box>
            </Box>
        </Modal>
    );
};
