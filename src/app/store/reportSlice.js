import { createSlice } from '@reduxjs/toolkit';
import jwtServiceConfig from '../auth/services/jwtService/jwtServiceConfig';
import { api } from 'app/configs/api/api';
import dayjs from 'dayjs';


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


function handleData(data) {
    let requestData = {};


    
    if (data.consorcioName && data.consorcioName.length > 0) {
        if(data.consorcioName == 'Todos') {

            requestData.exibirConsorcios = true

        } else {
            requestData.consorcioNome = data.consorcioName.join(',');
        }
    }

    if (data.dateRange && data.dateRange.length === 2) {
        requestData.dataInicio = dayjs(data.dateRange[0]).format('YYYY-MM-DD');
        requestData.dataFim = dayjs(data.dateRange[1]).format('YYYY-MM-DD');
    }

    
    if (data.name.length > 0 ) {
        if(data.favorecidoSearch == 'permitCode' || data.favorecidoSearch.length == 0){
            requestData.favorecidoNome = data.name.map(i => i.fullName).toString()
        } else {
            requestData.favorecidoCpfCnpj = data.name.map(i => i.cpfCnpj).toString()
        }

    } else {
        requestData.exibirFavorecidos = false

    }

    if (data.status && data.status.length > 0) {
        data.status.forEach(status => {
            if (status === 'A pagar') {
                requestData.aPagar = true;
            } else if (status === "Todos") {
                requestData.status = null
            }else {
                requestData[status.toLowerCase()] = true;
            }
        });
    }
    const addIfValid = (key, value) => {
        if (value !== null && value !== '') {
            requestData[key] = parseFloat(value).toFixed(2);
        }
    };


    addIfValid('valorMax', data.valorMax);
    addIfValid('valorMin', data.valorMin);

    return requestData;
}




export const handleReportInfo = (data, reportType) => async (dispatch) => {
    const requestData = handleData(data);

    const token = window.localStorage.getItem('jwt_access_token');
    const reportTypeUrl = reportType;

    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: jwtServiceConfig.report + `/${reportTypeUrl}`,
        headers: {
            "Authorization": `Bearer ${token}`
        },
        params: requestData
    };

    try {
        const response = await api.request(config);
        dispatch(setReportList(response.data));
    } catch (error) {
        console.error(error);
    }
};
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
