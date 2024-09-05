import { createSlice } from '@reduxjs/toolkit';
import jwtServiceConfig from '../auth/services/jwtService/jwtServiceConfig';
import { api } from 'app/configs/api/api';
import { useHistory } from 'react-router-dom';
import dayjs from 'dayjs';
import axios from 'axios';
import JwtService from '../auth/services/jwtService';
import accounting from 'accounting';


const initialState = {
    selectedPeriod: false,
    listTransactions: [],
    selectedDate: {
        mes: null,
        periodo: null
    },
    authValue: '',
    selectedStatus: null,
    selectedYear: null,
    clientesFavorecidos: []
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
        setSelectedStatus: (state, action) => {
            state.selectedStatus = action.payload;
        },
        setSelectedYear: (state, action) => {
            state.selectedYear = action.payload;
        },
        setClientesFavorecidos: (state, action) => {
            state.clientesFavorecidos = action.payload;
        },
    },
});

export const { setSelectedPeriod, selectedPeriod, listTransactions, setListTransactions, selectDate, setSelectedDate, authValue, setAuthValue, setSelectedStatus, selectedStatus, setSelectedYear , selectedYear, clientesFavorecidos, setClientesFavorecidos} = stepSlice.actions;
export default stepSlice.reducer;

export const getData = (data) => (dispatch) => {
    const token = window.localStorage.getItem('jwt_access_token');

    let url = `${jwtServiceConfig.finanGetInfo}?mes=${data.selectedDate.mes}&periodo=${data.selectedDate.periodo}`;

    if (data.selectedYearFormat !== null) {
        url += `&ano=${data.selectedYearFormat}`;
    }

    if (data.selectedStatus && data.selectedStatus.status !== null) {
        url += `&autorizado=${data.selectedStatus.status}`;
    }

    api.get(url, {
        headers: { "Authorization": `Bearer ${token}` },
    })
        .then((response) => {
            dispatch(setListTransactions(response.data));
            dispatch(setSelectedPeriod(true));
        });
};

export const getFavorecidos = () => (dispatch) => {
    const token = window.localStorage.getItem('jwt_access_token');
    
    api.get(`/cnab/clientes-favorecidos/`, {
        headers: { "Authorization": `Bearer ${token}` },params: {
            consorcio: 'Empresa'
        }
    })
        .then((response) => {
            dispatch(setClientesFavorecidos(response.data))
        })

}


export const setRelease = (data)  => (dispatch) => {
    const token = window.localStorage.getItem('jwt_access_token');

    if(JwtService.isAuthTokenValid(token)){
        return new Promise((resolve, reject) => {
            const month = data.mes
            const period = parseFloat(data.periodo)
            let dayOfMonth = 1

            if (period === 2) {
                dayOfMonth = 16
            }
            const unformatOptions = {
                decimal: ',', 
                thousand: '.', 
            }

            const parseDate = dayjs(data.data_ordem, 'DD/MM/YYYY')
            const releaseDate = dayjs().set('month', month - 1).set('date', dayOfMonth)
            
            const isoDateString = parseDate.toISOString()
            const releaseIsoDate = releaseDate.toISOString()
            const parsedIdFavorecido = parseFloat(data.favorecido)
            const cleanedData = {
                ...data,
                id_cliente_favorecido: parsedIdFavorecido,
                algoritmo: accounting.unformat(data.algoritmo.replace(/\./g, '').replace(',', '.')).toFixed(2),
                valor_a_pagar: accounting.unformat(data.valor_a_pagar.replace(/\./g, '').replace(',', '.')).toFixed(2),
                recurso: accounting.unformat(data.recurso.replace(/\./g, '').replace(',', '.')).toFixed(2),
                glosa: accounting.unformat(data.glosa.replace(/\./g, '').replace(',', '.')).toFixed(2),  
                valor: accounting.unformat(data.valor.replace(/\./g, '').replace(',', '.')).toFixed(2),  
                anexo: accounting.unformat(data.anexo.replace(/\./g, '').replace(',', '.')).toFixed(2),
                data_ordem: isoDateString,
                data_lancamento: releaseIsoDate

            };

            cleanedData.algoritmo = parseFloat(cleanedData.algoritmo);
            cleanedData.valor_a_pagar = parseFloat(cleanedData.valor_a_pagar);
            cleanedData.valor = parseFloat(cleanedData.valor);
            cleanedData.recurso = parseFloat(cleanedData.recurso);
            cleanedData.glosa = parseFloat(cleanedData.glosa);
            cleanedData.anexo = parseFloat(cleanedData.anexo);

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
    } 


};

export const editRelease = (data,id) => (dispatch) => {

    return new Promise((resolve, reject) => {
        const month = data.mes
        const period = parseFloat(data.periodo)
        let dayOfMonth = 1

        if (period === 2) {
            dayOfMonth = 16
        }


        const parseDate = dayjs(data.data_ordem, 'DD/MM/YYYY')
        const releaseDate = dayjs().set('month', month - 1).set('date', dayOfMonth)
        const isoDateString = parseDate.toISOString()
        const releaseIsoDate = releaseDate.toISOString()
        const cleanedData = {
            ...data,
            data_ordem: isoDateString,
            data_lancamento: releaseIsoDate

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
export const deleteRelease = (id) => (dispatch) => {

    return new Promise((resolve, reject) => {
   
        const token = window.localStorage.getItem('jwt_access_token');
        api.delete(jwtServiceConfig.finanGetInfo + `/${id}`,
            { headers: { "Authorization": `Bearer ${token}` } })
            .then((response) => {
                    resolve();
              
            })
            .catch((error) => {
                reject(error);
            });
    });
};
export const handleAuthValue = (data, id) => (dispatch) => {
    // const selectedDate = {
    //     mes: data.mes,
    //     periodo: data.periodo
    // }
    
    return new Promise((resolve, reject) => {
        const token = window.localStorage.getItem('jwt_access_token');
        api.get(jwtServiceConfig.finanGetInfo + `/getValorAutorizado?mes=${data.mes}&periodo=${data.periodo}&ano=2024`,
         
         {
            headers: { "Authorization": `Bearer ${token}` } 
        })
        .then((response) => {
            if (response.status === 200) {
                resolve()
                dispatch(setAuthValue(response.data.valor_autorizado))
                // dispatch(getData({ selectedDate, selectedStatus, selectedYear }))
            } else {
                reject(new Error('Erro'));
            }
        })
        .catch((error) => {
                reject(error);
        })

    })
}
export const handleAuthRelease = (data, id, password) => (dispatch) => {
    const selectedDate = {
        mes: data.mes,
        periodo: data.periodo
    }
    return new Promise((resolve, reject) => {
        const token = window.localStorage.getItem('jwt_access_token');
        api.put(jwtServiceConfig.finanGetInfo + `/authorize?lancamentoId=${id}`,
        { id: id,
         password: password},
         {
            headers: { "Authorization": `Bearer ${token}` } 
        })
        .then((response) => {
            if (response.status === 200) {
                resolve()
                dispatch(getData({ selectedDate, selectedStatus}))
                dispatch(handleAuthValue(data))

            } else {
                reject(error)
            }
        })

    })
}