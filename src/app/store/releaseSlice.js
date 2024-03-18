import { createSlice } from '@reduxjs/toolkit';
import jwtServiceConfig from '../auth/services/jwtService/jwtServiceConfig';
import { api } from 'app/configs/api/api';
import { useHistory } from 'react-router-dom';
import dayjs from 'dayjs';
import axios from 'axios';
import { cnab } from 'app/configs/api/cnab';


const initialState = {
    selectedPeriod: false,
    listTransactions: [],
    selectedDate: {
        mes: '',
        periodo: ''
    },
    authValue: '',
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
        setSelectedDate: (state, action) => {
            state.selectedDate = action.payload;
        },
        setAuthValue: (state, action) => {
            state.authValue = action.payload;
        },
    },
});

export const { setSelectedPeriod, selectedPeriod, listTransactions, setListTransactions, selectDate, setSelectedDate, authValue, setAuthValue} = stepSlice.actions;
export default stepSlice.reducer;

export const getData = (data) => (dispatch) => {
    const token = window.localStorage.getItem('jwt_access_token');
    const selectDate = data.selectedDate ?? data
    
    api.get(jwtServiceConfig.finanGetInfo + `?mes=${selectDate.mes}&periodo=${selectDate.periodo}&ano=2024`, {
        headers: { "Authorization": `Bearer ${token}` },
    })
        .then((response) => {
            dispatch(setListTransactions(response.data))
            dispatch(setSelectedPeriod(true))
         
        })

}
export const getFavorecidos = () => (dispatch) => {
    const token = window.localStorage.getItem('jwt_access_token');
    
    cnab.get('/cnab/clientes-favorecidos', {
        headers: { "Authorization": `Bearer ${token}` },
    })
        .then((response) => {
           
         
        })

}


export const setRelease = (data)  => (dispatch) => {
    return new Promise((resolve, reject) => {
        const parseDate = dayjs(data.data_ordem, 'DD/MM/YYYY')
        const isoDateString = parseDate.toISOString()
        const cleanedData = {
            ...data,
            recurso: data.recurso == null ? 0 : parseInt(data.recurso.replace(/\D/g, ''), 10),
            algoritmo: parseInt(data.algoritmo.replace(/\D/g, '')),
            glosa: data.glosa == null ? 0 : parseInt(data.glosa.replace(/\D/g, ''), 10),
            data_ordem: isoDateString

        };

        const token = window.localStorage.getItem('jwt_access_token');
        api.post(jwtServiceConfig.setRelease,
            cleanedData,
            { headers: { "Authorization": `Bearer ${token}` } })
            .then((response) => {
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
            // valor_a_pagar: parseInt(data.valor_a_pagar.replace(/\D/g, '')),
            algoritmo: parseInt(data.algoritmo.replace(/\D/g, '')),
            glosa: parseInt(data.glosa.replace(/\D/g, '')),
            // valor: parseInt(data.valor_a_pagar.replace(/\D/g, '')),
            numero_processo: parseInt(data.numero_processo),
            data_ordem: isoDateString

        };

        const token = window.localStorage.getItem('jwt_access_token');
        api.put(jwtServiceConfig.finanGetInfo + `?lancamentoId=${id}`,
            cleanedData,
            { headers: { "Authorization": `Bearer ${token}` } })
            .then((response) => {
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
export const handleAuthValue = (data, id) => (dispatch) => {
    
    return new Promise((resolve, reject) => {
        const token = window.localStorage.getItem('jwt_access_token');
        api.get(jwtServiceConfig.finanGetInfo + `/getValorAutorizado?mes=${data.mes}&periodo=${data.periodo}&ano=2024`,
         
         {
            headers: { "Authorization": `Bearer ${token}` } 
        })
        .then((response) => {
            if (response.status === 200) {
                resolve()
                dispatch(getData(data))
                dispatch(setAuthValue(response.data.valor_autorizado))
            } else {
                reject(new Error('Erro ao autorizar'));
            }
        })

    })
}
export const handleAuthRelease = (data, id) => (dispatch) => {
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
                dispatch(getData(data))
                dispatch(handleAuthValue(data))

            } else {
                reject(new Error('Erro ao autorizar'));
            }
        })

    })
}