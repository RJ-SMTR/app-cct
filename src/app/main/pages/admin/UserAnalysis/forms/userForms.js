import { Card, Modal, Box, Typography } from "@mui/material"
import _ from '@lodash';
import { useState } from "react";
import { Controller, useForm } from 'react-hook-form';
import TextField from '@mui/material/TextField';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useContext } from "react";
import { AuthContext } from "src/app/auth/AuthContext";
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { api } from "app/configs/api/api";




const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
};


export function PersonalInfo({ user }) {
    const [isEditable, setIsEditable] = useState(false)
    const [saved, setSaved] = useState(false)
    const [open, setOpen] = useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);


    const { handleSubmit, control, formState, setError, clearErrors } = useForm({
        defaultValues: {
            email: user.email,

        },
    });
    const { isValid, errors } = formState;


    function onSubmit(formData) {
        const token = window.localStorage.getItem('jwt_access_token');
        return new Promise((resolve, reject) => {
            api.patch(`users/${user.id}`,
                formData, {
                headers: { "Authorization": `Bearer ${token}` },
            }
            )
                .then((response) => {
                    resolve(response.data)
                    setIsEditable(false)
                })
                .catch((error) => {
                    reject(error.response.data.errors)
                    const errorMessage =
                        error.response.data.errors.email === "email must be an email"
                            ? "E-mail incorreto, verifique e tente novamente."
                            : "E-mail já está sendo usado.";
                    setError('email', {
                        message: errorMessage,
                    });
                })

        })

    }
    function clear() {
            setIsEditable(false)
            handleOpen()
      
    }
    const renderButton = () => {
        if (!isEditable) {
            return (
                <button className='rounded p-3 uppercase text-white bg-[#0DB1E3] h-[27px] min-h-[27px] font-medium px-12' onClick={() => { setIsEditable(true), setSaved(false) }}>
                    Editar
                </button>
            );
        } else {
            return (
                <div className='flex'>
                    <button type="button" className='flex items-center rounded p-3 uppercase text-white bg-[#707070] hover:bg-[#4a4a4a ]  mr-2 h-[27px] min-h-[27px]' onClick={() => clear()}>
                        <FuseSvgIcon className="text-48 text-white" size={24} color="action">heroicons-outline:x</FuseSvgIcon>
                    </button>
                    <button type='submit' className='rounded p-3 uppercase text-white bg-[#0DB1E3] h-[27px] min-h-[27px] font-medium px-10' onClick={() => {setIsEditable(true), clearErrors()}}>
                        Salvar
                    </button>
                </div>
            );
        }
    }
    return (
        <>
            <Modal
                open={open}
                onClose={handleClose}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box sx={style}>
                    <Box className="text-center flex flex-col content-center items-center">
                        {saved ?
                            <>

                                <Box className="bg-green rounded-[100%]">
                                    <FuseSvgIcon className="text-48 text-white " size={48} color="action">heroicons-solid:check</FuseSvgIcon>

                                </Box>
                                <Typography id="modal-modal-title" variant="h6" component="h2">
                                    Seus dados foram salvos!
                                </Typography>
                            </> :
                            <>
                                <Box className="bg-red rounded-[100%]">
                                    <FuseSvgIcon className="text-48 text-white " size={48} color="action">heroicons-outline:x</FuseSvgIcon>

                                </Box>
                                <Typography id="modal-modal-title" variant="h6" component="h2">
                                    Seus dados não foram salvos!
                                </Typography>
                            </>
                        }


                    </Box>
                </Box>
            </Modal>
            <Card className="w-full md:mx-9 p-24 relative">
                <header className="flex justify-between items-center">
                    <h1 className="font-semibold">
                        Dados Cadastrais
                    </h1>
                </header>
                <form
                    name="Personal"
                    noValidate
                    onSubmit={handleSubmit(onSubmit)}
                    className="flex flex-col justify-center w-full mt-32"
                >
                    <div className='absolute right-24 top-24'>
                        {renderButton()}
                    </div>
                    <TextField
                        className="mb-24"
                        label="Código de Permissão"
                        type="string"
                        variant="outlined"
                        disabled
                        value={user.permitCode}
                        fullWidth
                    />
                    <TextField
                        className="mb-24"
                        label="Nome"
                        type="string"
                        variant="outlined"
                        disabled
                        value={user.fullName}
                        fullWidth
                    />
                    <Controller
                        name="email"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                className="mb-24"
                                label="E-mail"
                                type="string"
                                variant="outlined"
                                disabled={!isEditable}
                                fullWidth
                                error={!!errors.email}
                                helperText={errors?.email?.message}
                            />
                            
                        )}
                    
                    />
                    <TextField
                        disabled
                        className="mb-24"
                        label="Celular"
                        variant="outlined"
                        fullWidth
                        value={user.phone}
                    />
                </form>
            </Card>
        </>
    );

}





export function BankInfo({user}) {
    const bankCode = `${user.bankCode} - ${user.aux_bank.name}`

    return (
        <>

            <Card className=" w-full md:mx-9 p-24 relative mt-24 md:mt-0">
                <header className="flex justify-between items-center">
                    <h1 className="font-semibold">
                        Dados Bancários
                    </h1>

                </header>
                <form name="Bank"
                    noValidate
                    className="flex flex-col justify-center w-full mt-32"
                >


                    <TextField
                        value={bankCode}
                        disabled
                        label='Banco'
                        className="mb-24"
                        id="bank-autocomplete"
                        variant='outlined'
                    />

                    <TextField
                        value={user.bankAgency}
                        disabled
                        className="mb-24"
                        label="Agência"
                        type="string"
                        variant="outlined"
                        fullWidth

                    />
                    <Box className="flex justify-between">
                        <TextField
                            value={user.bankAccount}
                            disabled
                            className="mb-24 w-[68%]"
                            label="Conta"
                            type="string"
                            variant="outlined"
                            fullWidth
                        />

                        <TextField
                            value={user.bankAccountDigit}
                            disabled
                            className="mb-24 w-[30%]"
                            label="Dígito"
                            type="string"
                            variant="outlined"
                            fullWidth
                        />

                    </Box>

                </form>
            </Card>
        </>
    )
}
