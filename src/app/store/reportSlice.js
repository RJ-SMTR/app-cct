import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    synthData: [],
    reportType: '',
};

const reportSlice = createSlice({
    name: 'report',
    initialState,
    reducers: {
        setSynthData: (state, action) => {
            state.synthData = action.payload;
        },
        setReportType: (state, action) => {
            state.reportType = action.payload;
        },
    },
});


export const { synthData,
    setSynthData, setReportType } = reportSlice.actions;

export default reportSlice.reducer;


export const handleSynthData = (reportData) => async (dispatch) => {
    const groupedData = reportData.reduce((acc, item) => {
        const key = item.consorcio;
        if (!acc[key]) {
            acc[key] = { items: [], total: 0, totalsByStatus: {} };
        }

        const unformattedValue = accounting.unformat(item.value.replace(/\./g, '').replace(',', '.'));

        acc[key].items.push(item);
        acc[key].total += unformattedValue;

        const status = item.status;
        if (!acc[key].totalsByStatus[status]) {
            acc[key].totalsByStatus[status] = 0;
        }
        acc[key].totalsByStatus[status] += unformattedValue;

        return acc;
    }, {});

    for (const key in groupedData) {
        groupedData[key].total = accounting.formatMoney(groupedData[key].total, {
            symbol: 'R$',
            decimal: ',',
            thousand: '.',
            precision: 2
        });

        for (const status in groupedData[key].totalsByStatus) {
            groupedData[key].totalsByStatus[status] = accounting.formatMoney(groupedData[key].totalsByStatus[status], {
                symbol: 'R$',
                decimal: ',',
                thousand: '.',
                precision: 2
            });
        }
    }

    dispatch(setSynthData(groupedData));

}
