import { createSlice } from '@reduxjs/toolkit';
import { api } from 'app/configs/api/api';

const initialState = {
    userList: [],
};

const stepSlice = createSlice({
    name: 'admin',
    initialState,
    reducers: {
        setUsersList: (state, action) => {
            state.userList = action.payload;
        },
    },
});

export const { setUsersList, userList } = stepSlice.actions;
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
