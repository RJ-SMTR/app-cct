import React, { useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
} from "@mui/material";
import { ClearIcon } from "@mui/x-date-pickers";
import { format } from "date-fns";
import { Controller, useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { DateRangePicker } from "rsuite";
import { NumericFormat } from "react-number-format";
import { CSVLink } from "react-csv";
import JsPDF from "jspdf";
import "jspdf-autotable";
import { utils, writeFile as writeFileXLSX } from "xlsx";

import { getAgentUsers } from "app/store/adminSlice";
import { showMessage } from "app/store/fuse/messageSlice";
import {
  fetchAgentConsolidatedReport,
  setReportList,
} from "app/store/reportSlice";
import {
  buildAgentAutocompleteOptions,
  buildAssociationAutocompleteOptions,
  flattenAgentConsolidatedReportBlocks,
  getAgentConsolidatedReportTotal,
  normalizeAgentStatusSelection,
  normalizeSelectAllAutocompleteValue,
} from "app/store/agentConsolidatedReportUtils";
import { normalizeErroStatusSelection } from "./reportUtils";

const minSelectableDate = new Date(2024, 3, 30);
const defaultValues = {
  agentNames: [],
  associations: [],
  status: [],
  erroStatus: [],
  dateRange: [],
  valorMin: "",
  valorMax: "",
};

const statusOptions = [
  { label: "Pago", value: "Pago" },
  { label: "Erros", value: "Erros" },
  { label: "A pagar", value: "A pagar" },
  { label: "Em processamento", value: "Em processamento" },
];

const erroStatusOptions = [
  { label: "Todos", value: "Todos" },
  { label: "Estorno", value: "Estorno" },
  { label: "Rejeitado", value: "Rejeitado" },
];

function getFormattedReportFilename(dateRange, extension) {
  if (Array.isArray(dateRange) && dateRange[0] && dateRange[1]) {
    return `relatorio_agentes_${format(dateRange[0], "dd-MM-yyyy")}_${format(
      dateRange[1],
      "dd-MM-yyyy"
    )}.${extension}`;
  }

  return `relatorio_agentes_${format(new Date(), "dd-MM-yyyy")}.${extension}`;
}

export default function AgentsConsolidatedReport() {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [reportBlocks, setReportBlocks] = useState([]);
  const [agentOptions, setAgentOptions] = useState([]);
  const [associationOptions, setAssociationOptions] = useState([]);
  const [selectedAgentOptions, setSelectedAgentOptions] = useState([]);
  const [selectedAssociationOptions, setSelectedAssociationOptions] = useState([]);
  const [selectedStatusOptions, setSelectedStatusOptions] = useState([]);
  const [selectedErroStatus, setSelectedErroStatus] = useState([]);
  const [showErroStatus, setShowErroStatus] = useState(false);
  const [showClearMin, setShowClearMin] = useState(false);
  const [showClearMax, setShowClearMax] = useState(false);
  const [dateError, setDateError] = useState(false);

  const {
    control,
    clearErrors,
    getValues,
    handleSubmit,
    reset,
    setValue,
    trigger,
  } = useForm({
    defaultValues,
  });

  const formatter = useMemo(
    () =>
      new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }),
    []
  );

  useEffect(() => {
    setLoadingFilters(true);

    dispatch(getAgentUsers())
      .then((agentUsers) => {
        const normalizedAgentUsers = Array.isArray(agentUsers) ? agentUsers : [];

        setAgentOptions(buildAgentAutocompleteOptions(normalizedAgentUsers));
        setAssociationOptions(
          buildAssociationAutocompleteOptions(normalizedAgentUsers)
        );
      })
      .catch(() => {
        setAgentOptions([]);
        setAssociationOptions([]);
        dispatch(
          showMessage({
            message: "Nao foi possivel carregar os filtros de guardador.",
          })
        );
      })
      .finally(() => {
        setLoadingFilters(false);
      });
  }, [dispatch]);

  const flattenedRows = useMemo(
    () => flattenAgentConsolidatedReportBlocks(reportBlocks),
    [reportBlocks]
  );
  const displayRows = useMemo(() => {
    const allStatusBlock = reportBlocks.find((block) => block.rawStatus === "todos");

    if (allStatusBlock) {
      return [...allStatusBlock.data].sort((firstRow, secondRow) =>
        firstRow.nome.localeCompare(secondRow.nome)
      );
    }

    return [...flattenedRows]
      .map((row) => ({
        nome: row.nome,
        valor: row.valor,
      }))
      .sort((firstRow, secondRow) => firstRow.nome.localeCompare(secondRow.nome));
  }, [flattenedRows, reportBlocks]);
  const totalValue = useMemo(
    () => getAgentConsolidatedReportTotal(reportBlocks),
    [reportBlocks]
  );
  const hasRows = displayRows.length > 0;
  let reportContent = (
    <div style={{ height: "50vh", width: "100%" }} className="overflow-scroll">
      <Table size="small">
        <TableHead className="items-center mb-4">
          <TableRow>
            <TableCell>Nome</TableCell>
            <TableCell>Valor</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell colSpan={2}>Nao ha dados para serem exibidos</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );

  const currentDateRange = getValues("dateRange");
  const csvFilename = useMemo(
    () => getFormattedReportFilename(currentDateRange, "csv"),
    [currentDateRange]
  );

  const csvData = useMemo(() => {
    if (!hasRows) {
      return [];
    }

    return displayRows.map((row) => ({
      Nome: row.nome,
      Valor: formatter.format(row.valor),
    }));
  }, [displayRows, formatter, hasRows]);

  const valueProps = {
    startAdornment: <InputAdornment position="start">R$</InputAdornment>,
  };

  const handleAutocompleteChange = (field, newValue) => {
    const normalizedValue =
      field === "status"
        ? normalizeAgentStatusSelection(newValue)
        : normalizeSelectAllAutocompleteValue(newValue);

    if (field === "agentNames") {
      setSelectedAgentOptions(normalizedValue);
    }

    if (field === "associations") {
      setSelectedAssociationOptions(normalizedValue);
    }

    if (field === "status") {
      setSelectedStatusOptions(normalizedValue);
      const selectedStatusValues = normalizedValue.map((option) => option.value);
      const hasErroStatus = selectedStatusValues.includes("Erros");

      setShowErroStatus(hasErroStatus);
      if (!hasErroStatus) {
        setSelectedErroStatus([]);
        setValue("erroStatus", []);
      }
    }

    setValue(
      field,
      normalizedValue.map((option) => option.value)
    );
  };

  const clearSelect = (field) => {
    setValue(field, "");
  };

  const handleClear = () => {
    reset(defaultValues);
    setSelectedAgentOptions([]);
    setSelectedAssociationOptions([]);
    setSelectedStatusOptions([]);
    setSelectedErroStatus([]);
    setShowErroStatus(false);
    setDateError(false);
    setReportBlocks([]);
    dispatch(setReportList([]));
  };

  const exportPDF = () => {
    if (!hasRows) {
      return;
    }

    const doc = new JsPDF({
      orientation: "landscape",
    });
    const selectedStatus = getValues("status");
    const selectedStatusLabel = selectedStatus.join(",");
    const tableRows = displayRows.map((row) => [
      row.nome,
      formatter.format(row.valor),
    ]);
    const selectedDateRange = getValues("dateRange");

    doc.autoTable({
      head: [["Nome", "Valor"]],
      body: tableRows,
      margin: { left: 14, right: 14, top: 60 },
      startY: 60,
      didDrawPage: () => {
        doc.setFontSize(10);
        if (selectedDateRange?.[0] && selectedDateRange?.[1]) {
          doc.text(
            `Relatorio dos dias: ${format(
              selectedDateRange[0],
              "dd/MM/yyyy"
            )} a ${format(selectedDateRange[1], "dd/MM/yyyy")}`,
            14,
            45
          );
        }

        doc.text(`Status observado: ${selectedStatusLabel || "Todos"}`, 14, 50);
      },
    });

    doc.setFontSize(10);
    doc.text(`Valor total: ${formatter.format(totalValue)}`, 14, doc.internal.pageSize.height - 10);

    doc.save(getFormattedReportFilename(selectedDateRange, "pdf"));
  };

  const exportXLSX = () => {
    if (!hasRows) {
      return;
    }

    const selectedDateRange = getValues("dateRange");
    const selectedStatus = getValues("status");
    const sheetData = [
      ["Status selecionado", "", selectedStatus.join(",") || "Todos"],
      ["Nome", "Valor"],
      ...displayRows.map((row) => [
        row.nome,
        formatter.format(row.valor),
      ]),
      ["Total geral", "", formatter.format(totalValue)],
    ];
    const workbook = utils.book_new();
    const worksheet = utils.aoa_to_sheet(sheetData);

    utils.book_append_sheet(workbook, worksheet, "Agentes");
    writeFileXLSX(
      workbook,
      getFormattedReportFilename(selectedDateRange, "xlsx")
    );
  };

  const handleMenuClose = (option) => {
    setAnchorEl(null);

    if (option === "csv") {
      document.getElementById("agents-report-csv-link")?.click();
    }

    if (option === "pdf") {
      exportPDF();
    }

    if (option === "xlsx") {
      exportXLSX();
    }
  };

  const onSubmit = async (data) => {
    if (
      !Array.isArray(data.dateRange) ||
      data.dateRange.length !== 2 ||
      !data.dateRange[0] ||
      !data.dateRange[1] ||
      data.dateRange[1] < data.dateRange[0]
    ) {
      setDateError(true);
      dispatch(
        showMessage({
          message: "Selecione um intervalo de datas valido para gerar o relatorio.",
        })
      );
      return;
    }

    if (data.status.includes("Erros") && selectedErroStatus.length === 0) {
      dispatch(
        showMessage({
          message: "Selecione um motivo para Erros.",
        })
      );
      return;
    }

    setDateError(false);
    setIsLoading(true);

    try {
      const responseBlocks = await dispatch(fetchAgentConsolidatedReport(data));

      setReportBlocks(responseBlocks);
    } catch (error) {
      setReportBlocks([]);
      dispatch(
        showMessage({
          message: "Erro na busca do relatorio de agentes. Verifique os filtros e tente novamente.",
        })
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    reportContent = (
      <Box className="flex justify-center items-center m-10">
        <CircularProgress />
      </Box>
    );
  } else if (reportBlocks.length > 0) {
    reportContent = (
      <div style={{ height: "50vh", width: "100%" }} className="overflow-scroll">
        <Table size="small">
          <TableHead className="items-center mb-4">
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Valor</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {displayRows.map((row) => (
              <TableRow key={`${row.nome}-${row.valor}`}>
                <TableCell>{row.nome}</TableCell>
                <TableCell>{formatter.format(row.valor)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <>
      <Paper>
        <Box className="w-full md:mx-9 p-24 relative mt-32">
          <header>Filtros de Pesquisa</header>

          <Box className="flex items-center py-10 gap-10">
            <form onSubmit={handleSubmit(onSubmit)} className="w-full">
              <Box className="flex gap-10 flex-wrap mb-20">
                <Autocomplete
                  id="agentNames"
                  multiple
                  className="w-[25rem] md:min-w-[25rem] md:w-auto p-1"
                  options={agentOptions}
                  value={selectedAgentOptions}
                  loading={loadingFilters}
                  getOptionLabel={(option) => option.label}
                  isOptionEqualToValue={(option, value) =>
                    option.value === value.value
                  }
                  onChange={(_, newValue) =>
                    handleAutocompleteChange("agentNames", newValue)
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Selecionar Guardador"
                      variant="outlined"
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loadingFilters ? (
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
                  id="associations"
                  multiple
                  className="w-[25rem] md:min-w-[25rem] md:w-auto p-1"
                  options={associationOptions}
                  value={selectedAssociationOptions}
                  loading={loadingFilters}
                  getOptionLabel={(option) => option.label}
                  isOptionEqualToValue={(option, value) =>
                    option.value === value.value
                  }
                  onChange={(_, newValue) =>
                    handleAutocompleteChange("associations", newValue)
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Selecionar Associacoes"
                      variant="outlined"
                    />
                  )}
                />

                <Autocomplete
                  id="status"
                  multiple
                  className="w-[25rem] md:min-w-[25rem] md:w-auto p-1"
                  options={statusOptions}
                  value={selectedStatusOptions}
                  getOptionLabel={(option) => option.label}
                  isOptionEqualToValue={(option, value) =>
                    option.value === value.value
                  }
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

                {showErroStatus ? (
                  <Autocomplete
                    id="erroStatus"
                    multiple
                    className="w-[25rem] md:min-w-[25rem] md:w-auto p-1"
                    options={erroStatusOptions}
                    value={selectedErroStatus}
                    getOptionLabel={(option) => option.label}
                    isOptionEqualToValue={(option, value) =>
                      option.value === value.value
                    }
                    onChange={(_, newValue) => {
                      const normalizedValue =
                        normalizeErroStatusSelection(newValue);

                      setSelectedErroStatus(normalizedValue);
                      setValue(
                        "erroStatus",
                        normalizedValue.map((option) => option.value)
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
                ) : null}
              </Box>

              <Box className="flex items-center gap-10 flex-wrap">
                <Box>
                  <Controller
                    name="dateRange"
                    control={control}
                    render={({ field }) => (
                      <DateRangePicker
                        {...field}
                        id="agentes-date-range-input"
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
                        onChange={(value) => {
                          field.onChange(value);
                          if (value?.[0] && value?.[1]) {
                            setDateError(false);
                          }
                        }}
                      />
                    )}
                  />
                  {dateError ? (
                    <span className="absolute text-xs text-red-600">
                      Campo data obrigatorio*
                    </span>
                  ) : null}
                </Box>

                <Controller
                  name="valorMin"
                  control={control}
                  rules={{
                    validate: (value) => {
                      if (!value) {
                        return true;
                      }

                      const maxValue = getValues("valorMax");
                      if (!maxValue) {
                        return true;
                      }

                      const minNumber = Number(
                        value.replace(/\./g, "").replace(",", ".")
                      );
                      const maxNumber = Number(
                        maxValue.replace(/\./g, "").replace(",", ".")
                      );

                      return (
                        minNumber <= maxNumber ||
                        "Valor Minimo nao pode ser maior que o Valor Maximo"
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
                      label="Valor Minimo"
                      value={field.value}
                      onChange={(event) => {
                        field.onChange(event);

                        if (getValues("valorMax")) {
                          trigger("valorMax");
                        }

                        clearErrors("valorMin");
                      }}
                      onMouseEnter={() => {
                        if (field.value) {
                          setShowClearMin(true);
                        }
                      }}
                      onMouseLeave={() => setShowClearMin(false)}
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
                        endAdornment:
                          showClearMin && field.value ? (
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
                          ) : null,
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
                      if (!value) {
                        return true;
                      }

                      const minValue = getValues("valorMin");
                      if (!minValue) {
                        return true;
                      }

                      const maxNumber = Number(
                        value.replace(/\./g, "").replace(",", ".")
                      );
                      const minNumber = Number(
                        minValue.replace(/\./g, "").replace(",", ".")
                      );

                      return (
                        maxNumber >= minNumber ||
                        "Valor Maximo nao pode ser menor que o Valor Minimo"
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
                      label="Valor Maximo"
                      value={field.value}
                      onChange={(event) => {
                        field.onChange(event);

                        if (getValues("valorMin")) {
                          trigger("valorMin");
                        }

                        clearErrors("valorMax");
                      }}
                      onMouseEnter={() => {
                        if (field.value) {
                          setShowClearMax(true);
                        }
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
                        endAdornment:
                          showClearMax && field.value ? (
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
                          ) : null,
                        ...valueProps,
                      }}
                    />
                  )}
                />
              </Box>

              <Box className="mt-24">
                <Button
                  variant="contained"
                  color="secondary"
                  className="w-35% mt-16 z-10"
                  aria-label="Pesquisar"
                  type="submit"
                  size="medium"
                >
                  Pesquisar
                </Button>
                <Button
                  variant="contained"
                  className="w-35% mt-16 mx-10 z-10"
                  aria-label="Limpar Filtros"
                  type="button"
                  size="medium"
                  onClick={handleClear}
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
              aria-controls="agentes-report-export-menu"
              aria-haspopup="true"
              onClick={(event) => setAnchorEl(event.currentTarget)}
              style={{ marginTop: "20px" }}
              disabled={!hasRows}
            >
              <svg
                className="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium muiltr-hgpioi-MuiSvgIcon-root h-[2rem]"
                focusable="false"
                aria-hidden="true"
                viewBox="0 0 24 24"
                data-testid="SaveAltIcon"
              >
                <path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2z" />
              </svg>
              Exportar
            </Button>
            <Menu
              id="agentes-report-export-menu"
              anchorEl={anchorEl}
              keepMounted
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
            >
              <MenuItem onClick={() => handleMenuClose("csv")}>CSV</MenuItem>
              <MenuItem onClick={() => handleMenuClose("pdf")}>PDF</MenuItem>
              <MenuItem onClick={() => handleMenuClose("xlsx")}>XLSX</MenuItem>
            </Menu>

            <CSVLink
              id="agents-report-csv-link"
              data={csvData}
              filename={csvFilename}
              className="hidden"
            />
          </header>

          {reportContent}

          <Box className="flex justify-end mt-16">
            <span className="font-bold mr-8">Valor Total:</span>
            <span className="font-bold">{formatter.format(totalValue)}</span>
          </Box>
        </Box>
      </Paper>
    </>
  );
}
