import { createSlice } from '@reduxjs/toolkit';
import jwtServiceConfig from '../auth/services/jwtService/jwtServiceConfig';
import { api } from 'app/configs/api/api';
import { useHistory } from 'react-router-dom';
import dayjs from 'dayjs';
import axios from 'axios';
import JwtService from '../auth/services/jwtService';
import accounting from 'accounting';
import { format } from 'date-fns';


const initialState = {
    selectedPeriod: false,
    listTransactions: [],
    selectedDate: {
        mes: '',
        periodo: ''
    },
    authValue: '',
    selectedStatus: null,
    selectedYear: '',
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

export const { setSelectedPeriod, selectedPeriod, listTransactions, setListTransactions, selectDate, setSelectedDate, authValue, setAuthValue, setSelectedStatus, selectedStatus, setSelectedYear, selectedYear, clientesFavorecidos, setClientesFavorecidos } = stepSlice.actions;
export default stepSlice.reducer;

export const getData = (data) => (dispatch) => {
    const token = window.localStorage.getItem('jwt_access_token');

    let url = `${jwtServiceConfig.finanGetInfo}`;

    if (data.selectedDate.mes !== '' && data.selectedDate.periodo !== '') {
        url += `?mes=${data.selectedDate.mes}&periodo=${data.selectedDate.periodo}`;
    }

    if (data.selectedYear && data.selectedYear !== null) {
        const year = format(data.selectedYear, 'yyyy');
        url += url.includes('?') ? `&ano=${year}` : `?ano=${year}`;
    }

    if (data.selectedStatus && data.selectedStatus.status !== null && data.selectedStatus.status !== 'todos') {
        url += url.includes('?') ? `&status=${data.selectedStatus.status}` : `?status=${data.selectedStatus.status}`;
    }

    return new Promise((resolve, reject) => {
        api.get(url, {
            headers: { "Authorization": `Bearer ${token}` },
        })
            .then((response) => {
                dispatch(setListTransactions(response.data));
                dispatch(setSelectedPeriod(true));
                resolve(response);
            })
            .catch((error) => {
                reject(error);
            });
    });
};

export const getFavorecidos = () => (dispatch) => {
    const token = window.localStorage.getItem('jwt_access_token');

    api.get(`/cnab/clientes-favorecidos/`, {
        headers: { "Authorization": `Bearer ${token}` }, params: {
            consorcio: 'Empresa'
        }
    })
        .then((response) => {
            const array = response.data
            const withoutVLT = array.filter(item => !item.nome.includes('VLT'))
            const withVLT = array.filter(item => item.nome.includes('VLT'))
            const orderedArray = [...withoutVLT, ...withVLT]
            dispatch(setClientesFavorecidos(orderedArray))
        })

}


export const setRelease = (data) => (dispatch) => {
    const token = window.localStorage.getItem('jwt_access_token');

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
            recurso: accounting.unformat(data.recurso.replace(/\./g, '').replace(',', '.')).toFixed(2),
            glosa: accounting.unformat(data.glosa.replace(/\./g, '').replace(',', '.')).toFixed(2),
            valor: accounting.unformat(data.valor.replace(/\./g, '').replace(',', '.')).toFixed(2),
            anexo: accounting.unformat(data.anexo.replace(/\./g, '').replace(',', '.')).toFixed(2),
            data_ordem: isoDateString,
            data_lancamento: releaseIsoDate

        };

        cleanedData.algoritmo = parseFloat(cleanedData.algoritmo);
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


};

