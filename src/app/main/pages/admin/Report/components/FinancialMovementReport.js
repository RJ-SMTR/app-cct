import React, { useEffect, useState } from "react";
import {
  Box,
  MenuItem,
  Table,
  TableHead,
  TableBody,
  Autocomplete,
  TextField,
  Button,
  TableRow,
  TableCell,
  Paper,
  CircularProgress,
  Menu,
  TableFooter,
  TableContainer,
  TablePagination,
  Grid,
} from "@mui/material";
import SaveAltIcon from "@mui/icons-material/SaveAlt";
import { format } from "date-fns";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";

import {
  handleFinancialMovementExport,
  handleFinancialMovementPage,
  handleAgentFinancialMovementExport,
  handleAgentFinancialMovementPage,
  handleAgentFinancialMovementSummary,
  setReportList,
} from "app/store/reportSlice";
import { showMessage } from "app/store/fuse/messageSlice";
import {
  getAgentEffectivePaymentDateLabel,
  getAssociationDisplayName,
  isKnownAssociationName,
  normalizeSelectAllAutocompleteValue,
  shouldShowAgentEffectivePaymentDateColumn,
  shouldShowAgentNameFilter,
  shouldShowAssociationFilter,
} from "app/store/agentConsolidatedReportUtils";
import { normalizeErroStatusSelection } from "./reportUtils";
import { buildReportConsorcioOptions } from "./consorcioOptions";
import ValorRangeFilter from "./shared/ValorRangeFilter";
import ReportPeriodFilter from "./shared/ReportPeriodFilter";
import useFavorecidoGuardadorOptions from "./shared/useFavorecidoGuardadorOptions";
import { applyPendenciaDePagamentoErro, applyEspecificosFlags } from "./shared/reportRequestUtils";
import {
  STATUS_OPTIONS,
  ERRO_STATUS_OPTIONS,
  MIN_SELECTABLE_DATE_GUARDADOR,
  MIN_SELECTABLE_DATE_PERMISSIONARIO,
} from "./shared/reportFilterOptions";

const CNPJS_CONSORCIO = [
  '12464539000180',
  '12464869000176',
  '12464577000133',
  '44520687000161',
  '18201378000119',
  '12464553000184',
];

/**
 * Relatório de Movimentação Financeira — Permissionário e Guardador compartilhavam
 * praticamente as mesmas telas/colunas/regras (FinancialMovement.js + AgentsFinancialMovement.js
 * antes desta unificação), com diferenças pontuais: quais filtros aparecem (Favorecido+Consórcio
 * vs Guardador+Associação), quais actions do reportSlice são chamadas, mascaramento de banco/email
 * pra CNPJs de consórcio (só no permissionário) e os totais mostrados no rodapé (o backend do
 * guardador retorna campos extras como valorAPagar/valorPendenciaPaga). Tudo isso fica atrás do
 * prop `perfil`.
 */
