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
  InputAdornment,
  Menu,
  TableFooter,
  TablePagination,
} from "@mui/material";
import { format } from "date-fns";
import { useDispatch, useSelector } from "react-redux";
import { DateRangePicker } from "rsuite";
import { useForm, Controller } from "react-hook-form";
import { NumericFormat } from "react-number-format";
import { ClearIcon } from "@mui/x-date-pickers";

import {
  handleAgentFinancialMovementExport,
  handleAgentFinancialMovementPage,
  handleAgentFinancialMovementSummary,
  setReportList,
} from "app/store/reportSlice";
import { getAgentUsers } from "app/store/adminSlice";
import { showMessage } from "app/store/fuse/messageSlice";
import {
  buildAgentAutocompleteOptions,
  buildAssociationAutocompleteOptions,
  getAgentEffectivePaymentDateLabel,
  getAssociationDisplayName,
  isKnownAssociationName,
  normalizeSelectAllAutocompleteValue,
  shouldShowAgentNameFilter,
  shouldShowAssociationFilter,
} from "app/store/agentConsolidatedReportUtils";
import { normalizeErroStatusSelection } from "./reportUtils";

export default function AgentsFinancialMovement() {
  const minSelectableDate = new Date(2024, 3, 30);
  const reportList = useSelector((state) => state.report.reportList);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [agentOptions, setAgentOptions] = useState([]);
  const [associationOptions, setAssociationOptions] = useState([]);
  const [selectedAgentOptions, setSelectedAgentOptions] = useState([]);
  const [selectedAssociationOptions, setSelectedAssociationOptions] = useState([]);
  const [selectedStatusOptions, setSelectedStatusOptions] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [showClearMin, setShowClearMin] = useState(false);
  const [showClearMax, setShowClearMax] = useState(false);
  const [whichStatusShow, setWhichStatus] = useState([]);
  const [showErroStatus, setShowErroStatus] = useState(false);
  const [selectedErroStatus, setSelectedErroStatus] = useState([]);
  const [isExporting, setIsExporting] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [hasSearched, setHasSearched] = useState(false);
  const [pageCursors, setPageCursors] = useState([null]);
  const hasNextPage = Boolean(pageCursors[page + 1]);

  const guardadorStatusBase = [
    { label: "A Pagar", value: "A Pagar" },
    { label: "Aguardando Pagamento", value: "Aguardando Pagamento" },
    { label: "Pago", value: "Pago" },
    { label: "Pendência de Pagamento", value: "Pendência de Pagamento" },
    { label: "Pendência Paga", value: "Pendência Paga" },
  ];

  const erroStatus = [
    { label: "Todos" },
    { label: "Estorno" },
    { label: "Rejeitado" },
    { label: "OPs atrasadas" },
  ];

  const dispatch = useDispatch();

  const { handleSubmit, setValue, control, getValues, trigger, clearErrors, reset } =
    useForm({
      defaultValues: {
        agentNames: [],
        associations: [],
        dateRange: [],
        valorMax: "",
        valorMin: "",
        status: [],
        erroStatus: [],
      },
    });

  useEffect(() => {
    setLoadingFilters(true);
    dispatch(getAgentUsers())
      .then((agentUsers) => {
        const normalizedAgentUsers = Array.isArray(agentUsers) ? agentUsers : [];
        setAgentOptions(buildAgentAutocompleteOptions(normalizedAgentUsers));
        setAssociationOptions(buildAssociationAutocompleteOptions(normalizedAgentUsers));
      })
      .catch(() => {
        setAgentOptions([]);
        setAssociationOptions([]);
        dispatch(
          showMessage({
            message: "Não foi possível carregar os guardadores e associações.",
          }),
        );
      })
      .finally(() => {
        setLoadingFilters(false);
      });
  }, [dispatch]);

  const buildRequestData = (data, pageIndex, pageSize, options = {}) => {
    const requestData = { ...data };

    if (whichStatusShow.includes("Pendência de Pagamento") && selectedErroStatus.length > 0) {
      requestData.status = requestData.status.filter((status) => status !== "Pendência de Pagamento");

      const selectedErroLabels = selectedErroStatus.map((status) => status.label);
      const statusSet = new Set(requestData.status);

      if (selectedErroLabels.includes("Todos")) {
        statusSet.add("Erro");
        statusSet.add("Pendentes");
        requestData.erro = true;
      } else {
        if (selectedErroLabels.includes("Estorno")) {
          statusSet.add("Estorno");
          requestData.estorno = true;
        }
        if (selectedErroLabels.includes("Rejeitado")) {
          statusSet.add("Rejeitado");
          requestData.rejeitado = true;
        }
        if (selectedErroLabels.includes("OPs atrasadas")) {
          statusSet.add("Pendentes");
        }
      }

      requestData.status = Array.from(statusSet);
    }

    if (options.includePagination !== false) {
      requestData.page = pageIndex + 1;
      requestData.pageSize = pageSize;
    }

    return requestData;
  };

  const hasMissingErroStatusSelection =
    whichStatusShow.includes("Pendência de Pagamento") &&
    selectedErroStatus.length === 0;

  const validateErroStatusSelection = () => {
    if (!hasMissingErroStatusSelection) {
      return true;
    }

    dispatch(
      showMessage({
        message: "Selecione um motivo para a Pendência de Pagamento.",
      }),
    );
    return false;
  };

  const submitReport = async (data, pageIndex, pageSize) => {
    if (!validateErroStatusSelection()) {
      return;
    }

    const summaryRequestData = buildRequestData(data, pageIndex, pageSize, {
      includePagination: false,
    });
    const pageRequestData = buildRequestData(data, pageIndex, pageSize, {
      includePagination: true,
    });

    setIsLoading(true);

    try {
      await dispatch(handleAgentFinancialMovementSummary(summaryRequestData, { resetData: true }));
      const pageResponse = await dispatch(handleAgentFinancialMovementPage(pageRequestData));
      const newNextCursor = pageResponse?.nextCursor ?? null;

      setPageCursors((prevCursors) => {
        const nextCursors = prevCursors.slice(0, pageIndex + 1);
        if (newNextCursor) {
          nextCursors[pageIndex + 1] = newNextCursor;
        }
        return nextCursors;
      });

      setPage(pageIndex);
      setHasSearched(true);
    } catch (error) {
      dispatch(
        showMessage({
          message: "Erro na busca do relatório de guardadores. Verifique os filtros.",
        }),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data) => {
    setPageCursors([null]);
    setPage(0);
    await submitReport(data, 0, rowsPerPage);
  };

  const handleChangePage = async (event, newPage) => {
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

    await submitReport(pageData, newPage, rowsPerPage);
  };

  const handleChangeRowsPerPage = async (event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
    setPageCursors([null]);

    if (hasSearched) {
      const data = getValues();
      await submitReport(data, 0, newRowsPerPage);
    }
  };

  const handleAutocompleteChange = (field, newValue) => {
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
      const statusValues = newValue.map((v) => (typeof v === "object" ? v.label : v));
      setWhichStatus(statusValues);
      const hasErroStatus = statusValues.includes("Pendência de Pagamento");
      setShowErroStatus(hasErroStatus);

      if (!hasErroStatus) {
        setSelectedErroStatus([]);
        setValue("erroStatus", []);
      }
    }

    setValue(
      field,
      normalizedValue.map((option) => (typeof option === "object" ? option.value || option.label : option)),
    );
  };

  const handleClear = () => {
    reset({
      agentNames: [],
      associations: [],
      dateRange: [],
      valorMax: "",
      valorMin: "",
      status: [],
      erroStatus: [],
    });
    setSelectedAgentOptions([]);
    setSelectedAssociationOptions([]);
    setSelectedStatusOptions([]);
    setSelectedErroStatus([]);
    setShowErroStatus(false);
    setWhichStatus([]);
    setShowClearMin(false);
    setShowClearMax(false);
    setPage(0);
    setPageCursors([null]);
    setHasSearched(false);
    dispatch(setReportList([]));
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = async (formatType) => {
    setAnchorEl(null);
    if (!formatType) return;

    if (!validateErroStatusSelection()) {
      return;
    }

    const data = getValues();
    const exportRequestData = buildRequestData(data, 0, rowsPerPage, {
      includePagination: false,
    });
    exportRequestData.format = formatType;

    setIsExporting(true);
    try {
      const result = await dispatch(handleAgentFinancialMovementExport(exportRequestData));
      if (result?.blob) {
        const url = window.URL.createObjectURL(new Blob([result.blob], { type: result.contentType }));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", result.filename || `relatorio-guardadores.${formatType}`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      dispatch(
        showMessage({
          message: "Erro ao exportar o relatório de guardadores.",
        }),
      );
    } finally {
      setIsExporting(false);
    }
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined || isNaN(value)) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

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

  return (
    <>
      <Paper>
        <Box className="w-full md:mx-9 p-24 relative mt-32">
          <header className="font-semibold text-base mb-16">Filtros de Pesquisa - Guardadores</header>

          <Box className="flex items-center py-10 gap-10">
            <form onSubmit={handleSubmit(onSubmit)} className="w-full">
              <Box className="flex gap-10 flex-wrap mb-20">
                {shouldShowAgentNameFilter(selectedAssociationOptions) ? (
                  <Autocomplete
                    id="agentNames"
                    multiple
                    className="w-[25rem] md:min-w-[25rem] md:w-auto p-1"
                    options={agentOptions}
                    value={selectedAgentOptions}
                    loading={loadingFilters}
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
                              {loadingFilters ? <CircularProgress color="inherit" size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                  />
                ) : null}

                {shouldShowAssociationFilter(selectedAgentOptions) ? (
                  <Autocomplete
                    id="associations"
                    multiple
                    className="w-[25rem] md:min-w-[25rem] md:w-auto p-1"
                    options={associationOptions}
                    value={selectedAssociationOptions}
                    loading={loadingFilters}
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
                              {loadingFilters ? <CircularProgress color="inherit" size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                  />
                ) : null}

                <Autocomplete
                  id="status"
                  multiple
                  className="w-[25rem] md:min-w-[25rem] md:w-auto p-1"
                  getOptionLabel={(option) => option.label || option}
                  options={guardadorStatusBase}
                  value={selectedStatusOptions}
                  onChange={(_, newValue) => handleAutocompleteChange("status", newValue)}
                  renderInput={(params) => (
                    <TextField {...params} label="Selecionar Status" variant="outlined" />
                  )}
                />

                {showErroStatus ? (
                  <Autocomplete
                    id="erroStatus"
                    multiple
                    className="w-[25rem] md:min-w-[25rem] md:w-auto p-1"
                    getOptionLabel={(option) => option.label || option}
                    options={erroStatus}
                    value={selectedErroStatus}
                    onChange={(_, newValue) => {
                      const normalized = normalizeErroStatusSelection(newValue);
                      setSelectedErroStatus(normalized);
                      setValue("erroStatus", normalized.map((item) => item.label));
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Motivo da Pendência"
                        variant="outlined"
                        error={hasMissingErroStatusSelection}
                        helperText={
                          hasMissingErroStatusSelection
                            ? "Selecione um motivo para a Pendência de Pagamento."
                            : ""
                        }
                      />
                    )}
                  />
                ) : null}
              </Box>

              <Box className="flex items-center gap-10 flex-wrap mb-20">
                <Controller
                  name="dateRange"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <DateRangePicker
                      {...field}
                      size="lg"
                      showOneCalendar
                      showHeader={false}
                      placement="auto"
                      placeholder="Selecionar Data"
                      format="dd-MM-yyyy"
                      character=" a "
                      cleanable
                      disabledDate={(date) => date < minSelectableDate}
                    />
                  )}
                />

                <Controller
                  name="valorMin"
                  control={control}
                  render={({ field }) => (
                    <NumericFormat
                      {...field}
                      customInput={TextField}
                      label="Valor Mínimo"
                      thousandSeparator="."
                      decimalSeparator=","
                      prefix="R$ "
                      decimalScale={2}
                      fixedDecimalScale
                      variant="outlined"
                      onFocus={() => setShowClearMin(true)}
                      onBlur={() => setShowClearMin(false)}
                      InputProps={{
                        endAdornment: showClearMin && field.value && (
                          <InputAdornment position="end">
                            <ClearIcon
                              className="cursor-pointer"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => setValue("valorMin", "")}
                            />
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />

                <Controller
                  name="valorMax"
                  control={control}
                  render={({ field }) => (
                    <NumericFormat
                      {...field}
                      customInput={TextField}
                      label="Valor Máximo"
                      thousandSeparator="."
                      decimalSeparator=","
                      prefix="R$ "
                      decimalScale={2}
                      fixedDecimalScale
                      variant="outlined"
                      onFocus={() => setShowClearMax(true)}
                      onBlur={() => setShowClearMax(false)}
                      InputProps={{
                        endAdornment: showClearMax && field.value && (
                          <InputAdornment position="end">
                            <ClearIcon
                              className="cursor-pointer"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => setValue("valorMax", "")}
                            />
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />
              </Box>

              <Box className="flex gap-10 mt-16">
                <Button variant="contained" color="secondary" type="submit" size="medium">
                  Pesquisar
                </Button>
                <Button variant="contained" type="button" size="medium" onClick={handleClear}>
                  Limpar Filtros
                </Button>
              </Box>
            </form>
          </Box>
        </Box>
      </Paper>

      <Paper>
        <Box className="w-full md:mx-9 p-24 relative mt-32">
          <header className="flex justify-between items-center mb-16">
            <h3 className="font-semibold text-lg">
              Data Vigente: {format(new Date(), "dd/MM/yyyy")}
            </h3>

            <Button
              aria-controls="export-menu"
              aria-haspopup="true"
              onClick={handleMenuClick}
              disabled={isExporting}
            >
              {isExporting ? (
                <Box className="flex items-center gap-8">
                  <CircularProgress size={18} color="inherit" />
                  <span>Baixando...</span>
                </Box>
              ) : (
                <>Exportar</>
              )}
            </Button>
            <Menu
              id="export-menu"
              anchorEl={anchorEl}
              keepMounted
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
            >
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

          <div style={{ height: "50vh", width: "100%" }} className="overflow-scroll">
            <Table size="small">
              <TableHead>
                <TableRow className="sticky top-0 bg-white z-10">
                  <TableCell className="font-semibold py-1 text-sm">Data Tentativa Pagamento</TableCell>
                  <TableCell className="font-semibold p-1 text-sm">Nome Guardador</TableCell>
                  <TableCell className="font-semibold p-1 text-sm">Email</TableCell>
                  <TableCell className="font-semibold py-1 text-sm">Cód. Banco</TableCell>
                  <TableCell className="font-semibold p-1 text-sm">Banco</TableCell>
                  <TableCell className="font-semibold p-1 text-sm">CPF/CNPJ</TableCell>
                  <TableCell className="font-semibold py-1 text-sm">Associação</TableCell>
                  {!showErroStatus && (
                    <TableCell className="font-semibold py-1 text-sm">Data Efetiva Pagamento</TableCell>
                  )}
                  <TableCell className="font-semibold p-1 text-sm">Valor</TableCell>
                  <TableCell className="font-semibold p-1 text-sm">Status</TableCell>
                  <TableCell className="font-semibold p-1 text-sm">Descrição do Erro</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {!isLoading ? (
                  reportList?.count > 0 ? (
                    reportList.data?.map((report, index) => (
                      <TableRow key={index} className="hover:bg-gray-50">
                        <TableCell className="text-xs py-1">{report.dataReferencia}</TableCell>
                        <TableCell className="text-xs py-6 px-1" style={{ whiteSpace: "nowrap" }}>
                          {getAssociationDisplayName(report.nomes)}
                        </TableCell>
                        <TableCell className="text-xs py-6 px-1">
                          {isKnownAssociationName(report.nomes) ? "-" : report.email || "-"}
                        </TableCell>
                        <TableCell className="text-xs py-1">{report.codBanco || "-"}</TableCell>
                        <TableCell className="text-xs py-6 px-1">{report.nomeBanco || "-"}</TableCell>
                        <TableCell className="text-xs py-6 px-1">
                          {report.cpfCnpj
                            ? report.cpfCnpj.replace(
                                /(\d{2,3})(\d{3})(\d{3})(\d{4})?(\d{2})/,
                                "$1.$2.$3-$5",
                              )
                            : "-"}
                        </TableCell>
                        <TableCell className="text-xs py-1">{getAssociationDisplayName(report.consorcio) || "-"}</TableCell>
                        {!showErroStatus && (
                          <TableCell className="text-xs py-1">
                            {getAgentEffectivePaymentDateLabel(report)}
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
                        <TableCell className="text-xs py-6 px-1" style={{ maxWidth: 280, overflowWrap: "break-word" }}>
                          {report.descricaoErro || "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-4">
                        Não há dados para serem exibidos
                      </TableCell>
                    </TableRow>
                  )
                ) : (
                  <TableRow>
                    <TableCell colSpan={11}>
                      <Box className="flex justify-center items-center m-10">
                        <CircularProgress />
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>

              <TableFooter className="sticky bottom-0 bg-white z-10">
                {(reportList?.valorPago > 0 ||
                  reportList?.valorEstornado > 0 ||
                  reportList?.valorRejeitado > 0 ||
                  reportList?.valorTotal > 0 ||
                  reportList?.valorPendente > 0 ||
                  showErroStatus) && (
                  <TableRow>
                    <TableCell colSpan={11} className="py-8 text-black">
                      <Box className="flex gap-16 flex-wrap justify-end font-bold text-base">
                        {reportList?.valorPago > 0 && (
                          <span>Pago: {formatCurrency(reportList.valorPago)}</span>
                        )}
                        {reportList?.valorAguardandoPagamento > 0 && (
                          <span>Aguardando Pagamento: {formatCurrency(reportList.valorAguardandoPagamento)}</span>
                        )}
                        {reportList?.valorAPagar > 0 && (
                          <span>A Pagar: {formatCurrency(reportList.valorAPagar)}</span>
                        )}
                        {reportList?.valorPendenciaPaga > 0 && (
                          <span>Pendência Paga: {formatCurrency(reportList.valorPendenciaPaga)}</span>
                        )}
                        {reportList?.valorEstornado > 0 && (
                          <span>Estorno: {formatCurrency(reportList.valorEstornado)}</span>
                        )}
                        {reportList?.valorRejeitado > 0 && (
                          <span>Rejeitado: {formatCurrency(reportList.valorRejeitado)}</span>
                        )}
                        {reportList?.valorTotal > 0 && (
                          <span>Total Geral: {formatCurrency(reportList.valorTotal)}</span>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableFooter>
            </Table>
          </div>
        </Box>
      </Paper>
    </>
  );
}