export const editRelease = (data, id) => (dispatch) => {
    const token = window.localStorage.getItem('jwt_access_token');
    if (JwtService.isAuthTokenValid(token)) {
        return new Promise((resolve, reject) => {
            const month = data.mes;
            const period = parseFloat(data.periodo);
            let dayOfMonth = 1;

            if (period === 2) {
                dayOfMonth = 16;
            }

            const parseDate = dayjs(data.data_ordem, 'DD/MM/YYYY');
            const releaseDate = dayjs().set('month', month - 1).set('date', dayOfMonth);
            const isoDateString = parseDate.toISOString();
            const releaseIsoDate = releaseDate.toISOString();

            const cleanedData = {
                ...data,
                data_ordem: isoDateString,
                data_lancamento: releaseIsoDate,
                algoritmo: typeof data.algoritmo === 'string'
                    ? accounting.unformat(data.algoritmo.replace(/\./g, '').replace(',', '.')).toFixed(2)
                    : data.algoritmo.toFixed(2),
                recurso: typeof data.recurso === 'string'
                    ? accounting.unformat(data.recurso.replace(/\./g, '').replace(',', '.')).toFixed(2)
                    : data.recurso.toFixed(2),
                glosa: typeof data.glosa === 'string'
                    ? accounting.unformat(data.glosa.replace(/\./g, '').replace(',', '.')).toFixed(2)
                    : data.glosa.toFixed(2),
                valor: typeof data.valor === 'string'
                    ? accounting.unformat(data.valor.replace(/\./g, '').replace(',', '.')).toFixed(2)
                    : data.valor.toFixed(2),
                anexo: typeof data.anexo === 'string'
                    ? accounting.unformat(data.anexo.replace(/\./g, '').replace(',', '.')).toFixed(2)
                    : data.anexo.toFixed(2),
            };

            cleanedData.algoritmo = parseFloat(cleanedData.algoritmo);
            cleanedData.valor = parseFloat(cleanedData.valor);
            cleanedData.recurso = parseFloat(cleanedData.recurso);
            cleanedData.glosa = parseFloat(cleanedData.glosa);
            cleanedData.anexo = parseFloat(cleanedData.anexo);

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
    }
};
export const deleteRelease = (id, justification, password) => (dispatch) => {
    const token = window.localStorage.getItem('jwt_access_token');

    if (JwtService.isAuthTokenValid(token)) {
        return new Promise((resolve, reject) => {
            api.delete(
                `${jwtServiceConfig.finanGetInfo}/${id}`,
                {
                        password: password,
                        motivo_cancelamento: justification,
                },
                {
                    headers: { "Authorization": `Bearer ${token}` },
                 
                }
            )
                .then((response) => {
                    resolve();
                })
                .catch((error) => {
                    reject(error);
                });
        });
    }
};

export const handleAuthValue = (data) => (dispatch) => {
    return new Promise((resolve, reject) => {
        const token = window.localStorage.getItem('jwt_access_token');

        let url = `${jwtServiceConfig.finanGetInfo}/getValorAutorizado?ano=2024`;

        if (data.selectedDate.mes !== '') {
            url += `&mes=${data.mes}`;
        }

        if (data.selectedDate.periodo !== '') {
            url += `&periodo=${data.periodo}`;
        }

        api.get(url, {
            headers: { "Authorization": `Bearer ${token}` }
        })
            .then((response) => {
                if (response.status === 200) {
                    resolve();
                    dispatch(setAuthValue(response.data.valor_autorizado));
                } else {
                    reject(new Error('Erro'));
                }
            })
            .catch((error) => {
                reject(error);
            });
    });
};

export const handleAuthRelease = (selectedDate,selectedStatus, id, password) => (dispatch) => {
    const searchParams = {
        selectedDate: { ...selectedDate },
        selectedStatus,
    };

    const token = window.localStorage.getItem('jwt_access_token');
    return new Promise((resolve, reject) => {
        api.put(jwtServiceConfig.finanGetInfo + `/authorize?lancamentoId=${id}`,
            {
                id: id,
                password: password
            },
            {
                headers: { "Authorization": `Bearer ${token}` }
            })
            .then((response) => {
                if (response.status === 200) {
                    resolve()
                    dispatch(getData(searchParams))
                    // dispatch(handleAuthValue(data))

                } else {
                    reject(error)
                }
            })
            .catch((error) => {
                reject(error)
            })

    })
}