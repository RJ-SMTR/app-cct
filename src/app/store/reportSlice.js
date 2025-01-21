import { createSlice } from '@reduxjs/toolkit';
import jwtServiceConfig from '../auth/services/jwtService/jwtServiceConfig';
import { api } from 'app/configs/api/api';
import accounting from 'accounting';
import dayjs from 'dayjs';
import JwtService from '../auth/services/jwtService';


const initialState = {
    synthData: [],
    reportType: '',
    reportList: [],
    totalSynth: '',
    specificValue: false,
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
        setTotalSynth: (state, action) => {
            state.totalSynth = action.payload;
        },
        setSpecificValue: (state,action) => {
            state.specificValue = action.payload;
        }
    },
});


export const { 
    synthData,
    setSynthData, 
    setReportType,
    reportList,
    setReportList,
    totalSynth,
    setTotalSynth,
    specificValue,
    setSpecificValue
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
        let hasPago = false;
        let hasErro = false;
        const statusSet = new Set(data.status);

        const hasAllStatuses = statusSet.has('Pago') && statusSet.has('Erro') && statusSet.has('Aguardando Pagamento');

        if (!hasAllStatuses) {
            data.status.forEach(status => {
                switch (status) {
                    case 'Pago':
                        hasPago = true;
                        break;
                    case 'Erro':
                        hasErro = true;
                        break;
                    case 'Aguardando Pagamento':
                        requestData.emProcessamento = true;
                        break;
                    case 'Todos':
                        break;
                    default:
                        requestData.aPagar = true;
                        break;
                }
            });

            if (hasPago && !hasErro) {
                requestData.pago = true;
            } else if (hasErro && !hasPago) {
                requestData.pago = false;
            }
        }
        if (data.eleicao) {
            requestData.eleicao = true
        }
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
    console.log(data)
    const token = window.localStorage.getItem('jwt_access_token');

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
                    if(reportType == 'sintetico'){
                        dispatch(handleSynthData(combinedResponse))
                    } else {

                        dispatch(setReportList(combinedResponse));
                    }
                    resolve(combinedResponse);
             
            } catch (error) {
                console.error(error);
                reject(error);
            }
        });
    }
};

export const handleSynthData = (reportData) => async (dispatch) => {
    const total = accounting.formatMoney(reportData.valor, {
        symbol: 'R$ ',
        decimal: ',',
        thousand: '.',
        precision: 2
    })
    dispatch(setTotalSynth(total))
    const groupedData = reportData.data.reduce((acc, item) => {
        const key = item.consorcio;
        if (!acc[key]) {
            acc[key] = { items: [], total: 0, totalsByStatus: {} };
        }


        acc[key].items.push(item);
        acc[key].total = item.subtotal;

        const status = item.status;
        if (!acc[key].totalsByStatus[status]) {
            acc[key].totalsByStatus[status] = 0;
        }
        acc[key].totalsByStatus[status] += item.valor;

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
