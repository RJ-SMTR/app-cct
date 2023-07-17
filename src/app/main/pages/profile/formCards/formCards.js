import { Card } from "@mui/material"
import { useState, useEffect } from "react";
import { Controller, useForm } from 'react-hook-form';
import {FormControl, Select, MenuItem, InputLabel} from "@mui/material";
import TextField from '@mui/material/TextField';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useContext } from "react";
import { AuthContext } from "src/app/auth/AuthContext";
import { api } from 'app/configs/api/api';

// CRIAR SET PARA PODER ENVIAR TUDO
export function PersonalInfo({user}) {
    const { patchInfo } = useContext(AuthContext)
    // if(user.a)
    const { handleSubmit, control } = useForm({
        defaultValues: {
            permitCode: user.permitCode,
            email: user.email,
            fullName: user.fullName,
            phone: user.phone ?? '',
            bankAccount: '',
            bankCode: '',
            bankAccountDigit: '',
            bankAgency: ''
        }
    });

    const [isEditable, setIsEditable] = useState(false)
    function onSubmit({ phone }){
        console.log(phone)
        patchInfo({phone})
            .then(setIsEditable(false))

    }
    const renderButton = () => {
        if (!isEditable) {
            return (
                <button className='rounded p-3 uppercase text-white bg-[#0DB1E3] h-[27px] min-h-[27px] font-medium px-12' onClick={() => setIsEditable(true)}>
                    Editar
                </button>
            );
        } else {
            return (
                <div className='flex'>
                    <button className='flex items-center rounded p-3 uppercase text-white bg-[#707070] hover:bg-[#4a4a4a ]  mr-2 h-[27px] min-h-[27px]' onClick={() => setIsEditable(false)}>
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
            <Card className=" w-full md:mx-9 p-12 relative">
                <header className="flex justify-between items-center">
                    <h1 className="font-semibold">
                        Dados Cadastrais
                    </h1>
                 
                </header>
                <form name="Personal"
                    noValidate
                    className="flex flex-col justify-center w-full mt-32"
                    onSubmit={handleSubmit(onSubmit)}>
                    <div className='absolute right-12 top-12'>
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
                                type="string"
                                variant="outlined"
                                fullWidth
                            />
                        )}
                    />
                </form>
            </Card>
        </>
    )
}





export function BankInfo({user}) {
    
    const [isEditable, setIsEditable] = useState(false)
    const [selectedBankCode, setSelectedBankCode] = useState('');
    const {patchInfo} = useContext(AuthContext)
    const [bankOptions, setBankOptions] = useState([]);
    const { handleSubmit, control, register } = useForm({
        defaultValues: {
            bankCode: user.bankCode ?? '',
            bankAgency: user.bankAgency ?? '',
            bankAccount: user.bankAccount ?? '',
            bankAccountDigit: user.bankAccountDigit ?? ''
        }
    });

    useEffect(() => {
        fetchBankOptions();
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


    const handleChange = (event) => {
        setSelectedBankCode(event.target.value)
    };

    function onSubmit(info){
        patchInfo(info)
            .then(setIsEditable(false))
        
    }
    const renderButton = () => {
        if (!isEditable) {
            return (
                <button className='rounded p-3 uppercase text-white bg-[#0DB1E3] h-[27px] min-h-[27px] font-medium px-12' onClick={() => setIsEditable(true)}>
                    Editar
                </button>
            );
        } else {
            return (
                <div className='flex'>
                    <button className='flex items-center rounded p-3 uppercase text-white bg-[#707070] hover:bg-[#4a4a4a ]  mr-2 h-[27px] min-h-[27px]' onClick={() => setIsEditable(false)}>
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
            <Card className=" w-full md:mx-9 p-8 relative mt-24 md:m-auto">
                <header className="flex justify-between items-center">
                    <h1 className="font-semibold">
                        Dados Bancários
                    </h1>
                 
                </header>
                <form name="Bank"
                    noValidate
                    className="flex flex-col justify-center w-full mt-32"
                    onSubmit={handleSubmit(onSubmit)}>
                    <div className='absolute right-8 top-8'>
                        {renderButton()}
                    </div>

                    <FormControl fullWidth>
                        <InputLabel id="demo-simple-select-label">Banco</InputLabel>
                        <Select
                            {...register("bankCode")}
                            className="mb-24"
                            id="demo-simple-select"
                            label="Banco"
                            value={user?.bankCode ?? selectedBankCode}
                            onChange={handleChange}
                            disabled={!isEditable}
                        >
                            {bankOptions.map((bank) => (
                                <MenuItem key={bank.code} value={bank.code}>
                                {bank.code} - {bank.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <TextField
                        {...register("bankAgency")}
                        className="mb-24"
                        label="Agência"
                        type="string"
                        variant="outlined"
                        fullWidth
                        disabled={!isEditable}
                    />
                    <TextField
                        {...register("bankAccount")}
                        className="mb-24"
                        label="Conta"
                        type="string"
                        variant="outlined"
                        fullWidth
                        disabled={!isEditable}
                    />

                    <TextField
                        {...register("bankAccountDigit")}
                        className="mb-24"
                        label="Dígito"
                        type="string"
                        variant="outlined"
                        fullWidth
                        disabled={!isEditable}
                    />
                   
                </form>
            </Card>
        </>
    )
}

