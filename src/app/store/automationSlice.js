import { createSlice } from '@reduxjs/toolkit';
import jwtServiceConfig from '../auth/services/jwtService/jwtServiceConfig';
import { api } from 'app/configs/api/api';


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
  let requestData = {};

    if (data.consorcioName && data.consorcioName.length > 0) {
        requestData.tipoBeneficiario = 'Consorcio'
        requestData.beneficiarioUsuario = data.consorcioName[0];

    } else {
        requestData.tipoBeneficiario = 'Modal'
        requestData.beneficiarioUsuario = data.name[0]
    }

    requestData.aprovacao = data.aprovacao.includes('Necessita') ? true : false;

    if(data.valorPagamentoUnico){
        requestData.valorPagamentoUnico = parseFloat(data.valorPagamentoUnico);
    }
    if(data.dataPagamentoUnico){
        requestData.dataPagamentoUnico = data.dataPagamentoUnico;
    }
    if(data.motivoPagamentoUnico){
        requestData.motivoPagamentoUnico = data.motivoPagamentoUnico;
    }

    requestData.tipoPagamento = data.tipoPagamento;
    requestData.horario = data.horario;
    requestData.diaSemana = data.diaSemana;
    requestData.status = false;
  

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
        console.log(response)
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


    export const deleteBooking = (data) => async (dispatch) => {
        console.log(data)
        const token = window.localStorage.getItem('jwt_access_token');
        return new Promise((resolve, reject) => {
            api.delete(
                `${jwtServiceConfig.agendamento}${data}`,
                {
                    headers: { "Authorization": `Bearer ${token}` },
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

