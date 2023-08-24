import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    searchingWeek: false,
    statements: [],
    mapInfo: [],
    previousDays: {},
    dateRange: [],
    searchingDay: false,
};

const extractSlice = createSlice({
    name: 'extract',
    initialState,
    reducers: {
        setSearchingWeek(state, action) {
            state.searchingWeek = action.payload;
        },
        setStatements(state, action) {
            state.statements = action.payload;
        },
        

    },
});

export const { setSearchingWeek, setStatements } = extractSlice.actions;
export default extractSlice.reducer;
