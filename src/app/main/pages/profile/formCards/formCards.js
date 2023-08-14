import { Card, Modal, Box, Typography } from "@mui/material"
import _ from '@lodash';
import { useState, useEffect } from "react";
import { Controller, useForm } from 'react-hook-form';
import { FormControl,Autocomplete } from "@mui/material";
import TextField from '@mui/material/TextField';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useContext } from "react";
import { AuthContext } from "src/app/auth/AuthContext";
import { api } from 'app/configs/api/api';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';


const personalInfoSchema = yup.object().shape({
    phone: yup.string().required("Insira um telefone válido"),
});

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

    const { patchInfo } = useContext(AuthContext)
    const [isEditable, setIsEditable] = useState(false)
    const [saved, setSaved] = useState(false)
    const [open, setOpen] = useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);


    const { handleSubmit, control, setError, formState } = useForm({
        defaultValues: {
            permitCode: user.permitCode,
            email: user.email,
            fullName: user.fullName,
            phone: user.phone ?? '',
            bankAccount: '',
            bankCode: '',
            bankAccountDigit: '',
            bankAgency: ''
        },
        resolver: yupResolver(personalInfoSchema),
    });
    const { isValid, errors } = formState;


    function onSubmit({ phone }) {
        patchInfo({ phone })
            .then(() => {
                if (isValid) {
                    setIsEditable(false)
                    setSaved(true)
                    handleOpen()
                }
            })
            .catch((_errors) => {
                setError(_errors.phone, {
                    message: 'Telefone inválido'
                });
            });

    }
    function clear() {
        if (isValid && saved) {
            clearErrors()
            setIsEditable(false)
        } else {
            handleOpen()

        }
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
                    <button type='submit' className='rounded p-3 uppercase text-white bg-[#0DB1E3] h-[27px] min-h-[27px] font-medium px-10' onClick={() => setIsEditable(true)}>
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
            <Card className=" w-full md:mx-9 p-24 relative">
                <header className="flex justify-between items-center">
                    <h1 className="font-semibold">
                        Dados Cadastrais
                    </h1>

                </header>
                <form name="Personal"
                    noValidate
                    className="flex flex-col justify-center w-full mt-32"
                    onSubmit={handleSubmit(onSubmit)}>
                    <div className='absolute right-24 top-24'>
                        {renderButton()}
                    </div>
                    <Controller
                        name="permitCode"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                className="mb-24"
                                label="Código de Permissão"
                                type="string"
                                variant="outlined"
                                disabled
                                value={user.permitCode}
                                fullWidth
                            />
                        )}
                    />
                    <Controller
                        name="fullName"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                className="mb-24"
                                label="Nome"
                                type="string"
                                variant="outlined"
                                disabled
                                value={user.fullName}
                                fullWidth
                            />
                        )}
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
                                disabled
                                value={user.email}
                                fullWidth
                            />
                        )}
                    />
                    <Controller
                        name="phone"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                disabled={!isEditable}
                                className="mb-24"
                                label="Celular"
                                variant="outlined"
                                fullWidth
                                error={!!errors.invalidPhone}
                                helperText={errors?.invalidPhone?.message}
                            />
                        )}
                    />

                </form>
            </Card>
        </>
    )
}





