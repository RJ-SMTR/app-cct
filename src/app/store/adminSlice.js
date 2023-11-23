import { createSlice } from '@reduxjs/toolkit';
import { api } from 'app/configs/api/api';
import { setStatements } from './extractSlice';

const initialState = {
    userList: [],
    sendEmailValue: Boolean
};

const stepSlice = createSlice({
    name: 'admin',
    initialState,
    reducers: {
        setUsersList: (state, action) => {
            state.userList = action.payload;
        },
        setSendEmailValue: (state, action) => {
            state.sendEmailValue = action.payload;
        },
    },
});

export const { setUsersList, userList, sendEmailValue, setSendEmailValue } = stepSlice.actions;
export default stepSlice.reducer;

export const getUser = () => (dispatch) => {
    const token = window.localStorage.getItem('jwt_access_token');
    return new Promise((resolve, reject) => {
        api.get('/users', {
            headers: { 'Authorization': `Bearer ${token}`}
        })
            .then((response) => {
                const filteredUsers = response.data.data.filter(user =>
                    user.permitCode != null && user.role?.name != 'Admin' 
                )
                dispatch(setUsersList(filteredUsers))
                resolve(response.data)
            })
            .catch((error) => {
                reject(error)
            })
    })
}
export const getInfo = () => (dispatch) => {
    const token = window.localStorage.getItem('jwt_access_token');
    const currentHostname = window.location.hostname;
    const isProduction = currentHostname === 'cct.mobilidade.rio';

    const baseUrl = isProduction
        ? 'https://api.cct.mobilidade.rio/'
        : 'https://api.cct.hmg.mobilidade.rio/';
    return new Promise((resolve, reject) => {
        api.get(`${baseUrl}api/settings`, {
            headers: { 'Authorization': `Bearer ${token}`}
        })
            .then((response) => {
                const targetObject = response.data.find(item => item.name === "activate_auto_send_invite")
                dispatch(setSendEmailValue(targetObject))
                resolve(response.data)
            })
            .catch((error) => {
                reject(error)
            })
    })
}
export const getUserByInfo = (selectedQuery, query, inviteStatus) => (dispatch) => {
    const token = window.localStorage.getItem('jwt_access_token');
    const queryKey = selectedQuery === "fullName" ? 'name' : selectedQuery
    return new Promise((resolve, reject) => {
        const requestData = {
            [queryKey]: query,
            inviteStatus: inviteStatus
        };
        
        api.get('/users', {
            params: requestData,
            headers: { 'Authorization': `Bearer ${token}` },
        })
            .then((response) => {
                const filteredUsers = response.data.data.filter(user =>
                    user.permitCode != null && user.role?.name != 'Admin'
                )
                dispatch(setUsersList(filteredUsers))
                resolve(response)
            })
            .catch((error) => {
                reject(error)
            })
    })

}
function handleUserData(previousDays, dateRange, searchingDay, searchingWeek) {
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
export const getUserStatements = (userId) => (dispatch) => {
    const token = window.localStorage.getItem('jwt_access_token');
    return new Promise((resolve, reject) => {
        const apiRoute = `bank-statements/me?userId=${userId}&timeInterval=lastMonth`
        api.get(apiRoute, {
            headers: { "Authorization": `Bearer ${token}` },
        })
            .then((response) => {
                console.log(response.data)
               
                    dispatch(setStatements(response.data.data));
                resolve(response.data);
            })
            .catch((error) => {
                reject(error);
            });
    });
}
