import { useForm } from 'react-hook-form';
import { Modal, Box, Typography, TextField } from '@mui/material';
import dayjs from 'dayjs';
import { useDispatch } from 'react-redux';
import { deleteBooking, getBookings } from 'app/store/automationSlice';
import { showMessage } from 'app/store/fuse/messageSlice';
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

export const ModalDelete = ({ openDelete, handleCloseDelete, row, setOpenDelete  }) => {
     const { handleSubmit} = useForm();
    const dispatch = useDispatch()

    const onSubmit = () => {
        dispatch(deleteBooking(row.id))
                .then((response) => {
                    
                    if(response.status === 204)
                    {
                        dispatch(showMessage({message: "Deletado com sucesso!"}));
                        dispatch(getBookings())
                        setOpenDelete(false)
                    }
                })
            .catch((error) => {
                console.log(error)
            });
    };

    return (
        <Modal
            open={openDelete}
            onClose={handleCloseDelete}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
        >
            <Box sx={style} component="form" onSubmit={handleSubmit(onSubmit)}>
                {row?.id}
                {row?.beneficiarioUsuario.fullName}
                <button
                    type='submit'
                    className='rounded p-3 uppercase text-white bg-red w-[100%] font-medium px-10 mt-10'
                >
                    Deletar
                </button>
            </Box>
        </Modal>
    );
};
