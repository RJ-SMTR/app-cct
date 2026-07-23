import { Card, Modal, Box, Typography, Button } from "@mui/material"
import _ from '@lodash';
import { useState, useEffect } from "react";
import { Controller, useForm } from 'react-hook-form';
import { FormControl, Autocomplete } from "@mui/material";
import TextField from '@mui/material/TextField';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useContext } from "react";
import { AuthContext } from "src/app/auth/AuthContext";
import { api } from 'app/configs/api/api';
import { showMessage } from 'app/store/fuse/messageSlice';
import { selectUser } from 'app/store/userSlice';
import { yupResolver } from '@hookform/resolvers/yup';
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import { isAdminUser } from 'src/app/auth/utils/accessUtils';
import {
  getPersonalInfoEmailErrorMessage,
  getPersonalInfoErrors,
} from "./personalInfoApiErrors";
import { createPersonalInfoSchema } from "./personalInfoValidation";

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

export function getUserCpf(user) {
  return user?.cpf || user?.cpfCnpj || '-';
}

export function PersonalInfo({
  user,
  primaryInfoLabel = 'Código de Permissão',
  primaryInfoValue,
  onUserUpdated,
}) {
  const { patchInfo, success } = useContext(AuthContext)
  const dispatch = useDispatch()
  const currentUser = useSelector(selectUser)
  const canEditEmail = isAdminUser(currentUser)
  const canEditPhone = String(currentUser?.id) === String(user?.id)
  const [isEditable, setIsEditable] = useState(false)
  const [saved, setSaved] = useState(false)
  const resolvedPrimaryInfoValue = primaryInfoValue ?? user?.permitCode ?? '';
  const personalInfoSchema = createPersonalInfoSchema();

  const { handleSubmit, control, setError, formState } = useForm({
    defaultValues: {
      permitCode: resolvedPrimaryInfoValue,
      email: user.email,
      fullName: user.fullName ?? '',
      phone: user.phone ?? '',
      bankAccount: '',
      bankCode: '',
      bankAccountDigit: '',
      bankAgency: ''
    },
    resolver: yupResolver(personalInfoSchema),
  });
  const { isValid, errors } = formState;


  function onSubmit({ phone, email }) {
    patchInfo(
      {
        ...(canEditPhone ? { phone } : {}),
        ...(canEditEmail ? { email } : {}),
      },
      user.id
    )
      .then((response) => {
        setIsEditable(false)
        setSaved(true)
        onUserUpdated?.(response)

        if (String(currentUser?.id) === String(user?.id)) {
          success(response, "Seus dados foram salvos!")
          return;
        }

        dispatch(showMessage({ message: "Seus dados foram salvos!" }))

      })
      .catch((apiError) => {
        setSaved(false);

        const errors = getPersonalInfoErrors(apiError);
        const emailErrorMessage = getPersonalInfoEmailErrorMessage(apiError);

        if (emailErrorMessage) {
          setError('email', {
            message: emailErrorMessage
          });
        }

        if (errors.phone) {
          setError('phone', {
            message: 'Telefone inválido'
          });
        }
      });

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
          <button type='submit' className='rounded p-3 uppercase text-white bg-[#0DB1E3] h-[27px] min-h-[27px] font-medium px-10' onClick={() => setIsEditable(true)}>
            Salvar
          </button>
        </div>
      );
    }
  }
  return (
    <>

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
                label={primaryInfoLabel}
                type="string"
                variant="outlined"
                disabled
                value={resolvedPrimaryInfoValue}
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
                disabled={!isEditable || !canEditEmail}
                fullWidth
                error={!!errors.email}
                helperText={errors?.email?.message}
              />
            )}
          />
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                disabled={!isEditable || !canEditPhone}
                className="mb-24"
                label="Celular"
                variant="outlined"
                fullWidth
                error={!!errors.phone}
                helperText={errors?.phone?.message}
              />
            )}
          />

        </form>
      </Card>
    </>
  )
}





