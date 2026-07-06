import { createSlice } from '@reduxjs/toolkit';
import jwtServiceConfig from '../auth/services/jwtService/jwtServiceConfig';
import { api } from 'app/configs/api/api';
import accounting from 'accounting';
import { showMessage } from 'app/store/fuse/messageSlice';
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
    const hasConsorcioUserIdsArr = Array.isArray(data?.consorcioUserIds) && data.consorcioUserIds.length > 0;
    const hasNameArr = Array.isArray(data?.name) && data.name.length > 0;

    if (hasConsorcioArr && hasNameArr) {
        requestData.consorcioNames = data.consorcioName;
        if (hasConsorcioUserIdsArr) requestData.consorcioUserIds = data.consorcioUserIds;
        requestData.favorecidoIds = data.name;
    } else if (hasConsorcioArr) {
        requestData.consorcioNames = data.consorcioName;
        if (hasConsorcioUserIdsArr) requestData.consorcioUserIds = data.consorcioUserIds;
    } else if (hasNameArr) {
        requestData.favorecidoIds = data.name;
    } else {
        if (data?.tipoBeneficiario !== undefined) requestData.tipoBeneficiario = data.tipoBeneficiario;
        if (data?.beneficiarioUsuario !== undefined) requestData.beneficiarioUsuario = data.beneficiarioUsuario;
        if (data?.nomeConsorcio !== undefined) requestData.nomeConsorcio = data.nomeConsorcio;
    }

    const aprovacaoValue = data?.aprovacao;
    if (typeof aprovacaoValue === 'string') {
        requestData.aprovacao = aprovacaoValue.includes('Necessita');
    } else if (typeof aprovacaoValue === 'boolean') {
        requestData.aprovacao = aprovacaoValue;
    }

    const rawValor = data?.valorPagamentoUnico ?? data?.data?.valorPagamentoUnico;
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

    if (data?.tipoPagamento !== undefined) requestData.tipoPagamento = data.tipoPagamento;

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

    if (data?.diaSemana !== undefined) requestData.diaSemana = data.diaSemana;
    if (typeof data?.status === 'boolean') requestData.status = data.status;

  
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

        if (selectedDays.length > 0) {
            requestData.weekdays = selectedDays;
        }

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
    const consorcioNames = Array.isArray(base.consorcioNames) ? base.consorcioNames : [];
    const consorcioUserIds = Array.isArray(base.consorcioUserIds) ? base.consorcioUserIds : [];
    const favorecidoIds = Array.isArray(base.favorecidoIds) ? base.favorecidoIds : [];

    const apiRoute = jwtServiceConfig.agendamento;
    const token = window.localStorage.getItem('jwt_access_token');

    const entries = [];
    if (consorcioNames.length > 0) {
        consorcioNames.forEach((nomeConsorcio, index) => {
            entries.push({
                tipoBeneficiario: 'Consorcio',
                nomeConsorcio,
                beneficiarioUsuario: consorcioUserIds[index],
            });
        });
    }
    if (favorecidoIds.length > 0) {
        favorecidoIds.forEach((beneficiarioUsuario) => {
            entries.push({ tipoBeneficiario: 'Modal', beneficiarioUsuario });
        });
    }
    if (entries.length === 0) {
        entries.push({
            tipoBeneficiario: base.tipoBeneficiario,
            nomeConsorcio: base.nomeConsorcio,
            beneficiarioUsuario: base.beneficiarioUsuario,
        });
    }

    const createOne = (entry) => {
        const { consorcioNames, consorcioUserIds, favorecidoIds, ...rest } = base;
        const payload = {
            ...rest,
            tipoBeneficiario: entry.tipoBeneficiario,
            ...(entry.nomeConsorcio ? { nomeConsorcio: entry.nomeConsorcio } : {}),
            ...(entry.beneficiarioUsuario !== undefined ? { beneficiarioUsuario: entry.beneficiarioUsuario } : {}),
            ...(Array.isArray(consorcioNames) && consorcioNames.length > 0 ? { nomeConsorcios: consorcioNames } : {}),
            ...(Array.isArray(consorcioUserIds) && consorcioUserIds.length > 0 ? { consorcioUserIds } : {}),
        };
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
        if (entries.length <= 1) {
            const response = await createOne(entries[0]);
            if ([200, 201].includes(response.status)) {
                dispatch(getBookings());
            }
            return { ok: true, created: 1, results: [response.data] };
        }

        const settled = await Promise.allSettled(entries.map((entry) => createOne(entry)));
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
    const bookingId = data?.id;
    if (bookingId === undefined || bookingId === null) {
        throw new Error('ID do agendamento nao informado para edicao.');
    }
    const apiRoute = `${jwtServiceConfig.agendamento}${bookingId}`;
    const token = window.localStorage.getItem('jwt_access_token');

    // Partial update path used by toggle actions (Ativar/Desativar).
    // Avoid handleData defaults that would overwrite unrelated fields.
    const keys = Object.keys(data || {}).filter((k) => k !== 'id');
    const isStatusOnlyUpdate = keys.length === 1 && keys[0] === 'status';
    if (isStatusOnlyUpdate) {
        const response = await api({
            method: 'put',
            url: apiRoute,
            headers: { "Authorization": `Bearer ${token}` },
            data: { status: data.status },
        });

        if ([200, 201, 202, 204].includes(response.status)) {
            dispatch(getBookings());
        }
        return response;
    }

    const base = handleData(data);

    const { consorcioNames, consorcioUserIds, favorecidoIds, ...rest } = base;
    const payload = { ...rest };

    if (Array.isArray(consorcioNames) && consorcioNames.length > 0) {
        payload.tipoBeneficiario = 'Consorcio';
        payload.nomeConsorcio = consorcioNames[0];
        payload.nomeConsorcios = consorcioNames;
        if (Array.isArray(consorcioUserIds) && consorcioUserIds.length > 0) {
            payload.beneficiarioUsuario = consorcioUserIds[0];
            payload.consorcioUserIds = consorcioUserIds;
        }
    } else if (Array.isArray(favorecidoIds) && favorecidoIds.length > 0) {
        payload.tipoBeneficiario = 'Modal';
        payload.beneficiarioUsuario = favorecidoIds[0];
        delete payload.nomeConsorcio;
    }

    const config = {
        method: 'put',
        url: apiRoute,
        headers: { "Authorization": `Bearer ${token}` },
        data: payload
    };

    try {
        const response = await api(config);
        if ([200, 201, 202, 204].includes(response.status)) { 
            dispatch(getBookings());
        }
        return response;
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
