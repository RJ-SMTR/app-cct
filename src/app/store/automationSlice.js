import { createSlice } from '@reduxjs/toolkit';
import jwtServiceConfig from '../auth/services/jwtService/jwtServiceConfig';
import { api } from 'app/configs/api/api';
import accounting from 'accounting';

function parseCurrency(raw) {
    if (raw === null || raw === undefined) return null;
    if (typeof raw === 'number') return Number(Number(raw).toFixed(2));
    let s = String(raw).trim();
    if (s === '') return null;

    s = s.replace(/\s/g, '');
    const hasDot = s.indexOf('.') !== -1;
    const hasComma = s.indexOf(',') !== -1;
    let normalized;
    if (hasDot && hasComma) {
        if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
            normalized = s.replace(/\./g, '').replace(',', '.');
        } else {
            normalized = s.replace(/,/g, '');
        }
    } else if (hasComma) {
        normalized = s.replace(/\./g, '').replace(',', '.');
    } else {
        normalized = s.replace(/,/g, '');
    }
    const num = Number(normalized);
    return Number.isFinite(num) ? Number(num.toFixed(2)) : null;
}


const initialState = {
    bookings: [],
    approval: [],
};

const automationSlice = createSlice({
    name: 'automation',
    initialState,
    reducers: {
        setBookings: (state, action) => {
            state.bookings = action.payload;
        },
        setApproval: (state, action) => {
            state.approval = action.payload;
        },

    }
});

export const {
    bookings,setBookings,
    approval,setApproval,
} = automationSlice.actions;

export default automationSlice.reducer;

function handleData(data) {
    // eslint-disable-next-line no-console
    const requestData = {};

    if (Array.isArray(data?.consorcioName) && data.consorcioName.length > 0) {
        requestData.tipoBeneficiario = 'Consorcio';
        requestData.beneficiarioUsuario = data.consorcioName[0];
    } else if (Array.isArray(data?.name) && data.name.length > 0) {
        requestData.tipoBeneficiario = 'Modal';
        requestData.beneficiarioUsuario = data.name[0];
    } else {
        requestData.tipoBeneficiario = data?.tipoBeneficiario ?? null;
        requestData.beneficiarioUsuario = data?.beneficiarioUsuario ?? null;
    }

    const aprovacaoValue = data?.aprovacao;
    if (typeof aprovacaoValue === 'string') {
        requestData.aprovacao = aprovacaoValue.includes('Necessita');
    } else if (typeof aprovacaoValue === 'boolean') {
        requestData.aprovacao = aprovacaoValue;
    } else {
        requestData.aprovacao = false;
    }

    const rawValor = data?.valorPagamentoUnico ?? data?.dataPagamentoUnico ?? data?.data?.valorPagamentoUnico;
    if (rawValor !== undefined && rawValor !== null && rawValor !== '') {
        const parsed = parseCurrency(rawValor);
        if (parsed !== null) {
            requestData.valorPagamentoUnico = parsed;
        } else {
            requestData.valorPagamentoUnico = rawValor;
        }
    }

    if (data?.dataPagamentoUnico) requestData.dataPagamentoUnico = data.dataPagamentoUnico;
    if (data?.motivoPagamentoUnico) requestData.motivoPagamentoUnico = data.motivoPagamentoUnico;

    requestData.tipoPagamento = data?.tipoPagamento ?? null;

    const horarioRaw = data?.horario;
    if (horarioRaw) {
        if (typeof horarioRaw === 'string') {
            const m = horarioRaw.match(/(\d{1,2}:\d{2}(?::\d{2})?)/);
            requestData.horario = m ? m[1] : horarioRaw;
        } else if (horarioRaw instanceof Date || typeof horarioRaw?.toTimeString === 'function') {
            try {
                requestData.horario = horarioRaw.toTimeString().split(' ')[0];
            } catch (e) {
                requestData.horario = String(horarioRaw);
            }
        } else {
            requestData.horario = String(horarioRaw);
        }
    }

    requestData.diaSemana = data?.diaSemana ?? null;
    requestData.status = false;

    // eslint-disable-next-line no-console
    return requestData;
}

