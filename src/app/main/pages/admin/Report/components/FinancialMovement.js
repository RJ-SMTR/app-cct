import React, { useEffect, useState, useMemo } from "react";
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
  TableFooter
} from "@mui/material";

import { format } from "date-fns";
import { useDispatch, useSelector } from "react-redux";
import { DateRangePicker } from "rsuite";
import { useForm, Controller } from "react-hook-form";

import { handleReportInfo, setReportList } from "app/store/reportSlice";

import { getUser } from "app/store/adminSlice";
import { NumericFormat } from "react-number-format";
import { CSVLink } from "react-csv";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { showMessage } from "app/store/fuse/messageSlice";
import { ClearIcon } from "@mui/x-date-pickers";
import { utils, writeFile as writeFileXLSX } from "xlsx";

export default function BasicEditingGrid() {
  const reportType = useSelector((state) => state.report.reportType);
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
  const [selectedErroStatus, setSelectedErroStatus] = useState(null);
  const [selectedConsorcios, setSelectedConsorcios] = useState([]);
  const [selectedEspecificos, setSelectedEspecificos] = useState([]);


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
      },
    });

  const onSubmit = (data) => {
    setIsLoading(true);

    const requestData = { ...data };

    if (whichStatusShow.includes("Pendência de Pagamento") && selectedErroStatus) {
      requestData.status = requestData.status.filter(status => status !== "Pendência de Pagamento");

      if (selectedErroStatus.label === "Todos") {
        requestData.status = [...requestData.status, "Erro", "Pendentes"];
        requestData.erro = true;
      } else if (selectedErroStatus.label === "Estorno") {
        requestData.status = [...requestData.status, "Estorno"];
        requestData.estorno = true;
      } else if (selectedErroStatus.label === "Rejeitado") {
        requestData.status = [...requestData.status, "Rejeitado"];
        requestData.rejeitado = true;
      } else if (selectedErroStatus.label === "OPs atrasadas") {
        requestData.status = [...requestData.status, "Pendentes"];
      }
    }


    if (data.especificos.includes("Eleição")) {
      requestData.eleicao = true
    }
    if (data.especificos.includes("Desativados")) {
      requestData.desativados = true
    }

    dispatch(handleReportInfo(requestData, reportType))
      .then((response) => {
        setIsLoading(false);
      })
      .catch((error) => {
        dispatch(
          showMessage({
            message: "Erro na busca, verifique os campos e tente novamente.",
          }),
        );
        setIsLoading(false);
      });

  };

  const handleClear = () => {
    dispatch(setReportList([]));
    setValue("name", []);
    setValue("dateRange", []);
    setValue("valorMax", "");
    setValue("valorMin", "");
    setValue("consorcioName", []);
    setValue("status", []);
    setValue("erroStatus", null);
    setSelectedErroStatus(null);
    setShowErroStatus(false);
    setWhichStatus([]);

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

  useEffect(() => {
    setIsLoading(false);
  }, [reportList]);

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
        setSelectedErroStatus(null);
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


  const valueProps = {
    startAdornment: <InputAdornment position="start">R$</InputAdornment>,
  };

  const formatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  // Export CSV
  const status = getValues("status");
  const whichStatus = status?.join(",");

  const reportListData =
    reportList.count > 0
      ? reportList.data?.map((report) => ({
        Data: report.dataPagamento,
        Nome: report.nomes,
        Email: report.email,
        'Cód Banco': report.codBanco,
        Banco: report.nomeBanco,
        'CPF/CNPJ': report.cpfCnpj,
        Consórcio: report.consorcio,
        Valor: formatter.format(report.valor),
        Status: report.status,
      }))
      : [];

  const valorPago = {
    Nome: "Total Pago",
    Valor: "",
    Status: reportList.valorPago > 0 ? formatter.format(reportList.valorPago) : "",
  };

  const valorEstornado = {
    Nome: "Total Estorno",
    Valor: "",
    Status: reportList.valorEstornado > 0 ? formatter.format(reportList.valorEstornado) : "",
  };

  const valorRejeitado = {
    Nome: "Total Rejeitado",
    Valor: "",
    Status: reportList.valorRejeitado > 0 ? formatter.format(reportList.valorRejeitado) : "",
  };

  const valorAguardandoPagamento = {
    Nome: "Total Aguardando Pagamento",
    Valor: "",
    Status: reportList.valorAguardandoPagamento > 0 ? formatter.format(reportList.valorAguardandoPagamento) : "",
  };

  const valorTotal = {
    Nome: "Valor Total",
    Valor: "",
    Status: formatter.format(reportList?.valor ?? 0),
  };




  const statusRow = {
    Nome: "Status selecionado",
    Valor: "",
    Status: whichStatus || "Todos",
  };

  const csvData = [
    statusRow,
    ...reportListData,
    ...(reportList.valorPago > 0 ? [valorPago] : []),
    ...(reportList.valorEstornado > 0 ? [valorEstornado] : []),
    ...(reportList.valorRejeitado > 0 ? [valorRejeitado] : []),
    ...(reportList.valorAguardandoPagamento > 0 ? [valorAguardandoPagamento] : []),
    valorTotal,
  ];
  let dateInicio;
  let dateFim;
  const selectedDate = getValues("dateRange");

  if (selectedDate !== null) {
    dateInicio = selectedDate[0];
    dateFim = selectedDate[1];
  }

  const csvFilename = useMemo(() => {
    if (dateInicio && dateFim) {
      return `relatorio_${format(dateInicio, "dd-MM-yyyy")}_${format(dateFim, "dd-MM-yyyy")}.csv`;
    }
    return `relatorio_${format(new Date(), "dd-MM-yyyy")}.csv`;
  }, [dateInicio, dateFim]);

  // Export PDF
  const exportPDF = () => {

    const truncateText = (text, maxLength) => {
      if (!text) return '';
      return text.length > maxLength ? text.slice(0, maxLength - 3) + "..." : text;
    };

    const doc = new jsPDF({
      orientation: "landscape",
    });
    const tableColumn = ["Data", "Nome", "Email", "Cod Banco", "Banco", "CPF/CNPJ", "Consórcio", "Valor", "Status"];
    const tableRows = [];

    for (const report of reportList.data) {
      const reportData = [
        report.dataPagamento,
        report.nomes,
        report.email,
        report.codBanco,
        truncateText(report.nomeBanco, 15),
        report.cpfCnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5'),
        report.consorcio,
        formatter.format(report.valor),
        report.status
      ];
      tableRows.push(reportData);
    }

    let dateInicio;
    let dateFim;
    const selectedDate = getValues("dateRange");
    if (selectedDate !== null) {
      dateInicio = selectedDate[0];
      dateFim = selectedDate[1];
    }

    const status = getValues("status");
    const selectedStatus = status.join(",");

    const logoImg = "assets/icons/logoPrefeitura.png";
    const logoH = 15;
    const logoW = 30;

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      margin: { left: 14, right: 14, top: 60 },
      styles: {
        fontSize: 6,
        cellPadding: 2,
      },
      columnStyles: {
        1: { cellWidth: 30 },
      },
      startY: 60,
      didDrawPage: () => {
        doc.addImage(logoImg, "PNG", 14, 10, logoW, logoH);

        const hrYPosition = 30;
        doc.setLineWidth(0.3);
        doc.line(14, hrYPosition, 196, hrYPosition);

        doc.setFontSize(10);
        doc.text(
          `Relatório dos dias: ${format(dateInicio, "dd/MM/yyyy")} a ${format(dateFim, "dd/MM/yyyy")}`,
          14,
          45,
        );
        doc.text(`Status observado: ${selectedStatus || "Todos"}`, 14, 50);
      },
    });

    const pageHeight = doc.internal.pageSize.height;
    const bottomMargin = 40;
    let yPosition = pageHeight - bottomMargin;

    doc.setFontSize(10);

    if (reportList.valorPago > 0) {
      doc.text(`Total Pago: ${formatter.format(reportList.valorPago)}`, 14, yPosition);
      yPosition += 5;
    }

    if (reportList.valorEstornado > 0) {
      doc.text(`Total Estorno: ${formatter.format(reportList.valorEstornado)}`, 14, yPosition);
      yPosition += 5;
    }

    if (reportList.valorRejeitado > 0) {
      doc.text(`Total Rejeitado: ${formatter.format(reportList.valorRejeitado)}`, 14, yPosition);
      yPosition += 5;
    }

    if (reportList.valorAguardandoPagamento > 0) {
      doc.text(`Total Aguardando Pagamento: ${formatter.format(reportList.valorAguardandoPagamento)}`, 14, yPosition);
      yPosition += 5;
    }

    doc.text(`Valor total: ${formatter.format(reportList.valor ?? 0)}`, 14, yPosition);

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      const currentPage = doc.internal.getCurrentPageInfo().pageNumber;
      const text = `Página ${currentPage} de ${pageCount}`;
      doc.text(text, 14, doc.internal.pageSize.height - 5);
    }

    doc.save(
      `relatorio_${format(dateInicio, "dd/MM/yyyy")}_${format(dateFim, "dd/MM/yyyy")}.pdf`,
    );
  };


  // Export XLSX
  const exportXLSX = () => {
    let dateInicio;
    let dateFim;
    const selectedDate = getValues("dateRange");

    if (selectedDate !== null) {
      dateInicio = selectedDate[0];
      dateFim = selectedDate[1];
    }
    const data = [
      ["Status selecionado", "", "", "", whichStatus || "Todos"],
      ["Data", "Nome", "Email", "Cod Banco", "Banco", "CPF/CNPJ", "Consórcio", "Valor", "Status"],
      ...reportList.data.map((report) => [
        report.dataPagamento,
        report.nomes,
        report.email,
        report.codBanco,
        report.nomeBanco,
        report.cpfCnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5'),
        report.consorcio,
        formatter.format(report.valor),
        report.status
      ]),
      ...(reportList.valorPago > 0
        ? [["Total Pago:", "", "", ` ${formatter.format(reportList.valorPago)}`, ""]]
        : []),
      ...(reportList.valorEstornado > 0
        ? [["Total Estorno:", "", "", ` ${formatter.format(reportList.valorEstornado)}`, ""]]
        : []),
      ...(reportList.valorRejeitado > 0
        ? [["Total Rejeitado:", "", "", ` ${formatter.format(reportList.valorRejeitado)}`, ""]]
        : []),
      ...(reportList.valorAguardandoPagamento > 0
        ? [["Total Aguardando Pagamento:", "", "", ` ${formatter.format(reportList.valorAguardandoPagamento)}`, ""]]
        : []),
      ["Valor Total", "", "", formatter.format(reportList.valor ?? 0), ""],
    ];

    const wb = utils.book_new();
    utils.book_append_sheet(wb, utils.json_to_sheet(data));
    writeFileXLSX(
      wb,
      `relatorio_${format(dateInicio, "dd/MM/yyyy")}_${format(dateFim, "dd/MM/yyyy")}.xlsx`,
    );
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = (option) => {
    setAnchorEl(null);
    if (option === "csv") {
      document.getElementById("csv-export-link").click();
    } else if (option === "pdf") {
      exportPDF();
    } else if (option === "xlsx") {
      exportXLSX();
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
                    className="w-[25rem] md:min-w-[25rem] md:w-auto p-1"
                    options={erroStatus}
                    getOptionLabel={(option) => option.label}
                    value={selectedErroStatus}
                    onChange={(_, newValue) => {
                      setSelectedErroStatus(newValue);
                      setValue("erroStatus", newValue ? newValue.label : null);
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

            <CSVLink
              id="csv-export-link"
              data={csvData}
              filename={csvFilename}
              className="hidden"
            />
          </header>

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
                  <TableCell className="font-semibold py-1 text-sm leading-none">Data Efetiva Pagamento</TableCell>
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
                        <TableCell className="text-xs py-1 ">{report.status == 'Pendencia Paga' ? report.dataPagamento : '-'}</TableCell>
                        <TableCell className="text-xs py-6 px-1 ">{formatter.format(report.valor)}</TableCell>
                        <TableCell className="text-xs py-6 px-1 ">
                          <span
                            className={`px-3 py-1 rounded-full text-xs ${getStatusStyles(
                              report.status === "Pendente" ? "OP Atrasada" : report.status
                            )}`}
                          >
                            {report.status === "Pendente" ? "OP Atrasada" : report.status}
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
                {(reportList.valorPago > 0 ||
                  reportList.valorEstornado > 0 ||
                  reportList.valorRejeitado > 0 ||
                  reportList.valor > 0 ||
                  reportList.valorPendente > 0) && (
                    <TableRow>
                      <TableCell />
                      <TableCell
                        colSpan={7}
                        className="text-right font-bold text-black text-base pt-16"
                      >
                        {(() => {
                          const totalGeral =
                            reportList.valorPendenciaPaga > 0
                              ? (reportList.valorRejeitado || 0) + (reportList.valorEstornado || 0)
                              : reportList.valor;

                          return [
                            reportList.valorPago > 0 &&
                            `Total Pago: ${formatter.format(reportList.valorPago)}`,
                            reportList.valorPendenciaPaga > 0 &&
                            `Total Pendencia Paga: ${formatter.format(
                              reportList.valorPendenciaPaga
                            )}`,
                            reportList.valorEstornado > 0 &&
                            `Total Estorno: ${formatter.format(reportList.valorEstornado)}`,
                            reportList.valorRejeitado > 0 &&
                            `Total Rejeitado: ${formatter.format(reportList.valorRejeitado)}`,
                            reportList.valorAguardandoPagamento > 0 &&
                            `Total Aguardando Pagamento: ${formatter.format(
                              reportList.valorAguardandoPagamento
                            )}`,
                            reportList.valorPendente > 0 &&
                            `Total Pendencia de Pagamento: ${formatter.format(reportList.valorPendente)}`,

                            (totalGeral ?? 0) >= 0 &&
                            `${reportList.valorPendenciaPaga > 0 ? "Saldo a Pagar" : "Total Geral"}: ${formatter.format(totalGeral)}`
                          ]
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
