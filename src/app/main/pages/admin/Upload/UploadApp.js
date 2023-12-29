import React, { useEffect, useState } from 'react';
import { Typography, Paper, Box } from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { api } from 'app/configs/api/api';
import { showMessage } from 'app/store/fuse/messageSlice';
import { useDispatch } from 'react-redux';

function UploadApp() {
  const { handleSubmit, register, setError, formState: { errors }, reset } = useForm()
  const dispatch = useDispatch()

  const fileSchema = yup
    .mixed()
    .test('fileSize', 'O arquivo é grande demais', (value) => {
      if (!value) return true;
      return value.size <= 30000000
    })

  const onSubmit = async (formData) => {
    const selectedFile = formData.file[0]
    if (selectedFile) {
      try {
        await fileSchema.validate(selectedFile)
      } catch (validationError) {
        setError('file', {
          type: 'validation',
          message: validationError.message,
        })
        return
      }

      const token = window.localStorage.getItem('jwt_access_token')

      const data = new FormData()
      data.append('file', selectedFile)

      return new Promise((resolve, reject) => {
        api
          .post('users/upload', data, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
          .then((response) => {
            dispatch(showMessage({ message: 'Arquivo enviado' }))
            resolve(response.data)
            reset()
            clearErrors('file')
          })
          .catch((error) => {
            const { error: apiError } = error.response.data
            const errorMessages = []

            if (apiError.file.invalidRows) {
              apiError.file.invalidRows.forEach((invalidRow) => {
                let errorMessage;
               if (invalidRow.errors.email) {
                 errorMessage = `Linha ${invalidRow.row}: E-mail:  ${invalidRow.errors.email}!`;
                } else {
                  errorMessage = `Linha ${invalidRow.row}: `;
                }

                if (invalidRow.errors.codigo_permissionario ) {
                  errorMessage += ` Código de Permissionário: ${invalidRow.errors.codigo_permissionario})`;
                }
                if (invalidRow.errors.cpf ) {
                  errorMessage += ` CPF: ${invalidRow.errors.cpf}!`;
                }
                if (invalidRow.errors.telefone ) {
                  errorMessage += ` telefone: ${invalidRow.errors.telefone}`;
                }

                if (!errorMessages[invalidRow.row]) {
                  errorMessages[invalidRow.row] = errorMessage;
                } else {
                  errorMessages[invalidRow.row] += `\n${errorMessage}`;
                }
              })
              Object.keys(errorMessages).forEach((email) => {
                setError(`file[${email}]`, {
                  type: 'server',
                  message: errorMessages[email],
                });
              });
            } else {
              setError('file', {
                type: 'server',
                message: 'Cabeçalhos inválidos. Verifique se está nessa ordem: código de permissionário, email, telefone, nome e CPF '
              })
            }
            reject(errors)
          });
      });
    }
  };


  return (
    <>
      <div className="p-24 pt-10">
        <Typography className="font-medium text-3xl">Upload de Arquivos</Typography>
        <Box className="flex flex-col justify-around">
          <div>
            <Paper className="flex flex-col flex-auto p-12 mt-24 shadow rounded-2xl overflow-hidden">
              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
                <Typography className='font-medium text-2xl'>Enviar arquivos</Typography>
                <label className='my-10'>Formatos permitidos: .CSV, .XLSX, .XLS</label>

                <input
                  {...register('file')}
                  type="file"
                  accept=".xlsx, .csv, .xls"

                />
                {errors.file ?
                  errors.file.map((error, index) => (
                    <p key={index} className="text-red-500 my-10">{error.message}</p>
                  ))
                  : <></> }



                <button type="submit" className='rounded p-3 uppercase text-white bg-[#0DB1E3] h-[27px] min-h-[27px] font-medium px-10 mt-10 '>Enviar</button>

              </form>
            </Paper>
          </div>
        </Box>
        <br />
      </div>
    </>
  );
}

export default UploadApp;
