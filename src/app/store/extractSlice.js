import { createSlice } from '@reduxjs/toolkit';
import { api } from 'app/configs/api/api';
import { format, parseISO } from 'date-fns';
import accounting from 'accounting';
import jwtServiceConfig from '../auth/services/jwtService/jwtServiceConfig';

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
    valorAcumuladoLabel:'Valor Transação - Acumulado Mensal',
    valorPagoLabel:'Valor Pago - Acumulado Mensal',
  
    sumInfo: [],
    sumInfoWeek: [],
    pendingValue: [],
    pendingList: [],
    isLoading: false,
    isLoadingWeek: false,
    isLoadingPrevious: false,
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
        setSumInfoWeek: (state, action) => {
            state.sumInfoWeek = action.payload;
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
    sumInfoWeek,
    setSumInfoWeek,
    setPendingList,
    pendingList,
    setPendingValue,
    pendingValue,
    setLoading,
    setLoadingWeek,
    setLoadingPrevious,

} = extractSlice.actions;

export default extractSlice.reducer;
function handleRequestData(previousDays, dateRange, searchingDay, searchingWeek) {
    if (Array.isArray(dateRange) && !searchingDay && searchingWeek) {
        const endDate = format(new Date(dateRange[1]), 'yyyy-MM-dd');
        if (!searchingDay && !searchingWeek) {
            return {
                yearMonth: dateRange
            }
        }
        return {
            endDate
        };
    } 
    else if (!searchingDay && searchingWeek) {
        const endDate = dateRange
        return {
            endDate
        };
    }
    else if (searchingDay && searchingWeek) {
        return {
            startDate: dateRange[0],
            endDate: dateRange[1]
        };
    } else {
        return previousDays > 0 ? { timeInterval: previousDays } : { timeInterval: 'lastMonth', yearMonth: dateRange }
    }
}
export const  getPreviousDays = (dateRange, interval='lastWeek', userId) => async (dispatch) => {
    const token = window.localStorage.getItem('jwt_access_token');
   
    let config ={
        method: 'get',
        maxBodyLength: Infinity,
        url : userId ? jwtServiceConfig.bankStatement + `/previous-days?endDate=${dateRange}&timeInterval=${interval}&userId=${userId}` : jwtServiceConfig.bankStatement + `/previous-days?endDate=${dateRange}&timeInterval=${interval}`,
        headers: { "Authorization": `Bearer ${token}` },
    }
   try{
    dispatch(setLoadingPrevious(true))
    const response = await api.request(config)
       dispatch(setPendingValue(response.data.statusCounts))
       dispatch(setPendingList(response.data))
    }   catch (error) {
        console.error(error);
    } finally {
    dispatch(setLoadingPrevious(false))
}

}

export const getFirstTypes = (userId, dateRange, searchingWeek, searchingDay) => async (dispatch) => {

    const requestData = handleRequestData(null, dateRange, searchingDay, searchingWeek);

    const token = window.localStorage.getItem('jwt_access_token');

    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: userId ? jwtServiceConfig.revenues + `?userId=${userId}` : jwtServiceConfig.revenues,
        headers: {
            "Authorization": `Bearer ${token}`
        },
        params: {
            ...requestData
        }
    };

    try {
        dispatch(setLoadingWeek(true))
        const response = await api.request(config);
        const order = ["Integral", "Integração", "Gratuidade"];

        const sortedObject = Object.fromEntries(
            Object.entries(response.data.transactionTypeCounts)
                .sort(([keyA], [keyB]) => order.indexOf(keyA) - order.indexOf(keyB))
        );
        dispatch(setListByType(sortedObject));
    } catch (error) {
        console.error(error);
    } finally {
        dispatch(setLoadingWeek(false))
    }
};

export const getStatements = (previousDays, dateRange, searchingDay, searchingWeek, userId) => async (dispatch) => {
    const requestData = handleRequestData(previousDays, dateRange, searchingDay, searchingWeek);
    const todayDate = new Date()
    const formattedDate = format(todayDate, 'yyyy-MM-dd')
    let apiRoute = ''
    if(!userId){
        apiRoute = searchingWeek && searchingDay
            ? jwtServiceConfig.revenuesDay
            : searchingWeek 
                ? jwtServiceConfig.revenuesUn
                : jwtServiceConfig.bankStatement
    } else {
        apiRoute = searchingWeek && searchingDay ? jwtServiceConfig.revenuesDay + `?userId=${userId}` : searchingWeek  ? jwtServiceConfig.revenuesUn + `?userId=${userId}` : jwtServiceConfig.bankStatement + `?userId=${userId}`;
    }
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
            ...requestData,
        }
    };

    try {
        dispatch(setLoading(true))
        const response = await api(config);

        if (searchingWeek || searchingDay) {
            const interval = searchingDay ? 'lastDay' : 'lastWeek';
            dispatch(setStatements(response.data.data));
            dispatch(setSumInfoWeek(response.data))
            if(userId){
                if(!searchingDay ){
                    console.log(requestData.endDate)
                    dispatch(getFirstTypes(userId, requestData.endDate, searchingWeek, searchingDay));
                } else {
                    dispatch(getFirstTypes(userId, dateRange, searchingWeek, searchingDay));
                }
                dispatch(getPreviousDays(requestData.endDate, interval, userId))
            } else {
                dispatch(getFirstTypes(null, dateRange, searchingWeek, searchingDay));
                dispatch(getPreviousDays(requestData.endDate, interval))
            }

        } else {
            dispatch(setSumInfo(response.data))
            dispatch(setStatements(response.data.data));
        }

        return response.data;
    } catch (error) {
        throw error;
    } finally {
        dispatch(setLoading(false))
    }
};




export const getTodayStatements = () => async (dispatch) => {
    const token = window.localStorage.getItem('jwt_access_token');
    const today = new Date()
    const formattedDate = format(today, 'yyyy-MM-dd');


    const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: jwtServiceConfig.revenuesUn,
        headers: {
            "Authorization": `Bearer ${token}`
        },
        params: {
            startDate: formattedDate ,
            endDate: formattedDate, 
        }
    };

    try {
        const response = await api(config);

        dispatch(setTodayStatements(response.data.data));
        dispatch(setMapInfo(response.data.data));

        return response.data.data;
    } catch (error) {
        throw error;
    }
};

export const getMultipliedEntries = (statements, searchingDay, searchingWeek) => (dispatch) => {
    if (statements.length > 0) {
        if (searchingDay) {
            const sum = statements.map((statement) => statement)
                .reduce((accumulator, currentValue) => accumulator + currentValue, 0);
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
