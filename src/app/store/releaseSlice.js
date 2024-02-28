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


