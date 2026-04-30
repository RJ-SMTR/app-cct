import { Controller, useForm } from 'react-hook-form';
import { Modal, Box, Typography, TextField, InputAdornment, MenuItem, Autocomplete, CircularProgress } from '@mui/material';
import { useDispatch } from 'react-redux';
import { editPayment, getBookings } from 'app/store/automationSlice';
import { showMessage } from 'app/store/fuse/messageSlice';
import { useState, useEffect } from 'react';
import { format, parse } from 'date-fns';
import { DatePicker } from 'rsuite';
import { NumericFormat } from 'react-number-format';

export const ModalEdit = ({ openEdit, handleCloseEdit, row, setOpenEdit }) => {
    const dispatch = useDispatch();
    const { handleSubmit, reset } = useForm();
    const [valor, setValor] = useState('');
    const [dataPagamento, setDataPagamento] = useState('');
    const [motivo, setMotivo] = useState('');
    const [horario, setHorario] = useState('');
    const [diaSemana, setDiaSemana] = useState('');
        const weekdayNameToNumber = (name) => {
            const map = {
                'Segunda-feira': 1,
                'Terça-feira': 2,
                'Quarta-feira': 3,
                'Quinta-feira': 4,
                'Sexta-feira': 5,
            };
            return map[name] || '';
        };

        const normalizeDiaSemana = (val) => {
            if (val === '' || val === null || val === undefined) return '';
            if (typeof val === 'number') return val;
            if (typeof val === 'string') {
                const num = Number(val);
                if (Number.isFinite(num)) return num;
                return weekdayNameToNumber(val);
            }
            return '';
        };
    const [tipoPagamento, setTipoPagamento] = useState('');
    const [intervaloDias, setIntervaloDias] = useState('');
    const [weekdays, setWeekdays] = useState([]);
    const [account, setAccount] = useState('');
    const [aprovacao, setAprovacao] = useState('');

    const parseCurrencyToNumber = (raw) => {
        if (raw === null || raw === undefined || raw === '') return null;
        if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;

        let s = String(raw).trim().replace(/\s/g, '');
        if (!s) return null;

        const hasDot = s.includes('.');
        const hasComma = s.includes(',');
        if (hasDot && hasComma) {
            if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
                s = s.replace(/\./g, '').replace(',', '.');
            } else {
                s = s.replace(/,/g, '');
            }
        } else if (hasComma) {
            s = s.replace(/\./g, '').replace(',', '.');
        } else {
            s = s.replace(/,/g, '');
        }

        const n = Number(s);
        return Number.isFinite(n) ? n : null;
    };

    const normalizeDataPagamento = (raw) => {
        if (raw === null || raw === undefined || raw === '') return '';

        if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
            return format(raw, 'dd/MM/yyyy');
        }

        if (typeof raw === 'string') {
            const trimmed = raw.trim();
            if (!trimmed) return '';

            if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
                return trimmed;
            }

            const isoDateMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
            if (isoDateMatch) {
                const [, y, m, d] = isoDateMatch;
                return `${d}/${m}/${y}`;
            }

            const parsed = new Date(trimmed);
            if (!Number.isNaN(parsed.getTime())) {
                return format(parsed, 'dd/MM/yyyy');
            }

            return trimmed;
        }

        return '';
    };

    const parseDataPagamentoToDate = (value) => {
        if (!value) return null;
        if (value instanceof Date && !Number.isNaN(value.getTime())) return value;

        if (typeof value === 'string') {
            const parsedPtBr = parse(value, 'dd/MM/yyyy', new Date());
            if (!Number.isNaN(parsedPtBr.getTime())) return parsedPtBr;

            const parsedGeneric = new Date(value);
            if (!Number.isNaN(parsedGeneric.getTime())) return parsedGeneric;
        }

        return null;
    };

    useEffect(() => {
        if (row) {
            const valorNormalizado = parseCurrencyToNumber(row?.valorPagamentoUnico);
            if (valorNormalizado !== null) {
                setValor(new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(valorNormalizado));
            } else {
                setValor(row?.valorPagamentoUnico ?? '');
            }
            setDataPagamento(normalizeDataPagamento(row?.dataPagamentoUnico));
            setMotivo(row?.motivoPagamentoUnico ?? '');
            setDiaSemana(normalizeDiaSemana(row?.diaSemana ?? ''));
            setTipoPagamento(row?.tipoPagamento ?? '');
            setIntervaloDias(row?.intervaloDias ?? '');
            setWeekdays(Array.isArray(row?.weekdays) ? row.weekdays : []);
            setAccount(row?.account ?? '');
            setAprovacao(row?.aprovacao === false ? 'Livre de Aprovação' : (row?.aprovacao ? 'Necessita Aprovação' : ''));

            const horarioRaw = row?.horario ?? '';
            if (!horarioRaw) {
                setHorario('');
            } else if (typeof horarioRaw === 'string') {
                const m = horarioRaw.match(/(\d{1,2}:\d{2}(?::\d{2})?)/);
                const normalized = m ? (m[0].length === 5 ? `${m[0]}:00` : m[0]) : horarioRaw;
                try {
                    const parsed = parse(normalized, 'HH:mm:ss', new Date());
                    setHorario(parsed);
                } catch (e) {
                    setHorario(horarioRaw);
                }
            } else if (horarioRaw instanceof Date) {
                setHorario(horarioRaw);
            } else {
                setHorario(horarioRaw);
            }
            reset();
        }
    }, [row, reset]);

    const valuePropsValor = {
        startAdornment: <InputAdornment position='start'>R$</InputAdornment>
    };

    const formatDataToISO = (value) => {
        if (!value) return null;
        // Already ISO yyyy-MM-dd
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
        // pt-BR dd/MM/yyyy
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
            const [d, m, y] = value.split('/');
            return `${y}-${m}-${d}`;
        }
        // Date object or other parseable string
        const dt = value instanceof Date ? value : new Date(value);
        if (!Number.isNaN(dt.getTime())) return format(dt, 'yyyy-MM-dd');
        return null;
    };

    const onSubmit = async () => {
        const resolvedAprovacao = aprovacao !== ''
            ? aprovacao.includes('Necessita')
            : (row?.aprovacao ?? false);

        const basePayload = {
            id: row?.id,
            tipoPagamento: tipoPagamento || row?.tipoPagamento || null,
            account: account || row?.account || null,
            aprovacao: resolvedAprovacao,
        };

        let horarioOut = horario;
        if (horario instanceof Date) {
            try {
                const hh = String(horario.getHours()).padStart(2, '0');
                const mm = String(horario.getMinutes()).padStart(2, '0');
                horarioOut = `${hh}:${mm}:00`;
            } catch {
                horarioOut = horario;
            }
        }

        let payload = { ...basePayload };

        if ((tipoPagamento || row?.tipoPagamento) === 'Único') {
            payload = {
                ...payload,
                valorPagamentoUnico: parseCurrencyToNumber(valor),
                dataPagamentoUnico: formatDataToISO(dataPagamento),
                motivoPagamentoUnico: motivo || null,
                horario: horarioOut || null,
                diaSemana: typeof diaSemana === 'number' ? diaSemana : normalizeDiaSemana(diaSemana) || null,
            };
        } else if ((tipoPagamento || row?.tipoPagamento) === 'Recorrente') {
            payload = {
                ...payload,
                intervaloDias: intervaloDias || null,
                weekdays: weekdays || [],
                horario: horarioOut || null,
                diaSemana: typeof diaSemana === 'number' ? diaSemana : normalizeDiaSemana(diaSemana) || null,
            };
        } else {
            payload = {
                ...payload,
                valorPagamentoUnico: parseCurrencyToNumber(valor),
                dataPagamentoUnico: formatDataToISO(dataPagamento),
                motivoPagamentoUnico: motivo || null,
                intervaloDias: intervaloDias || null,
                weekdays: weekdays || [],
                horario: horarioOut || null,
                diaSemana: typeof diaSemana === 'number' ? diaSemana : normalizeDiaSemana(diaSemana) || null,
            };
        }

        try {
            const response = await dispatch(editPayment(payload));
            if (response?.status >= 200 && response?.status < 300) {
                dispatch(showMessage({ message: 'Editado com sucesso!' }));
                dispatch(getBookings());
                setOpenEdit(false);
            }
        } catch (err) {
            console.error(err);
            dispatch(showMessage({ message: 'Erro ao editar' }));
        }
    };

    return (
        <Modal open={openEdit} onClose={handleCloseEdit} aria-labelledby="modal-edit-title">
            <Box
                component="form"
                onSubmit={handleSubmit(onSubmit)}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50rem] max-w-[90%] bg-white rounded-lg shadow-xl p-8 space-y-6"
            >
                <div className="flex justify-between items-center border-b pb-3">
                    <h2 className="font-semibold text-xl">Editar Pagamento</h2>
                    <button type="button" onClick={handleCloseEdit} className="text-gray-500 hover:text-gray-700">✕</button>
                </div>

                <div className="space-y-4 text-gray-700">
                    <div className="flex gap-2">
                        <span className="font-semibold">ID:</span>
                        <span>{row?.id}</span>
                    </div>
                    <div className="flex gap-2">
                        <span className="font-semibold">Beneficiário:</span>
                        <span>{row?.beneficiarioUsuario?.fullName}</span>
                    </div>
                    <div className="flex gap-2">
                        <span className="font-semibold">Valor atual:</span>
                        <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row?.valorPagamentoUnico)}</span>
                    </div>
                </div>

                <div>
                    <p className="font-semibold my-2">Tipo Pagamento:</p>
                    <Autocomplete
                        value={tipoPagamento ? { label: tipoPagamento } : null}
                        onChange={(_, v) => setTipoPagamento(v?.label ?? '')}
                        getOptionLabel={(option) => option.label}
                        options={[{ label: 'Recorrente' }, { label: 'Único' }]}
                        renderInput={(params) => (
                            <TextField {...params} label="Tipo Pagamento" variant="outlined" />
                        )}
                    />
                </div>

                {(tipoPagamento || row?.tipoPagamento) === 'Único' && (
                    <>
                        <div>
                            <p className="font-semibold my-2">Valor:</p>
                            <NumericFormat
                                thousandSeparator='.'
                                decimalSeparator=','
                                fixedDecimalScale
                                decimalScale={2}
                                customInput={TextField}
                                InputProps={valuePropsValor}
                                value={valor}
                                onValueChange={(vals) => setValor(vals.formattedValue)}
                            />
                        </div>
                        <div>
                            <p className="font-semibold my-2">Data Pagamento (dd/mm/aaaa):</p>
                            <DatePicker
                                value={parseDataPagamentoToDate(dataPagamento)}
                                onChange={(val) => setDataPagamento(val ? format(val, 'dd/MM/yyyy') : '')}
                                showOneCalendar
                                placement="auto"
                                placeholder="Selecionar Data"
                                format="dd/MM/yyyy"
                                character=" - "
                                className="custom-date-range-picker w-full"
                            />
                        </div>
                        <div>
                            <p className="font-semibold my-2">Motivo:</p>
                            <TextField value={motivo} onChange={(e) => setMotivo(e.target.value)} className="w-full" />
                        </div>
                        <div>
                            <p className="font-semibold my-2">Horário (HH:mm):</p>
                            <DatePicker
                                value={horario}
                                onChange={(val) => setHorario(val)}
                                showOneCalendar
                                showHeader={false}
                                placement="auto"
                                placeholder="Selecionar Horário"
                                format="HH:mm"
                                character=" - "
                                className="custom-date-range-picker w-full"
                            />
                        </div>
                        <div>
                            <p className="font-semibold my-2">Dia da semana:</p>
                            <TextField
                                select
                                value={diaSemana}
                                onChange={(e) => setDiaSemana(Number(e.target.value) || '')}
                                className="w-full"
                            >
                                <MenuItem value="">Nenhum</MenuItem>
                                <MenuItem value={1}>Segunda-feira</MenuItem>
                                <MenuItem value={2}>Terça-feira</MenuItem>
                                <MenuItem value={3}>Quarta-feira</MenuItem>
                                <MenuItem value={4}>Quinta-feira</MenuItem>
                                <MenuItem value={5}>Sexta-feira</MenuItem>
                                <MenuItem value={6}>Sábado</MenuItem>
                                <MenuItem value={7}>Domingo</MenuItem>
                            </TextField>
                        </div>
                    </>
                )}

                {(tipoPagamento || row?.tipoPagamento) === 'Recorrente' && (
                    <>
                        <div>
                            <p className="font-semibold my-2">Pagar a cada (dias):</p>
                            <NumericFormat
                                value={intervaloDias}
                                onValueChange={(vals) => setIntervaloDias(vals.value)}
                                customInput={TextField}
                                InputProps={{ endAdornment: <InputAdornment position='end'>Dias</InputAdornment> }}
                            />
                        </div>
                        <div>
                            <p className="font-semibold my-2">Agendado para (Dia da semana):</p>
                            <TextField
                                select
                                value={diaSemana}
                                onChange={(e) => setDiaSemana(Number(e.target.value) || '')}
                                className="w-full"
                            >
                                <MenuItem value="">Nenhum</MenuItem>
                                <MenuItem value={1}>Segunda-feira</MenuItem>
                                <MenuItem value={2}>Terça-feira</MenuItem>
                                <MenuItem value={3}>Quarta-feira</MenuItem>
                                <MenuItem value={4}>Quinta-feira</MenuItem>
                                <MenuItem value={5}>Sexta-feira</MenuItem>
                                <MenuItem value={6}>Sábado</MenuItem>
                                <MenuItem value={7}>Domingo</MenuItem>
                            </TextField>
                        </div>
                        <div>
                            <p className="font-semibold my-2">Dias a serem pagos:</p>
                            <Box display="flex" gap={1}>
                                {[{ label: 'Dom', value: 'sun' },{ label: 'Seg', value: 'mon' },{ label: 'Ter', value: 'tue' },{ label: 'Qua', value: 'wed' },{ label: 'Qui', value: 'thu' },{ label: 'Sex', value: 'fri' },{ label: 'Sab', value: 'sat' }].map((day) => {
                                    const isSelected = weekdays.includes(day.value);
                                    return (
                                        <Box
                                            key={day.value}
                                            onClick={() => {
                                                const newValue = isSelected ? weekdays.filter((v) => v !== day.value) : [...weekdays, day.value];
                                                setWeekdays(newValue);
                                            }}
                                            sx={{
                                                borderRadius: '6px',
                                                backgroundColor: isSelected ? '#2AD705' : '#ddd',
                                                color: isSelected ? '#fff' : '#000',
                                                height: 40,
                                                width: 40,
                                                lineHeight: '40px',
                                                textAlign: 'center',
                                                cursor: 'pointer',
                                                userSelect: 'none',
                                            }}
                                        >
                                            {day.label}
                                        </Box>
                                    );
                                })}
                            </Box>
                        </div>
                        <div>
                            <p className="font-semibold my-2">Horário (HH:mm):</p>
                            <DatePicker
                                value={horario}
                                onChange={(val) => setHorario(val)}
                                showOneCalendar
                                showHeader={false}
                                placement='auto'
                                placeholder='Selecionar Horário'
                                format='HH:mm'
                                character=' - '
                                className='custom-date-range-picker w-full'
                            />
                        </div>
                    </>
                )}

                <button type="submit" className="w-full py-3 mt-4 bg-[#0DB1E3] hover:bg-[#0CA0CC] text-white font-medium uppercase rounded">Salvar</button>
            </Box>
        </Modal>
    );
};