export default function FinancialMovementReport({ perfil }) {
  const isGuardador = perfil === 'guardador';

  const reportList = useSelector((state) => state.report.reportList);

  const [isLoading, setIsLoading] = useState(false);
  const { loadingUsers, userOptions, agentOptions, associationOptions } = useFavorecidoGuardadorOptions(isGuardador, {
    loadErrorMessage: "Não foi possível carregar os guardadores e associações.",
  });
  const [selectedAgentOptions, setSelectedAgentOptions] = useState([]);
  const [selectedAssociationOptions, setSelectedAssociationOptions] = useState([]);
  const [selectedStatusOptions, setSelectedStatusOptions] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [whichStatusShow, setWhichStatus] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showErroStatus, setShowErroStatus] = useState(false);
  const [selectedErroStatus, setSelectedErroStatus] = useState([]);
  const [selectedConsorcios, setSelectedConsorcios] = useState([]);
  const [selectedFavorecidos, setSelectedFavorecidos] = useState([]);
  const [isExporting, setIsExporting] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [hasSearched, setHasSearched] = useState(false);
  const [pageCursors, setPageCursors] = useState([null]);
  const [selectedEspecificos, setSelectedEspecificos] = useState([]);
  const hasNextPage = Boolean(pageCursors[page + 1]);
  const showEffectivePaymentDate = shouldShowAgentEffectivePaymentDateColumn(whichStatusShow);
  // STUC - Gratuidade (ADR 0012, api-cct): cada linha passa a representar uma janela de
  // pagamento (até 4 dias), com 8 colunas extras (Dt Ord. Pg1..4 + Valor). Só Permissionário.
  const showStucColumns = !isGuardador && selectedEspecificos.includes('STUC - Gratuidade');

  const statusBase = STATUS_OPTIONS.filter((option) => option.label !== "Todos");
  const erroStatus = ERRO_STATUS_OPTIONS;
  const consorcios = buildReportConsorcioOptions({ selectedField: selected });
  const especificos = [{ label: 'Eleição' }, { label: 'Desativados' }, { label: 'STUC - Gratuidade' }];

  const dispatch = useDispatch();

  const defaultValues = isGuardador
    ? { agentNames: [], associations: [], dateRange: [], valorMax: "", valorMin: "", status: [], erroStatus: [] }
    : { name: [], dateRange: [], valorMax: "", valorMin: "", consorcioName: [], especificos: [], status: [], erroStatus: [] };

  const { handleSubmit, setValue, control, getValues, trigger, clearErrors, reset } = useForm({ defaultValues });

  // Guardador e Permissionário têm datas mínimas diferentes: ao trocar o perfil, a data
  // selecionada no filtro de período (de/até) é limpa para evitar um intervalo inválido.
  useEffect(() => {
    setValue("dateRange", []);
  }, [perfil, setValue]);

  const hasMissingErroStatusSelection =
    whichStatusShow.includes("Pendência de Pagamento") && selectedErroStatus.length === 0;

  // Permissionário: pesquisar sem status não é permitido (o guardador continua opcional).
  const hasMissingStatusSelection = !isGuardador && whichStatusShow.length === 0;

  const validateStatusSelection = () => {
    if (!hasMissingStatusSelection) return true;
    dispatch(showMessage({ message: "Selecione um status para pesquisar." }));
    return false;
  };

  const validateErroStatusSelection = () => {
    if (!hasMissingErroStatusSelection) return true;
    dispatch(showMessage({ message: "Selecione um motivo para a Pendência de Pagamento." }));
    return false;
  };

  const buildRequestData = (data, pageIndex, pageSize, options = {}) => {
    let requestData = { ...data };

    requestData = applyPendenciaDePagamentoErro(requestData, {
      whichStatusShow,
      selectedErroStatus,
      addPendentesOnTodos: isGuardador,
    });

    if (!isGuardador) {
      requestData = applyEspecificosFlags(requestData, data);
    }

    if (options.includePagination !== false) {
      requestData.page = pageIndex + 1;
      requestData.pageSize = pageSize;
    }

    return requestData;
  };

  const getValidatedRequestData = (data, pageIndex, pageSize, options = {}) => {
    if (!validateStatusSelection() || !validateErroStatusSelection()) return null;
    return buildRequestData(data, pageIndex, pageSize, options);
  };

  const handleAutocompleteChange = (field, newValue) => {
    if (isGuardador) {
      const normalizedValue = normalizeSelectAllAutocompleteValue(newValue);

      if (field === "agentNames") {
        setSelectedAgentOptions(normalizedValue);
        if (normalizedValue.length > 0) {
          setSelectedAssociationOptions([]);
          setValue("associations", []);
        }
      }
      if (field === "associations") {
        setSelectedAssociationOptions(normalizedValue);
        if (normalizedValue.length > 0) {
          setSelectedAgentOptions([]);
          setValue("agentNames", []);
        }
      }
      if (field === "status") {
        setSelectedStatusOptions(normalizedValue);
        const statusValues = normalizedValue.map((v) => (typeof v === "object" ? v.label : v));
        setWhichStatus(statusValues);
        const hasErro = statusValues.includes("Pendência de Pagamento");
        setShowErroStatus(hasErro);
        if (!hasErro) {
          setSelectedErroStatus([]);
          setValue("erroStatus", []);
        }
      }

      setValue(
        field,
        normalizedValue.map((option) => (typeof option === "object" ? option.value || option.label : option)),
      );
      return;
    }

    if (field === "status") {
      // Pendência Paga tem regra de data diferente (data de pagamento, dia único) dos demais
      // status (data de vencimento, intervalo). Por isso não pode ser combinada com eles.
      const hasPendenciaPaga = newValue.some((i) => i.label === "Pendencia Paga");
      if (hasPendenciaPaga && newValue.length > 1) {
        newValue = newValue.filter((i) => i.label === "Pendencia Paga");
        dispatch(
          showMessage({ message: "Pendência Paga não pode ser combinada com outros status; os demais foram removidos." }),
        );
      }
      setSelectedStatusOptions(newValue);

      const status = newValue.map((i) => i.label);
      setWhichStatus(status);

      const hasErro = status.includes("Pendência de Pagamento");
      setShowErroStatus(hasErro);
      if (!hasErro) {
        setSelectedErroStatus([]);
        setValue("erroStatus", []);
      }
    }

    setValue(field, newValue ? newValue.map((item) => item.value ?? item.label) : []);
  };

  const handleSelection = (field, newValue) => {
    setSelected(newValue.length > 0 ? field : null);

    // Favorecido e Consórcio são mutuamente exclusivos: escolher um limpa o outro.
    if (field === 'name') {
      setSelectedFavorecidos(newValue);
      if (newValue.length > 0 && selectedConsorcios.length > 0) {
        setSelectedConsorcios([]);
        setValue('consorcioName', []);
      }
    }
    if (field === 'consorcioName') {
      setSelectedConsorcios(newValue);
      if (newValue.length > 0 && selectedFavorecidos.length > 0) {
        setSelectedFavorecidos([]);
        setValue('name', []);
      }
    }

    handleAutocompleteChange(field, newValue);
  };

  const submitReportPermissionario = async (data, pageIndex, pageSize) => {
    if (!validateStatusSelection() || !validateErroStatusSelection()) return;
    const pageRequestData = buildRequestData(data, pageIndex, pageSize, { includePagination: true });
    setIsLoading(true);
    try {
      const pageResponse = await dispatch(handleFinancialMovementPage(pageRequestData));
      setPageCursors([null, pageResponse?.nextCursor ?? null]);
    } catch {
      dispatch(showMessage({ message: "Erro na busca, verifique os campos e tente novamente." }));
    } finally {
      setIsLoading(false);
    }
  };

  const submitPagePermissionario = async (data, pageIndex, pageSize) => {
    const pageRequestData = getValidatedRequestData(data, pageIndex, pageSize, { includePagination: true });
    if (!pageRequestData) return;

    setIsLoading(true);
    const cursor = pageCursors[pageIndex] ?? null;
    if (pageIndex > 0 && !cursor) {
      dispatch(showMessage({ message: "Cursor inválido para a página solicitada. Refaça a busca." }));
      setIsLoading(false);
      return;
    }
    if (cursor) {
      pageRequestData.cursorDataReferencia = cursor.dataReferencia;
      pageRequestData.cursorNome = cursor.nomes;
      pageRequestData.cursorStatus = cursor.status;
      pageRequestData.cursorCpfCnpj = cursor.cpfCnpj;
    }

    try {
      const pageResponse = await dispatch(handleFinancialMovementPage(pageRequestData));
      setPageCursors((prev) => {
        const updated = [...prev];
        updated[pageIndex + 1] = pageResponse?.nextCursor ?? null;
        return updated;
      });
      setPage(pageIndex);
    } catch {
      dispatch(showMessage({ message: "Erro na busca, verifique os campos e tente novamente." }));
    } finally {
      setIsLoading(false);
    }
  };

  const submitReportGuardador = async (data, pageIndex, pageSize) => {
    if (!validateErroStatusSelection()) return;
    const summaryRequestData = buildRequestData(data, pageIndex, pageSize, { includePagination: false });
    const pageRequestData = buildRequestData(data, pageIndex, pageSize, { includePagination: true });

    setIsLoading(true);
    try {
      await dispatch(handleAgentFinancialMovementSummary(summaryRequestData, { resetData: true }));
      const pageResponse = await dispatch(handleAgentFinancialMovementPage(pageRequestData));
      const newNextCursor = pageResponse?.nextCursor ?? null;

      setPageCursors((prevCursors) => {
        const nextCursors = prevCursors.slice(0, pageIndex + 1);
        if (newNextCursor) nextCursors[pageIndex + 1] = newNextCursor;
        return nextCursors;
      });
      setPage(pageIndex);
      setHasSearched(true);
    } catch {
      dispatch(showMessage({ message: "Erro na busca do relatório de guardadores. Verifique os filtros." }));
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data) => {
    setHasSearched(true);
    setPage(0);
    setPageCursors([null]);
    if (isGuardador) {
      await submitReportGuardador(data, 0, rowsPerPage);
    } else {
      submitReportPermissionario(data, 0, rowsPerPage);
    }
  };

  const handleChangePage = async (_event, newPage) => {
    if (isGuardador) {
      if (newPage === page) return;
      const data = getValues();
      const cursor = pageCursors[newPage];
      const pageData = {
        ...data,
        cursorDataReferencia: cursor?.dataReferencia,
        cursorNome: cursor?.nomes,
        cursorStatus: cursor?.status,
        cursorCpfCnpj: cursor?.cpfCnpj,
      };
      await submitReportGuardador(pageData, newPage, rowsPerPage);
      return;
    }

    if (!hasSearched) return;
    submitPagePermissionario(getValues(), newPage, rowsPerPage);
  };

  const handleChangeRowsPerPage = async (event) => {
    const newRowsPerPage = Number.parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
    setPageCursors([null]);

    if (isGuardador) {
      if (hasSearched) await submitReportGuardador(getValues(), 0, newRowsPerPage);
      return;
    }
    if (!hasSearched) return;
    submitPagePermissionario(getValues(), 0, newRowsPerPage);
  };

  const handleClear = () => {
    if (isGuardador) {
      reset({ agentNames: [], associations: [], dateRange: [], valorMax: "", valorMin: "", status: [], erroStatus: [] });
      setSelectedAgentOptions([]);
      setSelectedAssociationOptions([]);
      setSelectedStatusOptions([]);
    } else {
      setValue("name", []);
      setValue("dateRange", []);
      setValue("valorMax", "");
      setValue("valorMin", "");
      setValue("consorcioName", []);
      setValue("status", []);
      setValue("erroStatus", []);
      setSelectedConsorcios([]);
      setSelectedFavorecidos([]);
      setSelectedStatusOptions([]);
      for (const button of document.querySelectorAll(".MuiAutocomplete-clearIndicator")) {
        button.click();
      }
    }

    dispatch(setReportList([]));
    setSelectedErroStatus([]);
    setShowErroStatus(false);
    setWhichStatus([]);
    setPage(0);
    setHasSearched(false);
    setPageCursors([null]);
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
      const numeric = toNumber(value);
      return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(numeric);
    }
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(toNumber(value));
  };

  function toNumber(value) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value !== "string") return 0;
    const trimmed = value.trim();
    if (!trimmed) return 0;
    const cleaned = trimmed.replace(/\s/g, "").replace(/^R\$\s?/, "");
    const hasComma = cleaned.includes(",");
    const hasDot = cleaned.includes(".");
    if (hasComma) {
      const normalized = cleaned.replace(/\./g, "").replace(",", ".");
      const parsed = Number.parseFloat(normalized);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    if (hasDot) {
      const parts = cleaned.split(".");
      if (parts.length === 2 && parts[1].length === 3) {
        const parsed = Number.parseFloat(parts.join(""));
        return Number.isFinite(parsed) ? parsed : 0;
      }
      const parsed = Number.parseFloat(cleaned.replace(/,/g, ""));
      return Number.isFinite(parsed) ? parsed : 0;
    }
    const parsed = Number.parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  const handleMenuClick = (event) => setAnchorEl(event.currentTarget);

  const triggerBrowserDownload = ({ blob, filename, contentType }) => {
    const fileBlob = blob instanceof Blob ? blob : new Blob([blob], contentType ? { type: contentType } : undefined);
    const objectUrl = window.URL.createObjectURL(fileBlob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename || "financial-report";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 0);
  };

  const handleMenuClose = async (option) => {
    setAnchorEl(null);
    if (!option) return;

    const exportRequestData = getValidatedRequestData(getValues(), page, rowsPerPage, { includePagination: false });
    if (!exportRequestData) return;

    setIsExporting(true);
    try {
      dispatch(showMessage({ message: "Preparando download do relatório. Aguarde..." }));

      const response = isGuardador
        ? await dispatch(handleAgentFinancialMovementExport({ ...exportRequestData, format: option }))
        : await dispatch(handleFinancialMovementExport({ ...exportRequestData, format: option }));

      triggerBrowserDownload(response || {});
      dispatch(showMessage({ message: "Download do relatório iniciado." }));
    } catch {
      dispatch(showMessage({ message: "Erro ao baixar o relatório. Tente novamente." }));
    } finally {
      setIsExporting(false);
    }
  };

  const isConsorcio = (report, value) => (CNPJS_CONSORCIO.includes(report?.cpfCnpj) ? '' : value);

  const getStatusStyles = (status) => {
    switch (status) {
      case "Pago":
        return "bg-green-300 text-black";
      case "Estorno":
        return "bg-yellow-400 text-black";
      case "Aguardando Pagamento":
        return "bg-gray-400 text-black";
      case "OP Atrasada":
      case "Pendentes":
        return "bg-gray-400 text-black";
      case "Pendência Paga":
      case "Pendencia Paga":
        return "bg-blue-400 text-black";
      case "A Pagar":
        return "bg-gray-400 text-black";
      default:
        return "bg-red-300 text-black";
    }
  };

  const formatCpfCnpj = (value) => {
    if (!value) return '-';
    return isGuardador
      ? value.replace(/(\d{2,3})(\d{3})(\d{3})(\d{4})?(\d{2})/, "$1.$2.$3-$5")
      : value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  };

  const colSpan = (isGuardador ? 11 : 6) + (showStucColumns ? 8 : 0);

  return (
    <>
      <Paper>
        <Box className="w-full p-24 relative mt-32">
          <header className="mb-16">
            <h3 className="font-semibold text-lg">
              Filtros de Pesquisa{isGuardador ? ' - Guardadores' : ''}
            </h3>
          </header>

          <form noValidate onSubmit={handleSubmit(onSubmit)}>
            {/* Linha 1: período + status + motivos + favorecido / consórcios / específicos (guardador: guardador / associações) */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <ReportPeriodFilter
                control={control}
                minDate={isGuardador ? MIN_SELECTABLE_DATE_GUARDADOR : MIN_SELECTABLE_DATE_PERMISSIONARIO}
              />

              <Grid item xs={12} sm={6} md={4}>
                <Autocomplete
                  id="status"
                  multiple
                  fullWidth
                  getOptionLabel={(option) => option.label || option}
                  filterSelectedOptions
                  options={statusBase}
                  value={selectedStatusOptions}
                  onChange={(_, newValue) => handleAutocompleteChange("status", newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={isGuardador ? "Selecionar Status" : "Selecionar Status *"}
                      variant="outlined"
                      error={hasSearched && hasMissingStatusSelection}
                      helperText={hasSearched && hasMissingStatusSelection ? "Selecione um status para pesquisar." : ""}
                    />
                  )}
                />
              </Grid>

              {showErroStatus && (
                <Grid item xs={12} sm={6} md={4}>
                  <Autocomplete
                    id="erroStatus"
                    multiple
                    fullWidth
                    options={erroStatus}
                    getOptionLabel={(option) => option.label || option}
                    filterSelectedOptions
                    value={selectedErroStatus}
                    onChange={(_, newValue) => {
                      const normalizedValue = normalizeErroStatusSelection(newValue);
                      setSelectedErroStatus(normalizedValue);
                      setValue("erroStatus", normalizedValue.map((option) => option.label));
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={isGuardador ? "Motivo da Pendência" : "Motivos"}
                        variant="outlined"
                        error={isGuardador ? hasMissingErroStatusSelection : undefined}
                        helperText={
                          isGuardador && hasMissingErroStatusSelection
                            ? "Selecione um motivo para a Pendência de Pagamento."
                            : ""
                        }
                      />
                    )}
                  />
                </Grid>
              )}

              {isGuardador ? (
                <>
                  {shouldShowAgentNameFilter(selectedAssociationOptions) && (
                    <Grid item xs={12} sm={6} md={4}>
                      <Autocomplete
                        id="agentNames"
                        multiple
                        fullWidth
                        options={agentOptions}
                        value={selectedAgentOptions}
                        loading={loadingUsers}
                        getOptionLabel={(option) => option.label || option}
                        isOptionEqualToValue={(option, value) => option.value === value.value}
                        onChange={(_, newValue) => handleAutocompleteChange("agentNames", newValue)}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Selecionar Guardador"
                            variant="outlined"
                            InputProps={{
                              ...params.InputProps,
                              endAdornment: (
                                <>
                                  {loadingUsers ? <CircularProgress color="inherit" size={20} /> : null}
                                  {params.InputProps.endAdornment}
                                </>
                              ),
                            }}
                          />
                        )}
                      />
                    </Grid>
                  )}

                  {shouldShowAssociationFilter(selectedAgentOptions) && (
                    <Grid item xs={12} sm={6} md={4}>
                      <Autocomplete
                        id="associations"
                        multiple
                        fullWidth
                        options={associationOptions}
                        value={selectedAssociationOptions}
                        loading={loadingUsers}
                        getOptionLabel={(option) => option.label || option}
                        isOptionEqualToValue={(option, value) => option.value === value.value}
                        onChange={(_, newValue) => handleAutocompleteChange("associations", newValue)}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Selecionar Associações"
                            variant="outlined"
                            InputProps={{
                              ...params.InputProps,
                              endAdornment: (
                                <>
                                  {loadingUsers ? <CircularProgress color="inherit" size={20} /> : null}
                                  {params.InputProps.endAdornment}
                                </>
                              ),
                            }}
                          />
                        )}
                      />
                    </Grid>
                  )}
                </>
              ) : (
                <>
                  <Grid item xs={12} sm={6} md={4}>
                    <Autocomplete
                      id="favorecidos"
                      multiple
                      fullWidth
                      getOptionLabel={(option) => option.value.fullName}
                      filterSelectedOptions
                      options={userOptions}
                      value={selectedFavorecidos}
                      getOptionDisabled={() => selectedConsorcios.length > 0}
                      filterOptions={(options, state) =>
                        options.filter(
                          (option) =>
                            option.value?.cpfCnpj?.includes(state.inputValue) ||
                            option.value?.permitCode?.includes(state.inputValue) ||
                            option.value?.fullName?.toLowerCase().includes(state.inputValue.toLowerCase()),
                        )
                      }
                      loading={loadingUsers}
                      onChange={(_, newValue) => handleSelection("name", newValue)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Selecionar Favorecido"
                          variant="outlined"
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <>
                                {loadingUsers ? <CircularProgress color="inherit" size={20} /> : null}
                                {params.InputProps.endAdornment}
                              </>
                            ),
                          }}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={4}>
                    <Autocomplete
                      id="consorcio"
                      multiple
                      fullWidth
                      getOptionLabel={(option) => option.label}
                      filterSelectedOptions
                      options={consorcios}
                      value={selectedConsorcios}
                      getOptionDisabled={(option) => option.disabled || selectedFavorecidos.length > 0}
                      isOptionEqualToValue={(option, value) => option.value === value.value}
                      onChange={(_, newValue) => handleSelection("consorcioName", newValue)}
                      renderInput={(params) => (
                        <TextField {...params} label="Selecionar Consórcios | Modais" variant="outlined" />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={4}>
                    <Autocomplete
                      id="especificos"
                      multiple
                      fullWidth
                      options={especificos}
                      getOptionLabel={(option) => option.label}
                      filterSelectedOptions
                      onChange={(_, newValue) => {
                        setSelectedEspecificos(newValue.map((item) => item.label));
                        handleAutocompleteChange("especificos", newValue);
                      }}
                      renderInput={(params) => <TextField {...params} label="Selecionar Específicos" variant="outlined" />}
                    />
                  </Grid>
                </>
              )}

              <ValorRangeFilter control={control} getValues={getValues} trigger={trigger} clearErrors={clearErrors} />
            </Grid>

            {!isGuardador && whichStatusShow.includes("A pagar") && (
              <span className="text-sm text-red-600 block mt-16">
                Atenção: Para o status "a pagar", a data escolhida deve ser referente a Data Ordem de Pagamento
                (sexta a quinta-feira).
              </span>
            )}

            <Box className="flex gap-10 mt-24">
              <Button variant="contained" color="secondary" aria-label="Pesquisar" type="submit" size="medium">
                Pesquisar
              </Button>
              <Button variant="outlined" aria-label="Limpar Filtros" type="button" size="medium" onClick={handleClear}>
                Limpar Filtros
              </Button>
            </Box>
          </form>
        </Box>
      </Paper>

      <Paper>
        <Box className="w-full md:mx-9 p-24 relative mt-32">
          <header className="flex justify-between items-center mb-16">
            <h3 className="font-semibold text-lg">Data Vigente: {format(new Date(), "dd/MM/yyyy")}</h3>

            <Button
              aria-controls="export-menu"
              aria-haspopup="true"
              onClick={handleMenuClick}
              disabled={isExporting}
              startIcon={!isExporting ? <SaveAltIcon /> : null}
            >
              {isExporting ? (
                <Box className="flex items-center gap-8">
                  <CircularProgress size={18} color="inherit" />
                  <span>Baixando...</span>
                </Box>
              ) : (
                "Exportar"
              )}
            </Button>
            <Menu id="export-menu" anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
              <MenuItem onClick={() => handleMenuClose("csv")}>CSV</MenuItem>
              <MenuItem onClick={() => handleMenuClose("pdf")}>PDF</MenuItem>
              <MenuItem onClick={() => handleMenuClose("xlsx")}>XLSX</MenuItem>
            </Menu>
          </header>

          <TablePagination
            component="div"
            count={reportList?.count ?? 0}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Linhas por página"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
            rowsPerPageOptions={[10, 50, 100, 500, 1000]}
            nextIconButtonProps={{ disabled: !hasNextPage }}
          />

          <TableContainer
            sx={{ height: "50vh", width: "100%", overflowX: "auto", overflowY: "auto" }}
          >
            <Table size="small" sx={isGuardador ? { minWidth: 1280 } : undefined}>
              <TableHead>
                <TableRow className="sticky top-0 bg-white z-10">
                  <TableCell className="font-semibold py-1 text-sm leading-none">Data Tentativa Pagamento</TableCell>
                  <TableCell className="font-semibold p-1 text-sm" style={{ whiteSpace: 'nowrap' }}>
                    {isGuardador ? 'Nome Guardador' : 'Nome'}
                  </TableCell>
                  <TableCell className="font-semibold p-1 text-sm" style={{ maxWidth: 220 }}>Email</TableCell>
                  <TableCell className="font-semibold py-1 text-sm leading-none">Cód. Banco</TableCell>
                  <TableCell className="font-semibold p-1 text-sm">Banco</TableCell>
                  <TableCell className="font-semibold p-1 text-sm">CPF/CNPJ</TableCell>
                  <TableCell className="font-semibold py-1 text-sm leading-none">
                    {isGuardador ? 'Associação' : 'Consórcios | Modais'}
                  </TableCell>
                  {(isGuardador ? showEffectivePaymentDate : !showErroStatus) && (
                    <TableCell className="font-semibold py-1 text-sm leading-none">Data Efetiva Pagamento</TableCell>
                  )}
                  <TableCell className="font-semibold p-1 text-sm">Valor</TableCell>
                  <TableCell className="font-semibold p-1 text-sm">Status</TableCell>
                  <TableCell className="font-semibold p-1 text-sm">Descrição do Erro</TableCell>
                  {showStucColumns &&
                    [1, 2, 3, 4].map((n) => (
                      <React.Fragment key={`stuc-head-${n}`}>
                        <TableCell className="font-semibold p-1 text-sm">{`Dt Ord. Pg${n}`}</TableCell>
                        <TableCell className="font-semibold p-1 text-sm">Valor</TableCell>
                      </React.Fragment>
                    ))}
                </TableRow>
              </TableHead>

              <TableBody className="overflow-scroll">
                {!isLoading ? (
                  reportList?.count > 0 ? (
                    reportList.data?.map((report, index) => (
                      <TableRow key={index} className="hover:bg-gray-50">
                        <TableCell className="text-xs py-1">{report.dataReferencia}</TableCell>
                        <TableCell className="text-xs py-6 px-1" style={{ whiteSpace: 'nowrap' }}>
                          {isGuardador ? getAssociationDisplayName(report.nomes) : report.nomes}
                        </TableCell>
                        <TableCell className="text-xs py-6 px-1" style={{ maxWidth: 220, overflowWrap: 'break-word' }}>
                          {isGuardador
                            ? (isKnownAssociationName(report.nomes) ? '-' : report.email || '-')
                            : isConsorcio(report, report.email)}
                        </TableCell>
                        <TableCell className="text-xs py-1">
                          {isGuardador ? report.codBanco || '-' : isConsorcio(report, report.codBanco)}
                        </TableCell>
                        <TableCell
                          className="text-xs py-6 px-1"
                          style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: 120 }}
                        >
                          {isGuardador ? report.nomeBanco || '-' : isConsorcio(report, report.nomeBanco)}
                        </TableCell>
                        <TableCell className="text-xs py-6 px-1">{formatCpfCnpj(report.cpfCnpj)}</TableCell>
                        <TableCell className="text-xs py-1">
                          {isGuardador ? getAssociationDisplayName(report.consorcio) || '-' : report.consorcio}
                        </TableCell>

                        {(isGuardador ? showEffectivePaymentDate : !showErroStatus) && (
                          <TableCell className="text-xs py-1">
                            {isGuardador
                              ? getAgentEffectivePaymentDateLabel(report)
                              : report.status === 'Pendencia Paga' ? report.dataPagamento : '-'}
                          </TableCell>
                        )}

                        <TableCell className="text-xs py-6 px-1">{formatCurrency(report.valor)}</TableCell>
                        <TableCell className="text-xs py-6 px-1">
                          <span
                            className={`px-3 py-1 rounded-full text-xs ${getStatusStyles(
                              report.status === "Pendentes" ? "OP Atrasada" : report.status,
                            )}`}
                          >
                            {report.status === "Pendentes" ? "OP Atrasada" : report.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs py-6 px-1" style={{ maxWidth: 280, overflowWrap: 'break-word' }}>
                          {report.descricaoErro || '-'}
                        </TableCell>
                        {showStucColumns &&
                          [1, 2, 3, 4].map((n) => (
                            <React.Fragment key={`stuc-body-${index}-${n}`}>
                              <TableCell className="text-xs py-1">{report[`dataOrdemPagamento${n}`] || '-'}</TableCell>
                              <TableCell className="text-xs py-6 px-1">
                                {report[`valorOrdemPagamento${n}`] != null ? formatCurrency(report[`valorOrdemPagamento${n}`]) : '-'}
                              </TableCell>
                            </React.Fragment>
                          ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={colSpan} className="text-center py-4">
                        Não há dados para serem exibidos
                      </TableCell>
                    </TableRow>
                  )
                ) : (
                  <TableRow>
                    <TableCell colSpan={colSpan}>
                      <Box className="flex justify-center items-center m-10">
                        <CircularProgress />
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>

              <TableFooter className="sticky bottom-0 bg-white z-10">
                {isGuardador ? (
                  (reportList?.valorPago > 0 ||
                    reportList?.valorEstornado > 0 ||
                    reportList?.valorRejeitado > 0 ||
                    reportList?.valorTotal > 0 ||
                    reportList?.valorPendente > 0 ||
                    showErroStatus) && (
                    <TableRow>
                      <TableCell colSpan={colSpan} className="py-8 text-black">
                        <Box className="flex gap-16 flex-wrap justify-end font-bold text-base">
                          {reportList?.valorPago > 0 && <span>Pago: {formatCurrency(reportList.valorPago)}</span>}
                          {reportList?.valorAguardandoPagamento > 0 && (
                            <span>Aguardando Pagamento: {formatCurrency(reportList.valorAguardandoPagamento)}</span>
                          )}
                          {reportList?.valorAPagar > 0 && <span>A Pagar: {formatCurrency(reportList.valorAPagar)}</span>}
                          {reportList?.valorPendenciaPaga > 0 && (
                            <span>Pendência Paga: {formatCurrency(reportList.valorPendenciaPaga)}</span>
                          )}
                          {reportList?.valorEstornado > 0 && <span>Estorno: {formatCurrency(reportList.valorEstornado)}</span>}
                          {reportList?.valorRejeitado > 0 && <span>Rejeitado: {formatCurrency(reportList.valorRejeitado)}</span>}
                          {reportList?.valorTotal > 0 && (
                            <span>Total Geral: {formatCurrency(reportList.valorTotal)}</span>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  )
                ) : (
                  <>
                    <TableRow></TableRow>
                    {(reportList.valorPago > 0 ||
                      reportList.valorEstornado > 0 ||
                      reportList.valorRejeitado > 0 ||
                      reportList.valorTotal > 0 ||
                      reportList.valorPendente > 0 ||
                      showErroStatus) && (
                      <TableRow>
                        <TableCell />
                        <TableCell colSpan={7} className="text-right font-bold text-black text-base pt-16">
                          {(() => {
                            const isErrorReport = showErroStatus;
                            const valorPago = toNumber(reportList.valorPago);
                            const valorEstornado = toNumber(reportList.valorEstornado);
                            const valorRejeitado = toNumber(reportList.valorRejeitado);
                            const valorAguardandoPagamento = toNumber(reportList.valorAguardandoPagamento);
                            const valorPendente = toNumber(reportList.valorPendente);
                            const totalPendenciaPagamento = valorEstornado + valorRejeitado + valorPendente;
                            const totalGeral = toNumber(reportList.valorTotal);
                            const totalLabel = isErrorReport ? "Total Pendencia de Pagamento" : "Total Geral";
                            const totalValue = isErrorReport ? totalPendenciaPagamento : totalGeral;
                            const totals = [];

                            if (valorPago > 0) totals.push(`Total Pago: ${formatCurrency(valorPago)}`);
                            if (!showErroStatus && totalPendenciaPagamento > 0) {
                              totals.push(`Total Pendencia de Pagamento: ${formatCurrency(totalPendenciaPagamento)}`);
                            }
                            if (valorEstornado > 0) totals.push(`Total Estorno: ${formatCurrency(valorEstornado)}`);
                            if (valorRejeitado > 0) totals.push(`Total Rejeitado: ${formatCurrency(valorRejeitado)}`);
                            if (valorAguardandoPagamento > 0) {
                              totals.push(`Total Aguardando Pagamento: ${formatCurrency(valorAguardandoPagamento)}`);
                            }
                            if (valorPendente > 0) totals.push(`Total OPs atrasadas: ${formatCurrency(valorPendente)}`);
                            if ((totalValue ?? 0) >= 0) totals.push(`${totalLabel}: ${formatCurrency(totalValue)}`);

                            return totals.filter(Boolean).join("    |    ");
                          })()}
                        </TableCell>
                        <TableCell />
                        <TableCell />
                      </TableRow>
                    )}
                  </>
                )}
              </TableFooter>
            </Table>
          </TableContainer>
        </Box>
      </Paper>
    </>
  );
}
