import { Card } from "@mui/material"
import { useState } from "react";
import { Controller, useForm } from 'react-hook-form';
import TextField from '@mui/material/TextField';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';


export function PersonalInfo({user}) {
    console.log(user)
    const { handleSubmit, control } = useForm({
        defaultValues: {
            permitCode: user.permitCode,
            email: user.email,
            fullName: user.fullName,
            cellphone: '',
            account: '',
            bank: '',
            digit: '',
            agency: ''
            

        }
    });

    const [isEditable, setIsEditable] = useState(false)
    function onSubmit({permitCode}){
        console.log(permitCode)

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
                        name="cellphone"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
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





export function BankInfo() {
    const { handleSubmit, control} = useForm({});
    const [isEditable, setIsEditable] = useState(false)
    function onSubmit({permitCode}){
        

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
                    <Controller
                        name="bank"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                className="mb-24"
                                label="Celular"
                                type="string"
                                variant="outlined"
                                fullWidth
                            />
                        )}
                    />
                    <Controller
                        name="agency"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                className="mb-24"
                                label="Agência"
                                type="string"
                                variant="outlined"
                                fullWidth
                            />
                        )}
                    />
                    <Controller
                        name="account"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                className="mb-24"
                                label="Conta"
                                type="string"
                                variant="outlined"
                                fullWidth
                            />
                        )}
                    />
                    <Controller
                        name="digit"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                className="mb-24"
                                label="Dígito"
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

