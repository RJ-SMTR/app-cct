import React, { useState } from 'react';
import { Typography, Paper, Box } from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import axios from 'axios';
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

            if (apiError.file) {
              apiError.file.invalidRows.forEach((invalidRow) => {
                const errorMessage = `Coluna ${invalidRow.row}: E-mail já existe`

                if (invalidRow.errors.permitCode) {
                  errorMessage += ` (código de permissão: ${invalidRow.user.permitCode})`
                }

                setError('file', {
                  type: 'server',
                  message: errorMessage,
                });
              });
            }
            reject(error)
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
                              <label className='my-10'>Formatos permitidos: .csv, .XLSX, .XLS e etc.</label>
                
                      <input
                      {...register('file')}
                        type="file"
                        accept=".xlsx, .csv"
                       
                      />
                      {errors.file && (
                        <p className="text-red-500 my-10">{errors.file.message}</p>
                      )}


                              <button type="submit" className='rounded p-3 uppercase text-white bg-[#0DB1E3] h-[27px] min-h-[27px] font-medium px-10 '>Enviar</button>
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
