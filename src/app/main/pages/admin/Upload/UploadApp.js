import React, { useState } from 'react';
import { Typography, Paper, Box } from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import axios from 'axios';
import { api } from 'app/configs/api/api';

function UploadApp() {
  const { control, handleSubmit, setError, clearErrors, formState: { errors } } = useForm();

  const fileSchema = yup
    .mixed()
    .test('fileSize', 'O arquivo é grande demais', (value) => {
      if (!value) return true;
      return value.size <= 30000000;
    })

  const onSubmit =  (formData) => {
     fileSchema.validate(formData.file);
    const token = window.localStorage.getItem('jwt_access_token');

    return new Promise((resolve, reject) => {
      api.post('files/upload', formData, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((response) => {
        console.log(response)
        resolve(response.data)
      })
      .catch((error) => {
        reject(error)
      })
    })
  }

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
                <Controller
                  name="file"
                  control={control}
                  render={({ field }) => (
                    <>
                      <input
                        {...field}
                        type="file"
                        accept=".xlsx, .csv"
                        onChange={(e) => {
                          field.onChange(e);
                          clearErrors('file');
                        }}
                      />
                      {errors.file && (
                        <p className="text-red-500">{errors.file.message}</p>
                      )}
                    </>
                  )}
                />


                              <button type="submit" className='rounded p-3 uppercase text-white bg-[#0DB1E3] h-[27px] min-h-[27px] font-medium px-10 my-10'>Enviar</button>
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
