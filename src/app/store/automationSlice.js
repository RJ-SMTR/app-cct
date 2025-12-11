import { createSlice } from '@reduxjs/toolkit';
import jwtServiceConfig from '../auth/services/jwtService/jwtServiceConfig';
import { api } from 'app/configs/api/api';
import accounting from 'accounting';

function parseCurrency(raw) {
    if (raw === null || raw === undefined) return null;
    if (typeof raw === 'number') return Number(Number(raw).toFixed(2));
    let s = String(raw).trim();
    if (s === '') return null;

    s = s.replace(/\s/g, '');
    const hasDot = s.indexOf('.') !== -1;
    const hasComma = s.indexOf(',') !== -1;
    let normalized;
    if (hasDot && hasComma) {
        if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
            normalized = s.replace(/\./g, '').replace(',', '.');
        } else {
            normalized = s.replace(/,/g, '');
        }
    } else if (hasComma) {
        normalized = s.replace(/\./g, '').replace(',', '.');
    } else {
        normalized = s.replace(/,/g, '');
    }
    const num = Number(normalized);
    return Number.isFinite(num) ? Number(num.toFixed(2)) : null;
}


const initialState = {
    bookings: [],
    approval: [],
};

const automationSlice = createSlice({
    name: 'automation',
    initialState,
    reducers: {
        setBookings: (state, action) => {
            state.bookings = action.payload;
        },
        setApproval: (state, action) => {
            state.approval = action.payload;
        },

    }
});

export const {
    bookings,setBookings,
    approval,setApproval,
} = automationSlice.actions;

export default automationSlice.reducer;

