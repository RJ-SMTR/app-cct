import { createSlice } from '@reduxjs/toolkit';
import jwtServiceConfig from '../auth/services/jwtService/jwtServiceConfig';
import { api } from 'app/configs/api/api';
import { useHistory } from 'react-router-dom';
import dayjs from 'dayjs';


const initialState = {
    selectedPeriod: false,
    listTransactions: []
};

const stepSlice = createSlice({
    name: 'release',
    initialState,
    reducers: {
        setSelectedPeriod: (state, action) => {
            state.selectedPeriod = action.payload;
        },
        setListTransactions: (state, action) => {
            state.listTransactions = action.payload;
        },
    },
});

export const { setSelectedPeriod, selectedPeriod, listTransactions, setListTransactions} = stepSlice.actions;
export default stepSlice.reducer;

export const getData = (data) => (dispatch) => {
    const token = window.localStorage.getItem('jwt_access_token');
    const selectDate = data.selectedDate
    console.log(selectDate)
    
    api.get(jwtServiceConfig.finanGetInfo + `?mes=${selectDate.mes}&periodo=${selectDate.periodo}&ano=2024`, {
        headers: { "Authorization": `Bearer ${token}` },
    })
        .then((response) => {
            dispatch(setListTransactions(response.data))
            dispatch(setSelectedPeriod(true))
         
        })

}


export const setRelease = (data)  => (dispatch) => {
    return new Promise((resolve, reject) => {
        const parseDate = dayjs(data.data_ordem, 'DD/MM/YYYY')
        const isoDateString = parseDate.toISOString()
        const cleanedData = {
            ...data,
            recurso: parseInt(data.recurso.replace(/\D/g, '')),
            valor_a_pagar: parseInt(data.valor_a_pagar.replace(/\D/g, '')),
            algoritmo: parseInt(data.algoritmo.replace(/\D/g, '')),
            glosa: parseInt(data.glosa.replace(/\D/g, '')),
            valor: parseInt(data.valor_a_pagar.replace(/\D/g, '')),
            data_ordem: isoDateString

        };

        const token = window.localStorage.getItem('jwt_access_token');
        api.post(jwtServiceConfig.setRelease,
            cleanedData,
            { headers: { "Authorization": `Bearer ${token}` } })
            .then((response) => {
                console.log(response);
                if (response.status === 201) {
                    resolve(); 
                } else {
                    reject(new Error('Erro')); 
                }
            })
            .catch((error) => {
                reject(error); 
            });
    });
};
export const editRelease = (data,id) => (dispatch) => {
    return new Promise((resolve, reject) => {
        
        const parseDate = dayjs(data.data_ordem, 'DD/MM/YYYY')
        const isoDateString = parseDate.toISOString()
        const cleanedData = {
            ...data,
            recurso: parseInt(data.recurso.replace(/\D/g, '')),
            valor_a_pagar: parseInt(data.valor_a_pagar.replace(/\D/g, '')),
            algoritmo: parseInt(data.algoritmo.replace(/\D/g, '')),
            glosa: parseInt(data.glosa.replace(/\D/g, '')),
            valor: parseInt(data.valor_a_pagar.replace(/\D/g, '')),
            numero_processo: parseInt(data.numero_processo),
            data_ordem: isoDateString

        };

        const token = window.localStorage.getItem('jwt_access_token');
        api.put(jwtServiceConfig.finanGetInfo + `?lancamentoId=${id}`,
            cleanedData,
            { headers: { "Authorization": `Bearer ${token}` } })
            .then((response) => {
                console.log(response);
                if (response.status === 200) {
                    resolve();
                } else {
                    reject(new Error('Erro'));
                }
            })
            .catch((error) => {
                reject(error);
            });
    });
};
export const handleAuthRelease = (id) => (dispatch) => {
    return new Promise((resolve, reject) => {
        const token = window.localStorage.getItem('jwt_access_token');
        api.put(jwtServiceConfig.finanGetInfo + `/authorize?lancamentoId=${id}`,
         id,
         {
            headers: { "Authorization": `Bearer ${token}` } 
        })
        .then((response) => {
            if (response.status === 200) {
                resolve()
            } else {
                reject(new Error('Erro ao autorizar'));
            }
        })

    })
}