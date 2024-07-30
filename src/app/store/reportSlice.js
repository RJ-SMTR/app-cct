import { createSlice } from '@reduxjs/toolkit';
import jwtServiceConfig from '../auth/services/jwtService/jwtServiceConfig';
import { api } from 'app/configs/api/api';

const initialState = {
    synthData: [],
    reportType: '',
    reportList: []
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
        setReportList: (state, action) => {
            state.reportList = action.payload;
        },
    },
});


export const { 
    synthData,
    setSynthData, 
    setReportType,
    reportList,
    setReportList
 } = reportSlice.actions;

export default reportSlice.reducer;

export const handleReportInfo = (data, reportType) => async (dispatch) => {
    console.log(data, reportType)
    const token = window.localStorage.getItem('jwt_access_token');

    const reportTypeUrl = reportType

    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: jwtServiceConfig.report + `/${reportTypeUrl}`,
        headers: {
            "Authorization": `Bearer ${token}`
        },
        params: {
           data
        }
    };

    try {
        const response = await api.request(config);
        
        dispatch(setReportList(response.data.data));
    } catch (error) {
        console.error(error);
    } 
}
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
