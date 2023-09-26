import { createSlice } from '@reduxjs/toolkit';
import { api } from 'app/configs/api/api';
import jwtServiceConfig from '../auth/services/jwtService/jwtServiceConfig';

const initialState = {
    searchingWeek: false,
    statements: [],
    mapInfo: [],
    previousDays: {},
    dateRange: [],
    searchingDay: false,
    fullReport: false,
    todayStatements: [],
    multipliedEntries: []
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
    setSearchingWeek,
    setStatements,
    setMapInfo,
    setPreviousDays,
    setDateRange,
    setSearchingDay,
    setFullReport,
    setTodayStatements,
    setMultipliedEntries
} = extractSlice.actions;

export default extractSlice.reducer;
function handleRequestData(previousDays, dateRange, searchingDay, searchingWeek) {
    if (dateRange?.length > 0 && !searchingDay) {
        const separateDate = dateRange.map((i) => {
            const inputDateString = i;
            const dateObj = new Date(inputDateString);
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, "0");
            const day = String(dateObj.getDate()).padStart(2, "0");
            const formattedDate = `${year}-${month}-${day}`;
            return formattedDate;
        });
        return {
            startDate: separateDate[0],
            endDate: separateDate[1]
        };
    } else if (searchingDay && searchingWeek) {
        return {
            startDate: dateRange[0],
            endDate: dateRange[1]
        };
    } else {
        return previousDays > 0 ? { previousDays: previousDays } : {}
    }
}
 function resumeDays(inputData) {
        const groupedData = {}

        inputData.forEach(item => {
            const date = item.dateTime.split('T')[0]
            if (!groupedData[date]) {
                groupedData[date] = []
            }
            groupedData[date].push(item)
        })

        const result = Object.keys(groupedData).map(date => {
            const group = groupedData[date]
            const totalTransactions = group.reduce((sum, item) => sum + item.transactions, 0)
            const multipliedAmount = group[0].amount * totalTransactions

            return {
                date,
                multipliedAmount,
                transactions: totalTransactions
            }
        })

        return result
    }

export const getStatements = (previousDays, dateRange, searchingDay, searchingWeek) => (dispatch) => {
    const requestData = handleRequestData(previousDays, dateRange, searchingDay, searchingWeek);

    const token = window.localStorage.getItem('jwt_access_token')

    return new Promise((resolve, reject) => {
        const apiRoute = searchingWeek ? jwtServiceConfig.revenues : jwtServiceConfig.bankStatement
        api.post(apiRoute, requestData, {
            headers: { "Authorization": `Bearer ${token}` },
        })
            .then((response) => {
                if (searchingWeek) {
                    if (searchingDay) {
                        dispatch(setStatements(response.data))
                        dispatch(setMapInfo(response.data))
                    } else {
                        const weekStatements = resumeDays(response.data)
                        dispatch(setStatements(weekStatements))
                    }
                } else {
                    dispatch(setStatements(response.data))
                }

                resolve(response.data)
            })
            .catch((error) => {
                reject(error)
            });
    });
};
export const getTodayStatements = () => (dispatch) => {

    const token = window.localStorage.getItem('jwt_access_token')
    return new Promise((resolve, reject) => {
        api.post(jwtServiceConfig.revenues, {
            previousDays: 1
        }, {
            headers: { "Authorization": `Bearer ${token}` },
        })
        .then((response) => {
            dispatch(setTodayStatements(response.data))
            dispatch(setMapInfo(response.data))
            resolve(response.data)
        })
            .catch((error) => {
                reject(error)
            });
    })
}
export const getMultipliedEntries = (statements, searchingDay, searchingWeek) => (dispatch) => {
        if(searchingDay){
            const sum = statements.map((statement) => statement)
                .reduce((accumulator, currentValue) => accumulator + currentValue, 0);
                dispatch(setMultipliedEntries(sum));
        } else if(searchingWeek) {
            const sum = statements.map((statement) => statement.multipliedAmount)
                .reduce((accumulator, currentValue) => accumulator + currentValue, 0);
            dispatch(setMultipliedEntries(sum));
        } else {
            const sum = statements.map((statement) => statement.amount)
                .reduce((accumulator, currentValue) => accumulator + currentValue, 0);
            dispatch(setMultipliedEntries(sum));
        }

   
}
