import { createSlice } from '@reduxjs/toolkit';
import { api } from 'app/configs/api/api';
import { format, parseISO } from 'date-fns';
import accounting from 'accounting';
import jwtServiceConfig from '../auth/services/jwtService/jwtServiceConfig';
import JwtService from '../auth/services/jwtService';

const initialState = {
    searchingWeek: false,
    statements: [],
    mapInfo: [],
    previousDays: "lastMonth",
    dateRange: [],
    searchingDay: false,
    fullReport: false,
    todayStatements: [],
    multipliedEntries: [],
    listByType: [],
    firstDate: [],
    valorAcumuladoLabel:'Valor Operação - Acumulado Mensal',
    valorPagoLabel:'Valor Pago - Acumulado Mensal',
    sumInfo: [],
    sumInfoDay: [],
    pendingValue: [],
    pendingList: [],
    isLoading: false,
    isLoadingWeek: false,
    isLoadingPrevious: false,
    ordemPgtoId: '',
};

const extractSlice = createSlice({
    name: 'extract',
    initialState,
    reducers: {
        setSearchingWeek: (state, action) => {
            state.searchingWeek = action.payload;
        },
        setStatements: (state, action) => {
            state.statements = action.payload;
        },
        setMapInfo: (state, action) => {
            state.mapInfo = action.payload;
        },
        setPreviousDays: (state, action) => {
            state.previousDays = action.payload;
        },
        setDateRange: (state, action) => {
            state.dateRange = action.payload;
        },
        setSearchingDay: (state, action) => {
            state.searchingDay = action.payload;
        },
        setFullReport: (state, action) => {
            state.fullReport = action.payload;
        },
        setTodayStatements: (state, action) => {
            state.todayStatements = action.payload;
        },
        setMultipliedEntries: (state, action) => {
            state.multipliedEntries = action.payload;
        },
        setListByType: (state, action) => {
            state.listByType = action.payload;
        },
        setFirstDate: (state, action) => {
            state.firstDate = action.payload;
        },
        setSumInfo: (state, action) => {
            state.sumInfo = action.payload;
        },
        setSumInfoDay: (state, action) => {
            state.sumInfoDay = action.payload;
        },
        setValorAcumuladoLabel: (state, action) => {
            state.valorAcumuladoLabel = action.payload;
        },
        setValorPagoLabel: (state, action) => {
            state.valorPagoLabel = action.payload;
        },
        setPendingValue: (state, action) => {
            state.pendingValue = action.payload;
        },
        setPendingList: (state, action) => {
            state.pendingList = action.payload;

        },
        setLoading: (state, action) => {
            state.isLoading = action.payload;
        },
        setLoadingWeek: (state, action) => {
            state.isLoadingWeek = action.payload;
        },
        setLoadingPrevious: (state, action) => {
            state.isLoadingPrevious = action.payload;
        },
        setOrdemPgto: (state, action) => {
            state.ordemPgtoId = action.payload;
        },
       
    },
});

export const {
    previousDays,
    searchingDay,
    searchingWeek,
    mapInfo,
    statements,
    dateRange,
    fullReport,
    multipliedEntries,
    todayStatements,
    listByType,
    firstDate,
    setSearchingWeek,
    setStatements,
    setMapInfo,
    setPreviousDays,
    setDateRange,
    setSearchingDay,
    setFullReport,
    setTodayStatements,
    setMultipliedEntries,
    setListByType,
    setFirstDate,
    setValorAcumuladoLabel,
    setValorPagoLabel,
    sumInfo,
    setSumInfo,
    sumInfoDay,
    setSumInfoDay,
    setPendingList,
    pendingList,
    setPendingValue,
    pendingValue,
    setLoading,
    setLoadingWeek,
    setLoadingPrevious,
    setOrdemPgto,
    ordemPgtoId
} = extractSlice.actions;

export default extractSlice.reducer;
function handleRequestData(previousDays, dateRange) {

        return previousDays > 0 ? { timeInterval: previousDays } : { timeInterval: 'lastMonth', yearMonth: dateRange }

}


// export const  getPreviousDays = (dateRange, interval='lastWeek', userId) => async (dispatch) => {
//     const token = window.localStorage.getItem('jwt_access_token');
   
