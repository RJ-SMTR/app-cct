import { createSlice } from '@reduxjs/toolkit';
import jwtServiceConfig from '../auth/services/jwtService/jwtServiceConfig';
import { api } from 'app/configs/api/api';
import accounting from 'accounting';
import dayjs from 'dayjs';
import JwtService from '../auth/services/jwtService';


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
            requestData.consorcioNome = data.consorcioName.join(',');
    }

    if (data.dateRange && data.dateRange.length === 2) {
        requestData.dataInicio = dayjs(data.dateRange[0]).format('YYYY-MM-DD');
        requestData.dataFim = dayjs(data.dateRange[1]).format('YYYY-MM-DD');
    }

    
    if (data.name.length > 0 ) {
     
            requestData.favorecidoNome = data.name.map(i => i.fullName).toString()

    } 

    if (data.status && data.status.length > 0) {
        data.status.forEach(status => {
            if(status !== "Todos"){
                if (status === 'Pago') {
                    requestData.pago = true;
                } else if (status === 'Erro') {
                    requestData.pago = false
                } else {
                    requestData.aPagar = true
                }
            }
        });
    }
    const addIfValid = (key, value) => {
        if (value !== null && value !== '') {
            const unformattedValue = accounting.unformat(value.replace(/\./g, '').replace(',', '.'));
            requestData[key] = parseFloat(unformattedValue).toFixed(2);
        }
    };

    addIfValid('valorMax', data.valorMax);
    addIfValid('valorMin', data.valorMin);

    return requestData;
}




export const handleReportInfo = (data, reportType) => async (dispatch) => {
    const token = window.localStorage.getItem('jwt_access_token');
    console.log(data, reportType)

    if (JwtService.isAuthTokenValid(token)) {
        return new Promise(async (resolve, reject) => {
            const requestData = handleData(data);
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
                const responseData = response.data;
                
                    const mergedData = responseData.reduce((acc, curr) => {
                        return acc.concat(curr.data);
                    }, []);

                    const combinedResponse = {
                        count: mergedData.length,
                        data: mergedData,
                        valor: responseData.reduce((sum, curr) => sum + curr.valor, 0),
                        status: 'Todos'
                    };

                    dispatch(setReportList(combinedResponse));
                    resolve(combinedResponse);
             
            } catch (error) {
                console.error(error);
                reject(error);
            }
        });
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
