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
    multipliedEntries: [],
    listByType: [],
    firstDate: []
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
    setFirstDate
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
function resumeDays(inputData, searchingDay) {
    const groupedData = {};

    inputData.forEach((item) => {
        const key = searchingDay ? item.transactionType : item.transactionDateTime.split('T')[0];

        if (!groupedData[key]) {
            groupedData[key] = [];
        }

        groupedData[key].push(item);
    });

    const result = Object.keys(groupedData).map((key) => {
        const group = groupedData[key];
        const totalTransactions = group.length

        if (searchingDay) {
            const multipliedAmount = group[0].transactionValue * totalTransactions;

            const allProperties = group.reduce((acc, item) => {
                return { ...acc, ...item };
            }, {});

            return {
                transactionType: key,
                multipliedAmount,
                transactions: totalTransactions,
                ...allProperties,
            };
        } else {
            const allProperties = group.reduce((acc, item) => {
                return { ...acc, ...item };
            }, {});

            return {
                date: key,
                multipliedAmount: group[0].transactionValue * totalTransactions,
                transactions: totalTransactions,
                ...allProperties,
            };
        }
    });

    return result;
}

function resumeTypes(inputData) {
    const groupedTransactions = {};
    inputData.forEach((obj) => {
        const transactionType = obj.transactionType;
        if (!groupedTransactions[transactionType]) {
            groupedTransactions[transactionType] = {
                transactionType,
                multipliedAmount: 0,
                transactions: 0,
            };
        }

        groupedTransactions[transactionType].multipliedAmount += obj.multipliedAmount;
        groupedTransactions[transactionType].transactions += obj.transactions;
    });

    return groupedTransactions
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
                if (searchingWeek || searchingDay) {
                    dispatch(setMapInfo(response.data));
                    const weekStatements = resumeDays(response.data, searchingDay);
                    if (searchingDay) {
                        weekStatements.sort((a, b) => {
                            const sortingOrder = ["full", "half", "free"];
                            return sortingOrder.indexOf(a.transactionType) - sortingOrder.indexOf(b.transactionType);
                        });
                    }
                    dispatch(setStatements(weekStatements));
                    const types = resumeTypes(weekStatements);
                    const order = ["full", "half", "free"]

                    const sortedTypes = {}
                    order.forEach((type) => {
                        if (types[type]) {
                            sortedTypes[type] = types[type]
                        }
                    });
                    dispatch(setListByType(sortedTypes));
                } else {
                    const first = response.data[0]?.date;
                    const last = response.data[response.data.length - 1]?.date;
                    dispatch(getFirstTypes([last, first]))
                    dispatch(setStatements(response.data));
                }

                resolve(response.data);
            })
            .catch((error) => {
                reject(error);
            });
    });
};

export const getFirstTypes = (firstDate) => (dispatch) => {
    const token = window.localStorage.getItem('jwt_access_token')
    return new Promise((resolve, reject) => {
        api.post(jwtServiceConfig.revenues, {
            startDate: firstDate[0],
            endDate: firstDate[1]
        }, {
            headers: { "Authorization": `Bearer ${token}` },
        }).then((response) => {
            const weekStatements = resumeDays(response.data, searchingDay)
            const types = resumeTypes(weekStatements)
            const order = ["full", "half", "free"]

            const sortedTypes = {}
            order.forEach((type) => {
                if (types[type]) {
                    sortedTypes[type] = types[type]
                }
            });
            dispatch(setListByType(sortedTypes))
        })
    })
}

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
    if (searchingDay) {
        const sum = statements.map((statement) => statement)
            .reduce((accumulator, currentValue) => accumulator + currentValue, 0);
        dispatch(setMultipliedEntries(sum));
    } else if (searchingWeek) {
        const sum = statements.map((statement) => statement.multipliedAmount)
            .reduce((accumulator, currentValue) => accumulator + currentValue, 0);
        dispatch(setMultipliedEntries(sum));
    } else {
        const sum = statements.map((statement) => statement.amount)
            .reduce((accumulator, currentValue) => accumulator + currentValue, 0);
        dispatch(setMultipliedEntries(sum));
    }


}
