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
  IconButton,
  TableFooter,
  TablePagination
} from "@mui/material";

import { format } from "date-fns";
import { useDispatch, useSelector } from "react-redux";
import { DateRangePicker } from "rsuite";
import { useForm, Controller } from "react-hook-form";

import { handleFinancialMovementExport, handleFinancialMovementPage, handleFinancialMovementSummary, setReportList } from "app/store/reportSlice";

import { getUser } from "app/store/adminSlice";
import { NumericFormat } from "react-number-format";
import { showMessage } from "app/store/fuse/messageSlice";
import { ClearIcon } from "@mui/x-date-pickers";
import { normalizeErroStatusSelection } from "./reportUtils";

export default function BasicEditingGrid() {
  const minSelectableDate = new Date(2024, 3, 30);
  const reportList = useSelector((state) => state.report.reportList);
  const userList = useSelector((state) => state.admin.userList) || [];
  const specificValue = useSelector((state) => state.report.specificValue);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userOptions, setUserOptions] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [showClearMin, setShowClearMin] = useState(false);
  const [showClearMax, setShowClearMax] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [whichStatusShow, setWhichStatus] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showErroStatus, setShowErroStatus] = useState(false);
  const [selectedErroStatus, setSelectedErroStatus] = useState([]);
  const [selectedConsorcios, setSelectedConsorcios] = useState([]);
  const [selectedEspecificos, setSelectedEspecificos] = useState([]);
  const [isExporting, setIsExporting] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [hasSearched, setHasSearched] = useState(false);
  const [pageCursors, setPageCursors] = useState([null]);
  const hasNextPage = Boolean(pageCursors[page + 1]);


  const consorciosStatusBase = [
    { label: "A Pagar" },
    { label: "Aguardando Pagamento" },
    { label: "Pago" },
    { label: "Pendência de Pagamento" },
    { label: "Pendencia Paga" }
  ];

  const erroStatus = [
    { label: "Todos" },
    { label: "Estorno" },
    { label: "Rejeitado" },
    { label: "OPs atrasadas" },
  ];



  const consorcios = [
    { label: "Todos", value: "Todos" },
    { label: "Internorte", value: "Internorte" },
    { label: "Intersul", value: "Intersul" },
    { label: "MobiRio", value: "MobiRio" },
    { label: 'MOBI-Rio BUM', value: "MOBI-Rio BUM" },
    { label: "Santa Cruz", value: "Santa Cruz" },
    { label: "STPC", value: "STPC", disabled: selected === "name" },
    { label: "STPL", value: "STPL", disabled: selected === "name" },
    { label: "Transcarioca", value: "Transcarioca" },
    { label: "VLT", value: "VLT" },
    { label: "TEC", value: "TEC", disabled: selected === "name" },
  ];

  const especificos = [
    { label: 'Eleição' },
    { label: 'Desativados' },
  ];

  const dispatch = useDispatch();

  const { handleSubmit, setValue, control, getValues, trigger, clearErrors } =
    useForm({
      defaultValues: {
        name: [],
        dateRange: [],
        valorMax: "",
        valorMin: "",
        consorcioName: [],
        especificos: [],
        status: [],
        erroStatus: [],
      },
    });

  const buildRequestData = (data, pageIndex, pageSize, options = {}) => {
    const requestData = { ...data };

    if (whichStatusShow.includes("Pendência de Pagamento") && selectedErroStatus.length > 0) {
      requestData.status = requestData.status.filter(status => status !== "Pendência de Pagamento");

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

    if (data.especificos.includes("Eleição")) {
      requestData.eleicao = true;
    }
    if (data.especificos.includes("Desativados")) {
      requestData.desativados = true;
    }

    if (options.includePagination !== false) {
      requestData.page = pageIndex + 1;
      requestData.pageSize = pageSize;
    }

    return requestData;
  };

  const submitReport = async (data, pageIndex, pageSize) => {
    setIsLoading(true);
    const summaryRequestData = buildRequestData(data, pageIndex, pageSize, { includePagination: false });
    const pageRequestData = buildRequestData(data, pageIndex, pageSize, { includePagination: true });

    try {
      await dispatch(handleFinancialMovementSummary(summaryRequestData, { resetData: true }));
      const pageResponse = await dispatch(handleFinancialMovementPage(pageRequestData));
      const newNextCursor = pageResponse?.nextCursor ?? null;
      setPageCursors([null, newNextCursor]);
      setIsLoading(false);
    } catch {
      dispatch(
        showMessage({
          message: "Erro na busca, verifique os campos e tente novamente.",
        }),
      );
      setIsLoading(false);
    }
  };

  const submitPage = async (data, pageIndex, pageSize) => {
    setIsLoading(true);
    const pageRequestData = buildRequestData(data, pageIndex, pageSize, { includePagination: true });

    const cursor = pageCursors[pageIndex] ?? null;
    if (pageIndex > 0 && !cursor) {
      dispatch(
        showMessage({
          message: "Cursor inválido para a página solicitada. Refaça a busca.",
        }),
      );
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
      const newNextCursor = pageResponse?.nextCursor ?? null;
      setPageCursors((prev) => {
        const updated = [...prev];
        updated[pageIndex + 1] = newNextCursor;
        return updated;
      });
      setPage(pageIndex);
      setIsLoading(false);
    } catch {
      dispatch(
        showMessage({
          message: "Erro na busca, verifique os campos e tente novamente.",
        }),
      );
      setIsLoading(false);
    }
  };

  const onSubmit = (data) => {
    setHasSearched(true);
    setPage(0);
    setPageCursors([null]);
    submitReport(data, 0, rowsPerPage);
  };

  const handleClear = () => {
    dispatch(setReportList([]));
    setValue("name", []);
    setValue("dateRange", []);
    setValue("valorMax", "");
    setValue("valorMin", "");
    setValue("consorcioName", []);
    setValue("status", []);
    setValue("erroStatus", []);
    setSelectedErroStatus([]);
    setShowErroStatus(false);
    setWhichStatus([]);
    setPage(0);
    setHasSearched(false);
    setPageCursors([null]);

    for (const button of document.querySelectorAll(
      ".MuiAutocomplete-clearIndicator",
    )) {
      button.click();
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    dispatch(getUser());
    setLoadingUsers(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle AutoComplete
  useEffect(() => {
    if (userList && userList.length > 0) {
      const options = userList.map((user) => ({
        label: user.label,
        value: {
          cpfCnpj: user.cpfCnpj,
          permitCode: user.permitCode,

          fullName: user.fullName,
          userId: user.id,
        },
      }));
      const sortedOptions = options.sort((a, b) => {
        return a.value.fullName.localeCompare(b.value.fullName);
      });

      setUserOptions([
        { label: "Todos", value: { fullName: "Todos" } },
        ...sortedOptions,
      ]);
    } else {
      setUserOptions([]);
    }
  }, [userList]);

  const handleAutocompleteChange = (field, newValue) => {
    if (field === "status") {
      const status = newValue.map((i) => i.label);
      setWhichStatus(status);

      const hasErro = status.includes("Pendência de Pagamento");
      setShowErroStatus(hasErro);

      if (!hasErro) {
        setSelectedErroStatus([]);
        setValue("erroStatus", []);
      }
    }

    if (field === "especificos") {
      const especificosSelecionados = newValue.map((i) => i.label);
      setSelectedEspecificos(especificosSelecionados);
    }

    setValue(
      field,
      newValue ? newValue.map((item) => item.value ?? item.label) : [],
    );
  };

  const handleChangePage = (_event, newPage) => {
    if (!hasSearched) return;
    submitPage(getValues(), newPage, rowsPerPage);
  };

  const handleChangeRowsPerPage = (event) => {
    const newRowsPerPage = Number.parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
    setPageCursors([null]);
    if (!hasSearched) return;
    submitPage(getValues(), 0, newRowsPerPage);
  };


  const valueProps = {
    startAdornment: <InputAdornment position="start">R$</InputAdornment>,
  };

  const formatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  const toNumber = (value) => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value !== "string") return 0;

    const trimmed = value.trim();
    if (!trimmed) return 0;

    const cleaned = trimmed.replace(/\s/g, "").replace(/^R\$\s?/, "");
    const hasComma = cleaned.includes(",");
    const hasDot = cleaned.includes(".");

    if (hasComma && hasDot) {
      const normalized = cleaned.replace(/\./g, "").replace(",", ".");
      const parsed = Number.parseFloat(normalized);
      return Number.isFinite(parsed) ? parsed : 0;
    }

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
  };
  const formatCurrency = (value) => formatter.format(toNumber(value));

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = async (option) => {
    setAnchorEl(null);
    if (!option) {
      return;
    }

    setIsExporting(true);

    try {
      const exportRequestData = buildRequestData(getValues(), page, rowsPerPage, { includePagination: false });
      const response = await dispatch(handleFinancialMovementExport({
        ...exportRequestData,
        format: option,
      }));

      dispatch(
        showMessage({
          message: response?.message || "Your report is being generated and will be sent to your email.",
        }),
      );
    } catch {
      dispatch(
        showMessage({
          message: "Erro ao solicitar exportação. Tente novamente.",
        }),
      );
    } finally {
      setIsExporting(false);
    }
  };

  const clearSelect = (button) => {
    setValue(button, "");
    setShowButton(false);
  };

  const isConsorcio = (report, type) => {
    const cnpjsConsorcio = [
      '12464539000180',
      '12464869000176',
      '12464577000133',
      '44520687000161',
      '18201378000119',
      '12464553000184'
    ];


    if (cnpjsConsorcio.includes(report?.cpfCnpj)) {
      return '';
    } else {
      return type;
    }
  };


  const handleSelection = (field, newValue) => {
    setSelected(newValue.length > 0 ? field : null);
    if (field === 'consorcioName') {
      setSelectedConsorcios(newValue);
    }
    handleAutocompleteChange(field, newValue);
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
        return "bg-gray-400 text-black";
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
          <header>Filtros de Pesquisa</header>

          <Box className="flex items-center py-10 gap-10">
            <form onSubmit={handleSubmit(onSubmit)}>
              <Box className="flex gap-10 flex-wrap mb-20">
                <Autocomplete
                  id="favorecidos"
                  multiple
                  className="w-[25rem] md:min-w-[25rem] md:w-auto p-1"
                  getOptionLabel={(option) => option.value.fullName}
                  filterSelectedOptions
                  options={userOptions}
                  filterOptions={(options, state) =>
                    options.filter(
                      (option) =>
                        option.value?.cpfCnpj?.includes(state.inputValue) ||
                        option.value?.permitCode?.includes(state.inputValue) ||
                        option.value?.fullName
                          ?.toLowerCase()
                          .includes(state.inputValue.toLowerCase()),
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
                            {loadingUsers ? (
                              <CircularProgress color="inherit" size={20} />
                            ) : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />

                <Autocomplete
                  id="consorcio"
                  multiple
                  className="w-[25rem] md:min-w-[25rem] md:w-auto p-1"
                  getOptionLabel={(option) => option.label}
                  filterSelectedOptions
                  options={consorcios}
                  value={selectedConsorcios}
                  getOptionDisabled={(option) => option.disabled}
                  isOptionEqualToValue={(option, value) => option.value === value.value}
                  onChange={(_, newValue) => handleSelection("consorcioName", newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Selecionar Consórcios | Modais"
                      variant="outlined"
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: <>{params.InputProps.endAdornment}</>,
                      }}
                    />
                  )}
                />
                <Autocomplete
                  id="especificos"
                  multiple
                  className="w-[25rem] md:min-w-[25rem] md:w-auto p-1"
                  options={especificos}
                  getOptionLabel={(option) => option.label}
                  filterSelectedOptions
                  onChange={(_, newValue) =>
                    handleAutocompleteChange("especificos", newValue)
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Selecionar Específicos"
                      variant="outlined"
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              </Box>

              <Box className="flex items-center gap-10 flex-wrap">

                <Autocomplete
                  id="status"
                  multiple
                  className="w-[25rem] md:min-w-[25rem] md:w-auto p-1"
                  getOptionLabel={(option) => option.label}
                  filterSelectedOptions
                  options={consorciosStatusBase}
                  onChange={(_, newValue) =>
                    handleAutocompleteChange("status", newValue)
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Selecionar Status"
                      variant="outlined"
                    />
                  )}
                />

                {showErroStatus && (
                  <Autocomplete
                    id="erroStatus"
                    multiple
                    className="w-[25rem] md:min-w-[25rem] md:w-auto p-1"
                    options={erroStatus}
                    getOptionLabel={(option) => option.label}
                    filterSelectedOptions
                    value={selectedErroStatus}
                    onChange={(_, newValue) => {
                      const normalizedValue = normalizeErroStatusSelection(newValue);
                      setSelectedErroStatus(normalizedValue);
                      setValue(
                        "erroStatus",
                        normalizedValue.map((option) => option.label),
                      );
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Motivos"
                        variant="outlined"
                      />
                    )}
                  />
                )}
                <Box>
                  <Controller
                    name="dateRange"
                    control={control}
                    render={({ field }) => (
                      <DateRangePicker
                        {...field}
                        id="custom-date-input"
                        showOneCalendar
                        showHeader={false}
                        placement="auto"
                        placeholder="Selecionar Data"
                        format="dd/MM/yy"
                        character=" - "
                        className="custom-date-range-picker"
                        shouldDisableDate={DateRangePicker.allowedRange(
                          minSelectableDate
                        )}
                      />
                    )}
                  />
                  <br />
                </Box>
              </Box>
              <Box className="flex items-center my-[3.5rem] gap-10 flex-wrap">
                <Controller
                  name="valorMin"
                  control={control}
                  rules={{
                    validate: (value) => {
                      if (!value) return true;

                      const valorMin = Number.parseFloat(value.replace(/\./g, '').replace(',', '.'))
                      const valorMax = Number.parseFloat(getValues("valorMax").replace(/\./g, '').replace(',', '.'));

                      return (
                        valorMin <= valorMax ||
                        "Valor Mínimo não pode ser maior que o Valor Máximo"
                      );
                    },
                  }}
                  render={({ field, fieldState: { error } }) => (
                    <NumericFormat
                      {...field}
                      thousandSeparator="."
                      decimalSeparator=","
                      fixedDecimalScale
                      decimalScale={2}
                      customInput={TextField}
                      label="Valor Mínimo"
                      value={field.value}
                      onChange={(e) => {
                        field.onChange(e);

                        const valorMin = Number.parseFloat(e?.target.value.replace(/\./g, '').replace(',', '.'))
                        const valorMax = Number.parseFloat(getValues("valorMax").replace(/\./g, '').replace(',', '.'));

                        if (valorMin <= valorMax) {
                          clearErrors("valorMin");
                          clearErrors("valorMax");
                        } else {
                          trigger("valorMax");
                        }
                      }}
                      error={!!error}
                      helperText={error ? error.message : null}
                      onMouseEnter={() => {
                        if (field.value) setShowClearMin(true);
                      }}
                      onMouseLeave={() => setShowClearMin(false)}
                      FormHelperTextProps={{
                        sx: {
                          color: "red",
                          fontSize: "1rem",
                          position: "absolute",
                          bottom: "-3.5rem",
                        },
                      }}
                      InputProps={{
                        endAdornment: showClearMin && field.value && (
                          <InputAdornment
                            sx={{ position: "absolute", right: "1rem" }}
                            position="end"
                          >
                            <IconButton
                              onClick={() => clearSelect("valorMin")}
                              sx={{ height: "2rem", width: "2rem" }}
                            >
                              <ClearIcon sx={{ height: "2rem" }} />
                            </IconButton>
                          </InputAdornment>
                        ),
                        ...valueProps,
                      }}
                    />
                  )}
                />
                <Controller
                  name="valorMax"
                  control={control}
                  rules={{
                    validate: (value) => {
                      if (!value) return true;

                      const valorMax = Number.parseFloat(value.replace(/\./g, '').replace(',', '.'));
                      const valorMin = Number.parseFloat(getValues("valorMin").replace(/\./g, '').replace(',', '.'));

                      return (
                        valorMax >= valorMin ||
                        "Valor Máximo não pode ser menor que o Valor Mínimo"
                      );
                    },
                  }}
                  render={({ field, fieldState: { error } }) => (
                    <NumericFormat
                      {...field}
                      thousandSeparator="."
                      decimalSeparator=","
                      fixedDecimalScale
                      decimalScale={2}
                      customInput={TextField}
                      label="Valor Máximo"
                      value={field.value}
                      onChange={(e) => {
                        field.onChange(e)

                        const valorMax = Number.parseFloat(
                          e.target.value.replace(/\./g, '').replace(',', '.')
                        );
                        const valorMin = Number.parseFloat(
                          getValues("valorMin").replace(/\./g, '').replace(',', '.')
                        );

                        if (valorMax >= valorMin) {
                          clearErrors("valorMax");
                          clearErrors("valorMin");
                        } else {
                          trigger("valorMin");
                        }
                      }}
                      onMouseEnter={() => {
                        if (field.value) setShowClearMax(true);
                      }}
                      onMouseLeave={() => setShowClearMax(false)}
                      error={!!error}
                      helperText={error ? error.message : null}
                      FormHelperTextProps={{
                        sx: {
                          color: "red",
                          fontSize: "1rem",
                          position: "absolute",
                          bottom: "-3.5rem",
                        },
                      }}
                      InputProps={{
                        endAdornment: showClearMax && field.value && (
                          <InputAdornment
                            sx={{ position: "absolute", right: "1rem" }}
                            position="end"
                          >
                            <IconButton
                              onClick={() => clearSelect("valorMax")}
                              sx={{ height: "2rem", width: "2rem" }}
                            >
                              <ClearIcon sx={{ height: "2rem" }} />
                            </IconButton>
                          </InputAdornment>
                        ),

                        ...valueProps,
                      }}
                    />
                  )}
                />
              </Box>

              <Box />
              {whichStatusShow.includes("A pagar") && (
                <span className="text-sm text-red-600">
                  Atenção: Para o status "a pagar", a data escolhida deve ser
                  referente a Data Ordem de Pagamento (sexta a quinta-feira).
                </span>
              )}
              <Box>
                <Button
                  variant="contained"
                  color="secondary"
                  className=" w-35% mt-16 z-10"
                  aria-label="Pesquisar"
                  type="submit"
                  size="medium"
                >
                  Pesquisar
                </Button>
                <Button
                  variant="contained"
                  className=" w-35% mt-16 mx-10 z-10"
                  aria-label="Limpar Filtros"
                  type="button"
                  size="medium"
                  onClick={() => handleClear()}
                >
                  Limpar Filtros
                </Button>
              </Box>
            </form>
          </Box>
        </Box>
      </Paper>

      <Paper>
        <Box className="w-full md:mx-9 p-24 relative mt-32">
          <header className="flex justify-between items-center">
            <h3 className="font-semibold mb-24">
              Data Vigente: {format(new Date(), "dd/MM/yyyy")}
            </h3>

            <Button
              aria-controls="simple-menu"
              aria-haspopup="true"
              onClick={handleMenuClick}
              disabled={isExporting}
              style={{ marginTop: "20px" }}
            >
              <svg
                className="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium muiltr-hgpioi-MuiSvgIcon-root h-[2rem]"
                focusable="false"
                aria-hidden="true"
                viewBox="0 0 24 24"
                data-testid="SaveAltIcon"
              >
                <path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2z" />
              </svg>{" "}
              Exportar
            </Button>
            <Menu
              id="simple-menu"
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

          <div
            style={{ height: "50vh", width: "100%" }}
            className="overflow-scroll"
          >
            <Table size="small">
              <TableHead>
                <TableRow className="sticky top-0 bg-white z-10">
                  <TableCell className="font-semibold py-1 text-sm leading-none">Data Tentativa Pagamento</TableCell>
                  <TableCell className="font-semibold p-1 text-sm " style={{ whiteSpace: 'nowrap' }}>
                    Nome
                  </TableCell>
                  <TableCell className="font-semibold p-1 text-sm " style={{ maxWidth: 220 }}>Email</TableCell>
                  <TableCell className="font-semibold py-1 text-sm leading-none">Cód. Banco</TableCell>
                  <TableCell className="font-semibold p-1 text-sm ">Banco</TableCell>
                  <TableCell className="font-semibold p-1 text-sm ">CPF/CNPJ</TableCell>
                  <TableCell className="font-semibold py-1 text-sm leading-none">Consórcios | Modais</TableCell>
                  {
                    !showErroStatus && (
                      <TableCell className="font-semibold py-1 text-sm leading-none">Data Efetiva Pagamento</TableCell>
                    )
                  }
                  <TableCell className="font-semibold p-1 text-sm ">Valor</TableCell>
                  <TableCell className="font-semibold p-1 text-sm ">Status</TableCell>
                </TableRow>
              </TableHead>

              <TableBody className="overflow-scroll">
                {!isLoading ? (
                  reportList.count > 0 ? (
                    reportList.data?.map((report, index) => (
                      <TableRow key={index} className="hover:bg-gray-50">
                        <TableCell className="text-xs py-1">{report.dataReferencia}</TableCell>
                        <TableCell className="text-xs py-6 px-1 text-nowrap" style={{ whiteSpace: 'nowrap' }}>
                          {report.nomes}
                        </TableCell>
                        <TableCell className="text-xs py-6 px-1" style={{ maxWidth: 220, overflowWrap: 'break-word' }}>{isConsorcio(report, report.email)}</TableCell>
                        <TableCell className="text-xs py-1 ">{isConsorcio(report, report.codBanco)}</TableCell>
                        <TableCell
                          className="text-xs py-6 px-1"
                          style={{
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            maxWidth: 120,
                          }}
                        >
                          {isConsorcio(report, report.nomeBanco)}
                        </TableCell>
                        <TableCell className="text-xs py-6 px-1 " >
                          {report.cpfCnpj.replace(
                            /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
                            "$1.$2.$3/$4-$5"
                          )}
                        </TableCell>
                        <TableCell className="text-xs py-1 ">{report.consorcio}</TableCell>

                        {(!showErroStatus && (
                          <TableCell className="text-xs py-1 ">
                            {report.status === 'Pendencia Paga'
                              ? report.dataPagamento
                              : '-'}
                          </TableCell>
                        ))}
                        <TableCell className="text-xs py-6 px-1 ">
                          {formatCurrency(report.valor)}
                        </TableCell>
                        <TableCell className="text-xs py-6 px-1 ">
                          <span
                            className={`px-3 py-1 rounded-full text-xs ${getStatusStyles(
                              report.status === "Pendentes" ? "OP Atrasada" : report.status
                            )}`}
                          >
                            {report.status === "Pendentes" ? "OP Atrasada" : report.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        Não há dados para serem exibidos
                      </TableCell>
                    </TableRow>
                  )
                ) : (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Box className="flex justify-center items-center m-10">
                        <CircularProgress />
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>

              <TableFooter className="sticky bottom-0 bg-white z-10">
                <TableRow></TableRow>
                {((reportList.valorPago > 0 ||
                  reportList.valorEstornado > 0 ||
                  reportList.valorRejeitado > 0 ||
                  reportList.valorTotal > 0 ||
                  reportList.valorPendente > 0) || showErroStatus) && (
                    <TableRow>
                      <TableCell />
                      <TableCell
                        colSpan={7}
                        className="text-right font-bold text-black text-base pt-16"
                      >
                        {(() => {
                          const isErrorReport = showErroStatus;
                          const valorPago = toNumber(reportList.valorPago);
                          const valorEstornado = toNumber(reportList.valorEstornado);
                          const valorRejeitado = toNumber(reportList.valorRejeitado);
                          const valorAguardandoPagamento = toNumber(reportList.valorAguardandoPagamento);
                          const valorPendente = toNumber(reportList.valorPendente);
                          const totalPendenciaPagamento =
                            valorEstornado + valorRejeitado + valorPendente;
                          const totalGeral = toNumber(reportList.valorTotal);
                          const totalLabel = isErrorReport ? "Total Pendencia de Pagamento" : "Total Geral";
                          const totalValue = isErrorReport ? totalPendenciaPagamento : totalGeral;
                          const totals = [];

                          if (valorPago > 0) {
                            totals.push(`Total Pago: ${formatCurrency(valorPago)}`);
                          }

                          if (!showErroStatus && totalPendenciaPagamento > 0) {
                            totals.push(
                              `Total Pendencia de Pagamento: ${formatCurrency(totalPendenciaPagamento)}`,
                            );
                          }

                          if (showErroStatus) {
                            if (valorEstornado > 0) {
                              totals.push(`Total Estorno: ${formatCurrency(valorEstornado)}`);
                            }
                            if (valorRejeitado > 0) {
                              totals.push(`Total Rejeitado: ${formatCurrency(valorRejeitado)}`);
                            }
                          } else {
                            if (valorEstornado > 0) {
                              totals.push(`Total Estorno: ${formatCurrency(valorEstornado)}`);
                            }
                            if (valorRejeitado > 0) {
                              totals.push(`Total Rejeitado: ${formatCurrency(valorRejeitado)}`);
                            }
                          }

                          if (valorAguardandoPagamento > 0) {
                            totals.push(
                              `Total Aguardando Pagamento: ${formatCurrency(valorAguardandoPagamento)}`,
                            );
                          }

                          if (valorPendente > 0) {
                            totals.push(`Total OPs atrasadas: ${formatCurrency(valorPendente)}`);
                          }

                          if ((totalValue ?? 0) >= 0) {
                            totals.push(`${totalLabel}: ${formatCurrency(totalValue)}`);
                          }

                          return totals
                            .filter(Boolean)
                            .join("    |    ");
                        })()}
                      </TableCell>
                      <TableCell />
                      <TableCell />
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
