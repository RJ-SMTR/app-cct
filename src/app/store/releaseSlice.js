import { createSlice } from '@reduxjs/toolkit';


const initialState = {
    selectedPeriod: false
};

const stepSlice = createSlice({
    name: 'release',
    initialState,
    reducers: {
        setSelectedPeriod: (state, action) => {
            state.selectedPeriod = action.payload;
        },
    },
});

export const { setSelectedPeriod, selectedPeriod} = stepSlice.actions;
export default stepSlice.reducer;

export const getData = (data) => (dispatch) => {
    const token = window.localStorage.getItem('jwt_access_token');
    api.get(jwtServiceConfig.bankStatement + `/previous-days?endDate=${dateRange}&timeInterval=lastMonth`, {
        headers: { "Authorization": `Bearer ${token}` },
    })
        .then((response) => {
            dispatch(setPendingValue(response.data.statusCounts))
            dispatch(setPendingList(response.data.data))
        })

}