//     if(JwtService.isAuthTokenValid(token)){
//         let config = {
//             method: 'get',
//             maxBodyLength: Infinity,
//             url: userId ? jwtServiceConfig.bankStatement + `/previous-days?endDate=${dateRange}&timeInterval=${interval}&userId=${userId}` : jwtServiceConfig.bankStatement + `/previous-days?endDate=${dateRange}&timeInterval=${interval}`,
//             headers: { "Authorization": `Bearer ${token}` },
//         }
//         try {
//             dispatch(setLoadingPrevious(true))
//             const response = await api.request(config)
//             dispatch(setPendingValue(response.data.statusCounts))
//             dispatch(setPendingList(response.data))
//         } catch (error) {
//             console.error(error);
//         } finally {
//             dispatch(setLoadingPrevious(false))
//         }
//     }

// }

// export const getFirstTypes = (userId, dateRange, searchingWeek, searchingDay) => async (dispatch) => {

//     const requestData = searchingWeek ?  null: handleRequestData(null, dateRange, searchingDay, searchingWeek);

//     const token = window.localStorage.getItem('jwt_access_token');

//     let config = {
//         method: 'get',
//         maxBodyLength: Infinity,
//         url: userId ? jwtServiceConfig.revenues + `?userId=${userId}` : jwtServiceConfig.revenues,
//         headers: {
//             "Authorization": `Bearer ${token}`
//         },
//         params: {
//             ...requestData
//         }
//     };

//     try {
//         dispatch(setLoadingWeek(true))
//         const response = await api.request(config);
//         const order = ["Integral", "Integração", "Gratuidade"];

//         const sortedObject = Object.fromEntries(
//             Object.entries(response.data.transactionTypeCounts)
//                 .sort(([keyA], [keyB]) => order.indexOf(keyA) - order.indexOf(keyB))
//         );
//         dispatch(setListByType(sortedObject));
//     } catch (error) {
//         console.error(error);
//     } finally {
//         dispatch(setLoadingWeek(false))
//     }
// };

export const getStatements = (dateRange, searchingDay, searchingWeek, userId, idOrdem) => async (dispatch) => {


    const requestData = searchingWeek || searchingDay ?  null : handleRequestData(null, dateRange, searchingDay, searchingWeek);
    let apiRoute = ''
    if(!userId){
        apiRoute = searchingWeek && searchingDay
            ? jwtServiceConfig.revenuesDay
            : searchingWeek 
                ? jwtServiceConfig.revenuesUn
                : jwtServiceConfig.odpMensal
    } else {
        apiRoute = searchingWeek && searchingDay 
            ? jwtServiceConfig.odpDiario + `/${idOrdem}` 
        : searchingWeek  
                ? jwtServiceConfig.odpSemanal + `/${idOrdem}`
        : jwtServiceConfig.odpMensal + `?userId=${userId}`;
    }
    const method = 'get';
    const token = window.localStorage.getItem('jwt_access_token');


    if(JwtService.isAuthTokenValid(token)){
        const config = {
            method: method,
            maxBodyLength: Infinity,
            url: apiRoute,
            headers: {
                "Authorization": `Bearer ${token}`
            },
            params: {
                ...requestData,
            }
        };

        try {
            dispatch(setLoading(true))
            const response = await api(config);

            if (searchingWeek || searchingDay) {
                dispatch(setStatements(response.data));
                if(searchingDay){
                    const sum = response.data.map((statement) => statement.valor_pagamento)
                        .reduce((accumulator, currentValue) => accumulator + currentValue, 0)
                    dispatch(setSumInfoDay(sum))
                }

            } else {
                dispatch(setSumInfo(response.data))
                dispatch(setStatements(response.data.ordens));
            }

            return response.data;
        } catch (error) {
            throw error;
        } finally {
            dispatch(setLoading(false))
        }
    }
};





export const getMultipliedEntries = (statements, searchingDay, searchingWeek) => (dispatch) => {
    if (statements?.length > 0) {
        if (searchingDay) {
            const sum = statements.map((statement) => statement.valor_pagamento)
                .reduce((accumulator, currentValue) => accumulator + currentValue, 0)
            dispatch(setMultipliedEntries(sum));
        } else if (searchingWeek) {
            const sum = statements.map((statement) => statement.transactionValueSum)
                .reduce((accumulator, currentValue) => accumulator + currentValue, 0);
            dispatch(setMultipliedEntries(sum));
        } else {
            const sum = statements.map((statement) => statement.amount)
                .reduce((accumulator, currentValue) => accumulator + currentValue, 0);
            dispatch(setMultipliedEntries(sum));
        }
    }


}