function handleData(data) {
    // eslint-disable-next-line no-console
    const requestData = {};

    const hasConsorcioArr = Array.isArray(data?.consorcioName) && data.consorcioName.length > 0;
    const hasNameArr = Array.isArray(data?.name) && data.name.length > 0;

    if (hasConsorcioArr && hasNameArr) {
        // Preserve sources to classify per ID later
        requestData.consorcioIds = data.consorcioName;
        requestData.favorecidoIds = data.name;
        requestData.beneficiarioUsuario = [...data.consorcioName, ...data.name];
        requestData.tipoBeneficiario = null;
    } else if (hasConsorcioArr) {
        requestData.tipoBeneficiario = 'Consorcio';
        requestData.beneficiarioUsuario = data.consorcioName;
    } else if (hasNameArr) {
        requestData.tipoBeneficiario = 'Modal';
        requestData.beneficiarioUsuario = data.name;
    } else {
        requestData.tipoBeneficiario = data?.tipoBeneficiario ?? null;
        requestData.beneficiarioUsuario = data?.beneficiarioUsuario ?? null;
    }

    const aprovacaoValue = data?.aprovacao;
    if (typeof aprovacaoValue === 'string') {
        requestData.aprovacao = aprovacaoValue.includes('Necessita');
    } else if (typeof aprovacaoValue === 'boolean') {
        requestData.aprovacao = aprovacaoValue;
    } else {
        requestData.aprovacao = false;
    }

    const rawValor = data?.valorPagamentoUnico ?? data?.dataPagamentoUnico ?? data?.data?.valorPagamentoUnico;
    if (rawValor !== undefined && rawValor !== null && rawValor !== '') {
        const parsed = parseCurrency(rawValor);
        if (parsed !== null) {
            requestData.valorPagamentoUnico = parsed;
        } else {
            requestData.valorPagamentoUnico = rawValor;
        }
    }

    if (data?.dataPagamentoUnico) requestData.dataPagamentoUnico = data.dataPagamentoUnico;
    if (data?.motivoPagamentoUnico) requestData.motivoPagamentoUnico = data.motivoPagamentoUnico;

    requestData.tipoPagamento = data?.tipoPagamento ?? null;

    const horarioRaw = data?.horario;
    if (horarioRaw) {
        if (typeof horarioRaw === 'string') {
            const m = horarioRaw.match(/(\d{1,2}:\d{2}(?::\d{2})?)/);
            requestData.horario = m ? m[1] : horarioRaw;
        } else if (horarioRaw instanceof Date || typeof horarioRaw?.toTimeString === 'function') {
            try {
                requestData.horario = horarioRaw.toTimeString().split(' ')[0];
            } catch (e) {
                requestData.horario = String(horarioRaw);
            }
        } else {
            requestData.horario = String(horarioRaw);
        }
    }

    requestData.diaSemana = data?.diaSemana ?? null;
    requestData.status = false;

  
        const dayNameToNum = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
        const normalizeWeekdays = (arr) => {
            if (!Array.isArray(arr)) return [];
            const out = arr
                .map((v) => {
                    if (typeof v === 'number') return v;
                    if (typeof v === 'string') {
                        const trimmed = v.trim().toLowerCase();
                        if (trimmed in dayNameToNum) return dayNameToNum[trimmed];
                        const n = Number(trimmed);
                        return Number.isFinite(n) ? n : null;
                    }
                    return null;
                })
                .filter((v) => v !== null)
                .map((v) => ((v % 7) + 7) % 7); // ensure 0..6
            return Array.from(new Set(out)).sort((a, b) => a - b);
        };

        const normalizeDiaSemanaToJS = (val) => {
            if (val === undefined || val === null || val === '') return null;
            if (typeof val === 'number') {
                // If ISO 1..7 (Mon..Sun), convert to JS 0..6 (Sun..Sat)
                if (val >= 1 && val <= 7) return val % 7; // 7->0
                // If already 0..6, pass through
                if (val >= 0 && val <= 6) return val;
                return null;
            }
            if (typeof val === 'string') {
                const n = Number(val);
                if (Number.isFinite(n)) return normalizeDiaSemanaToJS(n);
                return null;
            }
            return null;
        };

        const selectedDays = normalizeWeekdays(data?.weekdays);
        console.log(selectedDays)
        const anchorJS = normalizeDiaSemanaToJS(data?.diaSemana);
    console.log(anchorJS)

        if (selectedDays.length > 0 && anchorJS !== null) {
            const next = (() => {
                for (let i = 0; i < selectedDays.length; i++) {
                    if (selectedDays[i] > anchorJS) return selectedDays[i];
                }
                return selectedDays[0];
            })();

            const prev = (() => {
                for (let i = selectedDays.length - 1; i >= 0; i--) {
                    if (selectedDays[i] < anchorJS) return selectedDays[i];
                }
                return selectedDays[selectedDays.length - 1];
            })();
            console.log(next)
            console.log(prev)

            // Backend expects 'diaInicioPagar' and 'diaFinalPagar'
            requestData.diaInicioPagar = next;
            requestData.diaFinalPagar = prev;

            // If an interval (days between payments) is provided, normalize to number
            const intervaloRaw = data?.intervaloDias ?? data?.diaIntervalo;
            if (intervaloRaw !== undefined && intervaloRaw !== null && intervaloRaw !== '') {
                const n = Number(intervaloRaw);
                if (Number.isFinite(n)) {
                    requestData.diaIntervalo = n;
                }
            }
        }

    // eslint-disable-next-line no-console
    return requestData;
}