export const bookPayment = (data) => async (dispatch) => {
    const requestData = handleData(data)

    let apiRoute = jwtServiceConfig.agendamento
    const method = 'post';
    const token = window.localStorage.getItem('jwt_access_token');

    const config = {
        method: method,
        maxBodyLength: Infinity,
        url: apiRoute,
        headers: {
            "Authorization": `Bearer ${token}`
        },
           data: requestData
    };

    try{
        const response = await api(config);
        if(response.status == 201){
            dispatch(getBookings())
        }
        return response.data;
    } catch(error) {
        console.error(error)
    }

}

export const editPayment = (data) => async (dispatch) => {
    const apiRoute = `${jwtServiceConfig.agendamento}${data.id}`; 
    const token = window.localStorage.getItem('jwt_access_token');

    const config = {
        method: 'put',
        url: apiRoute,
        headers: { "Authorization": `Bearer ${token}` },
        data
    };

    try {
        const response = await api(config);
        if ([200, 201, 202, 204].includes(response.status)) { 
            dispatch(getBookings());
        }
        return response; 
    } catch (error) {
        console.error(error);
        throw error;
    }
};



export const getBookings = (data) => async (dispatch) => {

    
    let apiRoute = jwtServiceConfig.agendamento
    const method = 'get';
    const token = window.localStorage.getItem('jwt_access_token');

    const config = {
        method: method,
        maxBodyLength: Infinity,
        url: apiRoute,
        headers: {
            "Authorization": `Bearer ${token}`
        },
        params: {
            id: data
        }
    };

    try{
        const response = await api.request(config)
        dispatch(setBookings(response.data))
        


    }catch{}

}
export const getApproval = (data) => async (dispatch) => {

    
    let apiRoute = jwtServiceConfig.aprovacao
    const method = 'get';
    const token = window.localStorage.getItem('jwt_access_token');

    const config = {
        method: method,
        maxBodyLength: Infinity,
        url: apiRoute,
        headers: {
            "Authorization": `Bearer ${token}`
        },
        params: {
            id: data
        }
    };

    try{
        const response = await api.request(config)
        dispatch(setApproval(response.data))
        


    }catch{}

}

// export const rmPayment = (id, password) => async (dispatch) => {

//     let apiRoute = jwtServiceConfig.agendamento
//     const method = 'delete';
//     const token = window.localStorage.getItem('jwt_access_token');

//     const config = {
//         method: method,
//         maxBodyLength: Infinity,
//         url: apiRoute,
//         headers: {
//             "Authorization": `Bearer ${token}`
//         },
//         params: {
//            password: password,
//            id: id
//         }
//     };

//     try{
//         const response = await api(config);
//         console.log(response)
//         return response.data;
//     } catch(error) {
//         console.error(error)
//     }

// }
// export const editPayment = (id, data) => async (dispatch) => {
//     const token = window.localStorage.getItem('jwt_access_token');
//      api.put(jwtServiceConfig.agendamento + `?agendamentoId=${id}`,
//         data,
//         { headers: { "Authorization": `Bearer ${token}` } })
//         .then((response) => {
//           console.log(response)
//         })
//         .catch((error) => {
//             console.error(error);
//         });

// }


    export const deleteBooking = (id, password) => async (dispatch) => {
        const token = window.localStorage.getItem('jwt_access_token');
        return new Promise((resolve, reject) => {
            api.delete(
                `${jwtServiceConfig.agendamento}${id}`,
                {
                    headers: { "Authorization": `Bearer ${token}`},
                    data: { password: password }
                }
            )
                .then((response) => {
                 
                    resolve(response);
                })
                .catch((error) => {
                    reject(error);
                });
        });

    }
export const approveBooking = (id, password, valorAprovado) => async (dispatch) => {
    const token = window.localStorage.getItem('jwt_access_token');

    let rawValor = valorAprovado
        if (rawValor !== undefined && rawValor !== null && rawValor !== '') {
                const parsed = parseCurrency(rawValor);
                rawValor = parsed !== null ? parsed : rawValor;
        }
     
    return new Promise((resolve, reject) => {
        api.put(
            `${jwtServiceConfig.aprovacao}aprovar/${id}`,
            { password: password,
                valorAprovado: rawValor
             }, 
            {
                headers: {
                    "Authorization": `Bearer ${token}` 
                }
            }
        )
            .then((response) => {
                resolve(response);
            })
            .catch((error) => {
                reject(error);
            });
    });
};
