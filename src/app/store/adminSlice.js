import { createSlice } from '@reduxjs/toolkit';
import { api } from 'app/configs/api/api';

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
        api.get('/users?page=1', {
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
    return new Promise((resolve, reject) => {
        api.get('http://localhost:3001/api/settings', {
            headers: { 'Authorization': `Bearer ${token}`}
        })
            .then((response) => {
                dispatch(setSendEmailValue(response.data[0].value))
                resolve(response.data)
            })
            .catch((error) => {
                reject(error)
            })
    })
}