export const bookPayment = (data) => async (dispatch) => {

    const base = handleData(data);

    // Build membership sets from preserved arrays
    const consorcioSet = new Set(Array.isArray(base.consorcioIds) ? base.consorcioIds.map((x) => Number(x)) : []);
    const favorecidoSet = new Set(Array.isArray(base.favorecidoIds) ? base.favorecidoIds.map((x) => Number(x)) : []);

    const allIds = Array.isArray(base.beneficiarioUsuario)
        ? base.beneficiarioUsuario
        : (base.beneficiarioUsuario !== undefined && base.beneficiarioUsuario !== null
            ? [base.beneficiarioUsuario]
            : []);

    const apiRoute = jwtServiceConfig.agendamento;
    const token = window.localStorage.getItem('jwt_access_token');

    const createOne = (id) => {
        const numericId = Number(id);
        // Favor favorecido -> Modal; consorcio -> Consorcio
        let computedTipo = 'Consorcio';
        if (favorecidoSet.has(numericId)) computedTipo = 'Modal';
        else if (consorcioSet.has(numericId)) computedTipo = 'Consorcio';
        const tipoBeneficiario = base.tipoBeneficiario ?? computedTipo;
        const { consorcioIds, favorecidoIds, ...rest } = base;
        const payload = { ...rest, beneficiarioUsuario: id, tipoBeneficiario };
        console.log(payload)
        return api({
            method: 'post',
            maxBodyLength: Infinity,
            url: apiRoute,
            headers: { "Authorization": `Bearer ${token}` },
            data: payload,
        });
    };

    try {
        if (allIds.length <= 1) {
            const id = allIds[0] ?? base.beneficiarioUsuario;
            const response = await createOne(id);
            if ([200, 201].includes(response.status)) {
                dispatch(getBookings());
            }
            return { ok: true, created: 1, results: [response.data] };
        }

        const settled = await Promise.allSettled(allIds.map((id) => createOne(id)));
        const successes = settled.filter((r) => r.status === 'fulfilled');
        const failures = settled.filter((r) => r.status === 'rejected');
        if (successes.length > 0) {
            dispatch(getBookings());
        }
        return {
            ok: failures.length === 0,
            created: successes.length,
            failed: failures.length,
            results: settled,
        };
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export const editPayment = (data) => async (dispatch) => {
    console.log(data)
    const apiRoute = `${jwtServiceConfig.agendamento}${data.id}`; 
        const consorcioSet = new Set(Array.isArray(base.consorcioIds) ? base.consorcioIds.map((x) => Number(x)) : []);
        const favorecidoSet = new Set(Array.isArray(base.favorecidoIds) ? base.favorecidoIds.map((x) => Number(x)) : []);

    const config = {
        method: 'put',
        url: apiRoute,
        headers: { "Authorization": `Bearer ${token}` },
        data
    };

    try {
        const response = await api(config);
        if ([200, 201, 202, 204].includes(response.status)) { 
            const numericId = Number(id);
            let computedTipo = 'Consorcio';
            if (favorecidoSet.has(numericId)) computedTipo = 'Modal';
            else if (consorcioSet.has(numericId)) computedTipo = 'Consorcio';
        }
            const { consorcioIds, favorecidoIds, ...rest } = base;
            const payload = { ...rest, beneficiarioUsuario: id, tipoBeneficiario };
    } catch (error) {
        console.error(error);
        throw error;
    }
};



export const getBookings = (data) => async (dispatch) => {

    
    let apiRoute = jwtServiceConfig.agendamento
    const method = 'get';
    const token = window.localStorage.getItem('jwt_access_token');

    const config = {
        method: method,
        maxBodyLength: Infinity,
        url: apiRoute,
        headers: {
            "Authorization": `Bearer ${token}`
        },
        params: {
            id: data
        }
    };

    try{
        const response = await api.request(config)
        dispatch(setBookings(response.data))
        


    }catch{}

}
export const getApproval = (data) => async (dispatch) => {

    
    let apiRoute = jwtServiceConfig.aprovacao
    const method = 'get';
    const token = window.localStorage.getItem('jwt_access_token');

    const config = {
        method: method,
        maxBodyLength: Infinity,
        url: apiRoute,
        headers: {
            "Authorization": `Bearer ${token}`
        },
        params: {
            id: data
        }
    };

    try{
        const response = await api.request(config)
        dispatch(setApproval(response.data))
        


    }catch{}

}



    export const deleteBooking = (id, password) => async (dispatch) => {
        const token = window.localStorage.getItem('jwt_access_token');
        return new Promise((resolve, reject) => {
            api.delete(
                `${jwtServiceConfig.agendamento}${id}`,
                {
                    headers: { "Authorization": `Bearer ${token}`},
                    data: { password: password }
                }
            )
                .then((response) => {
                 
                    resolve(response);
                })
                .catch((error) => {
                    reject(error);
                });
        });

    }
export const approveBooking = (id, password, valorAprovado) => async (dispatch) => {
    const token = window.localStorage.getItem('jwt_access_token');

    let rawValor = valorAprovado
        if (rawValor !== undefined && rawValor !== null && rawValor !== '') {
                const parsed = parseCurrency(rawValor);
                rawValor = parsed !== null ? parsed : rawValor;
        }
     
    return new Promise((resolve, reject) => {
        api.put(
            `${jwtServiceConfig.aprovacao}aprovar/${id}`,
            { password: password,
                valorAprovado: rawValor
             }, 
            {
                headers: {
                    "Authorization": `Bearer ${token}` 
                }
            }
        )
            .then((response) => {
                resolve(response);
            })
            .catch((error) => {
                reject(error);
            });
    });
};