export function BankInfo({ user }) {

    const [isEditable, setIsEditable] = useState(false)
    const [selectedBankCode, setSelectedBankCode] = useState(user.bankCode ?? '');
    const { patchInfo } = useContext(AuthContext)
    const [bankOptions, setBankOptions] = useState([]);
    const [saved, setSaved] = useState(false)
    const [open, setOpen] = useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);


    const { handleSubmit, register, setError, formState, clearErrors, setValue } = useForm({
        defaultValues: {
            bankCode: user.bankCode ?? '',
            bankAgency: user.bankAgency ?? '',
            bankAccount: user.bankAccount ?? '',
            bankAccountDigit: user.bankAccountDigit ?? ''
        }
    });
    const { isValid, errors } = formState;



    useEffect(() => {
        fetchBankOptions();
        setSaved(false)
    }, []);

    const fetchBankOptions = async () => {
        try {
            const response = await api.get('/banks');
            response.dara = response.data.sort((a, b) => a.name.localeCompare(b.name));
            setBankOptions(response.data);
        } catch (error) {
            console.error('Error fetching bank options:', error);
        }
    };


    const handleAutocompleteChange = (_, newValue) => {
        setValue('bankCode', newValue ? newValue.code : '')
        setSelectedBankCode(newValue ? newValue.code : '')
    }


    function onSubmit(info) {
        patchInfo(info)
            .then(() => {
                if (isValid) {
                    setIsEditable(false)
                    setSaved(true)
                    handleOpen()
                }
            })
            .catch((_errors) => {
                if (_errors.bankAccountDigit) {
                    setError('bankAccountDigit', {
                        message: 'O dígito deve ser maior ou igual a 1 caractere',
                    });
                }
                if (_errors.bankAgency) {
                    setError('bankAgency', {
                        message: 'A agência deve ser maior ou igual a 4 dígitos)'
                    });
                }
                if (_errors.bankAccount) {
                    setError('bankAccount', {
                        message: 'A conta bancária deve ser maior ou igual a 5 dígitos',
                    });
                }
            });
    }

    function clear() {
        if (isValid && saved) {
            clearErrors()
            setIsEditable(false)
        } else {
            handleOpen()

        }
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
                    <button type='submit' className='rounded p-3 uppercase text-white bg-[#0DB1E3] h-[27px] min-h-[27px] font-medium px-10' onClick={() => setIsEditable(true)}>
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
            <Card className=" w-full md:mx-9 p-24 relative mt-24 md:mt-0">
                <header className="flex justify-between items-center">
                    <h1 className="font-semibold">
                        Dados Bancários
                    </h1>

                </header>
                <form name="Bank"
                    noValidate
                    className="flex flex-col justify-center w-full mt-32"
                    onSubmit={handleSubmit(onSubmit)}>
                    <div className='absolute right-24 top-24'>
                        {renderButton()}
                    </div>


                    <FormControl fullWidth>
                        <Autocomplete
                            {...register('bankCode')}
                            id='bank-code-autocomplete'
                            options={bankOptions}
                            getOptionLabel={(option) => `${option.code} - ${option.name}`}
                            value={bankOptions.find((bank) => bank.code === selectedBankCode) || null}
                            onChange={handleAutocompleteChange}
                            disabled={!isEditable}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label='Banco'
                                    className="mb-24"
                                    id="bank-autocomplete"
                                    variant='outlined'
                                    error={!!errors.bankCode}
                                    helperText={errors?.bankCode?.message}
                                />
                            )}
                        />
                    </FormControl>

                    <TextField
                        {...register("bankAgency")}
                        className="mb-24"
                        label="Agência"
                        type="string"
                        variant="outlined"
                        fullWidth
                        disabled={!isEditable}
                        error={!!errors.bankAgency}
                        helperText={errors?.bankAgency?.message}
                    />
                    <Box className="flex justify-between">
                        <TextField
                            {...register("bankAccount")}
                            className="mb-24 w-[68%]"
                            label="Conta"
                            type="string"
                            variant="outlined"
                            fullWidth
                            error={!!errors.bankAccount}
                            helperText={errors?.bankAccount?.message}
                            disabled={!isEditable}
                        />

                        <TextField
                            {...register("bankAccountDigit")}
                            className="mb-24 w-[30%]"
                            label="Dígito"
                            type="string"
                            variant="outlined"
                            fullWidth
                            disabled={!isEditable}
                            error={!!errors.bankAccountDigit}
                            helperText={errors?.bankAccountDigit?.message}
                        />

                    </Box>
                 
                </form>
            </Card>
        </>
    )
}
