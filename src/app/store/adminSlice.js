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
    return new Promise((resolve, reject) => {
        api.get('/users?page=1&limit=4', {
            headers: { 'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6eyJpZCI6MSwibmFtZSI6IkFkbWluIn0sImlhdCI6MTY5MzQxMjAxMiwiZXhwIjoxNjkzNDk4NDEyfQ.RFrkswDPevsPRwbulgwPg0N75GKhYsKKiMCqjhhzJLE'}
        })
            .then((response) => {
                const filteredUsers = response.data.data.filter(user =>
                    user.permitCode != null && user.role.name != 'Admin'
                )
                dispatch(setUsersList(filteredUsers))
                resolve(response.data)
            })
            .catch((error) => {
                reject(error)
            })
    })
}
