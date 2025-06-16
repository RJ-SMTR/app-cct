import { createSlice } from '@reduxjs/toolkit';
import { api } from 'app/configs/api/api';
import { compareAsc, compareDesc, endOfMonth, format, parseISO, startOfMonth } from 'date-fns';
import accounting from 'accounting';
import jwtServiceConfig from '../auth/services/jwtService/jwtServiceConfig';
import JwtService from '../auth/services/jwtService';

const initialState = {
    searchingWeek: false,
    statements: [],
    mapInfo: [],
    previousDays: "",
    dateRange: [],
    searchingDay: false,
    fullReport: false,
    todayStatements: [],
    multipliedEntries: [],
    listByType: [],
    firstDate: [],
    valorAcumuladoLabel: 'Valor Operação - Acumulado Mensal',
    valorPagoLabel: 'Valor  - Acumulado Mensal',
    sumInfo: [],
    sumInfoDay: [],
    pendingValue: [],
    pendingList: [],
    isLoading: false,
    isLoadingWeek: false,
    isLoadingPrevious: false,
    ordemPgtoId: '',
    list24: []
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
        setList24: (state, action) => {
            state.list24 = action.payload;
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
    ordemPgtoId,
    list24,
    setList24
} = extractSlice.actions;

export default extractSlice.reducer;
function handleRequestData(previousDays, dateRange) {

    return previousDays > 0 ? { timeInterval: previousDays } : { yearMonth: dateRange }

}


export const getPreviousDays = (idOrdem, userId) => async (dispatch) => {
    const token = window.localStorage.getItem('jwt_access_token');

    if (JwtService.isAuthTokenValid(token)) {
        let config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: userId ? jwtServiceConfig.odpAnteriores + `/${idOrdem}?userId=${userId}` : jwtServiceConfig.bankStatement + `/${idOrdem}`,
            headers: { "Authorization": `Bearer ${token}` },
        }
        try {
            dispatch(setLoadingPrevious(true))
            const response = await api.request(config)
            dispatch(setPendingList(response.data))
        } catch (error) {
            console.error(error);
        } finally {
            dispatch(setLoadingPrevious(false))
        }
    }

}

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

    const requestData = searchingDay ? { ordemPagamentoIds: idOrdem } : searchingWeek ? null : handleRequestData(null, dateRange, searchingDay, searchingWeek);
    let apiRoute = ''
    apiRoute = searchingWeek && searchingDay
        ? jwtServiceConfig.odpDiario + `/?userId=${userId}`
        : searchingWeek
            ? jwtServiceConfig.odpSemanal + `/${idOrdem}?userId=${userId}`
            : jwtServiceConfig.odpMensal + `?userId=${userId}`;
    const method = 'get';
    const token = window.localStorage.getItem('jwt_access_token');


    if (JwtService.isAuthTokenValid(token)) {
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
            if (searchingDay) {
                const statementsSort = response.data.sort((a, b) =>
                    compareDesc(parseISO(a.datetime_transacao), parseISO(b.datetime_transacao))
                );

                dispatch(setStatements(statementsSort));

                const sum = response.data.map((statement) => statement.valor_pagamento)
                    .reduce((accumulator, currentValue) => accumulator + currentValue, 0)
                dispatch(setSumInfoDay(sum))
            }
            else if (searchingWeek) {
                dispatch(getPreviousDays(idOrdem, userId))

                const statementsSort = response.data.sort((a, b) =>
                    compareDesc(parseISO(a.dataCaptura), parseISO(b.dataCaptura))
                );
                dispatch(setStatements(statementsSort));

                // }



            } else {
                const statementsSort = response.data.ordens.sort((a, b) =>
                    compareDesc(parseISO(a.data), parseISO(b.data))
                );

                dispatch(setStatements(statementsSort));
                dispatch(setSumInfo(response.data))
            }

            return response.data;
        } catch (error) {
            throw error;
        } finally {
            dispatch(setLoading(false))
        }
    }
};

export const get24 = (dateRange, userId) => async (dispatch) => {
    const dataInicio = startOfMonth(new Date(dateRange))
    const dataFim = new Date(dateRange)

    const token = window.localStorage.getItem('jwt_access_token');

    if (JwtService.isAuthTokenValid(token)) {
        let config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: jwtServiceConfig.van24 + `?userId=${userId}`,
            headers: { "Authorization": `Bearer ${token}` },
            params: {
                dataInicio: dataInicio,
                dataFim: dataFim,
            }
        }
        try {
            const response = await api.request(config)
            dispatch(setList24(response.data))
        } catch (error) {
            console.error(error);
        } finally {
            dispatch(setLoadingPrevious(false))
        }
    }

}



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
