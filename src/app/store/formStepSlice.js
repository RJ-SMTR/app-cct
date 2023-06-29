import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    activeStep: 0,
    buttonType: 'button',
};

const stepSlice = createSlice({
    name: 'steps',
    initialState,
    reducers: {
        setActiveStep: (state, action) => {
            state.activeStep = action.payload;
        },
        setButtonType: (state, action) => {
            state.buttonType = action.payload;
        },
    },
});

export const { setActiveStep, setButtonType } = stepSlice.actions;
export default stepSlice.reducer;