export function BankInfo({
  user,
  hideEditButton = false,
  defaultEditable = false,
  submitButtonLabel = 'Salvar',
  useSecondaryButton = false,
}) {
  const [isEditable, setIsEditable] = useState(defaultEditable)
  const [selectedBankCode, setSelectedBankCode] = useState(user.bankCode ?? '');
  const { patchInfo, success } = useContext(AuthContext)
  const [bankOptions, setBankOptions] = useState([]);
  const [saved, setSaved] = useState(false)
  const [userBank, setUserBank] = useState('')

  const { handleSubmit, register, setError, formState, watch, clearErrors, setValue } = useForm({
    defaultValues: {
      bankCode: user.bankCode ?? '',
      bankAgency: user.bankAgency ?? '',
      bankAccount: user.bankAccount ?? '',
      bankAccountDigit: user.bankAccountDigit ?? ''
    }
  });
  const { isValid, errors } = formState;

  const bankAccountValue = watch("bankAccount")
  const bankAgencyValue = watch("bankAgency")

  const normalizeBankCode = (bankCode) => {
    const parsedCode = Number(bankCode);

    return Number.isFinite(parsedCode) ? parsedCode : bankCode;
  };

  useEffect(() => {
    const bankCodes = [184, 29, 479, 386, 249]
    fetchBankOptions();
    if (bankCodes.includes(user.bankCode)) {
      setError('bankCode', { message: `Erro: Código do banco ${user.bankCode} não é permitido. Por favor, contacte o suporte!` });
    }
    setSaved(false)
    setSelectedBankCode(user.bankCode ?? '');
  }, [user]);

  const fetchBankOptions = async () => {
    try {
      const response = await api.get('/banks');
      const bankCodes = [184, 29, 479, 386, 249]
      response.data = response.data.sort((a, b) => a.name.localeCompare(b.name));

      const normalizedSelectedBankCode = normalizeBankCode(selectedBankCode);

      setUserBank(
        response.data.find((bank) => normalizeBankCode(bank.code) === normalizedSelectedBankCode) || null
      )
      const filteredData = response.data.filter(({ code }) => !bankCodes.includes(code));

      setBankOptions(filteredData);
    } catch (error) {
      console.error('Error fetching bank options:', error);
    }
  };

  const handleAutocompleteChange = (_, newValue) => {
    setValue('bankCode', newValue ? newValue.code : '');
    setSelectedBankCode(newValue ? newValue.code : '');
    setUserBank(newValue || null);
  };

  function onSubmit(info) {
    info.bankAccount = String(info.bankAccount);

    if (info.bankCode === 184 || info.bankCode === 29 || info.bankCode === 479) {
      setError('bankCode', {
        message: 'Você deve alterar seu banco antes de salvar'
      });
    } else {
      patchInfo(info, user.id)
        .then((response) => {
          if (isValid) {
            setIsEditable(hideEditButton ? defaultEditable : false);
            setSaved(true);
            success(response, "Seus dados foram salvos!");
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
              message: 'A agência deve ser maior ou igual a 4 dígitos'
            });
          }
          if (_errors.bankAccount) {
            setError('bankAccount', {
              message: 'A conta bancária deve ser menor ou igual a 12 dígitos',
            });
          }
        });
    }
  }

  const renderActionButton = ({ label, onClick, type = 'button' }) => {
    if (useSecondaryButton) {
      return (
        <Button
          variant="contained"
          color="secondary"
          type={type}
          onClick={onClick}
          size="small"
        >
          {label}
        </Button>
      );
    }

    return (
      <button
        type={type}
        className='rounded p-3 uppercase text-white bg-[#0DB1E3] h-[27px] min-h-[27px] font-medium px-12'
        onClick={onClick}
      >
        {label}
      </button>
    );
  };

  const renderButton = () => {
    if (hideEditButton) {
      return renderActionButton({
        label: submitButtonLabel,
        type: 'submit',
      });
    }

    if (!isEditable) {
      return renderActionButton({
        label: 'Editar',
        onClick: () => {
          setIsEditable(true);
          setSaved(false);
        },
      });
    } else {
      return (
        <div className='flex'>
          {renderActionButton({
            label: submitButtonLabel,
            type: 'submit',
            onClick: () => setIsEditable(true),
          })}
        </div>
      );
    }
  };

  return (
    <>
      <Card className="w-full md:mx-9 p-24 relative mt-24 md:mt-0">
        <header className="flex justify-between items-center">
          <h1 className="font-semibold">Dados Bancários</h1>
        </header>
        <form name="Bank" noValidate className="flex flex-col justify-center w-full mt-32" onSubmit={handleSubmit(onSubmit)}>
          <div className='absolute right-24 top-24'>
            {renderButton()}
          </div>

          <FormControl fullWidth>
            <Autocomplete
              {...register('bankCode')}
              id='bank-code-autocomplete'
              options={bankOptions}
              getOptionLabel={(option) => `${option.code} - ${option.name}`}
              value={userBank}
              isOptionEqualToValue={(option, value) => option.code === value?.code}
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
            {...register("bankAgency", {
              required: "A agência é obrigatória",
              pattern: {
                value: /^[0-9]*$/,
                message: "A agência deve conter apenas números"
              }
            })}
            className="mb-24"
            label="Agência"
            type="text"
            variant="outlined"
            fullWidth
            inputProps={{ maxLength: 4 }}
            error={!!errors.bankAgency}
            helperText={errors?.bankAgency?.message || (bankAgencyValue && !/^[0-9]*$/.test(bankAgencyValue) ? "A agência deve conter apenas números" : "")}
            disabled={!isEditable}
          />

          <Box className="flex justify-between">
            <TextField
              {...register("bankAccount", {
                required: "A conta bancária é obrigatória",
                pattern: {
                  value: /^[0-9]*$/,
                  message: "A conta bancária deve conter apenas números"
                }
              })}
              className="mb-24 w-[68%]"
              label="Conta"
              type="text"
              variant="outlined"
              fullWidth
              inputProps={{ maxLength: 12 }}
              error={!!errors.bankAccount}
              helperText={errors?.bankAccount?.message || (bankAccountValue && !/^[0-9]*$/.test(bankAccountValue) ? "A conta bancária deve conter apenas números" : "")}
              disabled={!isEditable}
            />
            <TextField
              {...register("bankAccountDigit")}
              className="mb-24 w-[30%]"
              label="Dígito"
              type="string"
              variant="outlined"
              fullWidth
              inputProps={{ maxLength: 2 }}
              disabled={!isEditable}
              error={!!errors.bankAccountDigit}
              helperText={errors?.bankAccountDigit?.message}
            />
          </Box>
        </form>
      </Card>
    </>
  );
}
