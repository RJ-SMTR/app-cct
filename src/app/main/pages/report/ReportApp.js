import React, { useState } from "react";
import {
  Box,
  Table,
  TableHead,
  TableBody,
  Button,
  TableRow,
  TableCell,
  Paper,
  CircularProgress,
  TableFooter,
} from "@mui/material";

import { format } from "date-fns";
import { useDispatch, useSelector } from "react-redux";
import { DateRangePicker } from "rsuite";
import { useForm, Controller } from "react-hook-form";

import { handleFinancialMovementPage, handleFinancialMovementSummary, setReportList } from "app/store/reportSlice";
import { selectUser } from "app/store/userSlice";

import "jspdf-autotable";
import { showMessage } from "app/store/fuse/messageSlice";

export default function ReportVanzeiro() {
  const minSelectableDate = new Date(2024, 3, 30);
  const user = useSelector(selectUser);
  const reportList = useSelector((state) => state.report.reportList);
  const reportData = Array.isArray(reportList?.data)
    ? reportList.data
    : Array.isArray(reportList)
      ? reportList
      : [];
  const reportCount =
    Number.isFinite(reportList?.count) ? reportList.count : reportData.length;
  const [isLoading, setIsLoading] = useState(false);

  const allStatus = [
    "Pago",
    "Erro",
    "Aguardando Pagamento",
    "Estorno",
    "Rejeitado",
    "Pendencia Paga",
    "Pendentes",
    "A pagar",
  ];

  const dispatch = useDispatch();

  const { handleSubmit, setValue, control } =
    useForm({
      defaultValues: {
        dateRange: [],
      },
    });

  const normalizeStatus = (statusList = []) =>
    statusList.map((status) => (status === "A Pagar" ? "A pagar" : status));

  const normalizeEspecificos = (especificosList = []) =>
    especificosList.map((item) => (item === "Eleicao" ? "Eleição" : item));

  const buildRequestData = (data) => {
    const hasDateRange =
      Array.isArray(data?.dateRange) && data.dateRange.length === 2;
    const userId = user?.id;
    const fullName = user?.fullName ?? "";
    const providedStatus = Array.isArray(data?.status) ? data.status : [];
    const providedEspecificos = Array.isArray(data?.especificos) ? data.especificos : [];
    const status = providedStatus.length > 0
      ? normalizeStatus(providedStatus)
      : hasDateRange
        ? allStatus
        : [];
    const especificos = providedEspecificos.length > 0
      ? normalizeEspecificos(providedEspecificos)
      : ["Eleição"];
    const requestData = {
      consorcioName: [],
      name: userId ? [{ userId, fullName }] : [],
      status,
      dateRange: Array.isArray(data?.dateRange) ? data.dateRange : [],
      especificos,
      valorMax: "",
      valorMin: "",
    };

    return requestData;
  };

  const submitPage = async (data) => {
    setIsLoading(true);
    const summaryRequestData = buildRequestData(data);
    const pageRequestData = buildRequestData(data);
    pageRequestData.page = 1;
    pageRequestData.pageSize = 9999;

    try {
      await dispatch(handleFinancialMovementSummary(summaryRequestData, { resetData: true }));
      await dispatch(handleFinancialMovementPage(pageRequestData));
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
    submitPage(data);
  };

  const handleClear = () => {
    dispatch(setReportList([]));
    setValue("name", []);
    setValue("dateRange", []);
    setValue("valorMax", "");
    setValue("valorMin", "");
    setValue("consorcioName", []);
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
              <Box className="flex items-center gap-10 flex-wrap">
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
              <Box />
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

      <Paper className="mt-32">
        <Box className="w-full md:mx-9 p-24 relative mt-32">
          <header className="flex justify-between items-center">
            <h3 className="font-semibold mb-24">
              Data Vigente: {format(new Date(), "dd/MM/yyyy")}
            </h3>
          </header>
          <div
            style={{ height: "50vh", width: "100%" }}
            className="overflow-scroll"
          >
            <Table size="small">
              <TableHead>
                <TableRow className="sticky top-0 bg-white z-10">
                  <TableCell className="font-semibold py-1 text-sm leading-none">Data Tentativa Pagamento</TableCell>
                  <TableCell className="font-semibold py-1 text-sm leading-none">Data Efetiva Pagamento</TableCell>
                  <TableCell className="font-semibold p-1 text-sm ">Valor</TableCell>
                  <TableCell className="font-semibold p-1 text-sm ">Status</TableCell>
                </TableRow>
              </TableHead>

              <TableBody className="overflow-scroll">
                {!isLoading ? (
                  reportCount > 0 ? (
                    reportData.map((report, index) => (
                      <TableRow key={index} className="hover:bg-gray-50">
                        <TableCell className="text-xs py-1">{report.dataReferencia}</TableCell>
                        <TableCell className="text-xs py-1 ">
                          {report.status === 'Pendencia Paga'
                            ? report.dataPagamento
                            : '-'}
                        </TableCell>
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
                {(() => {
                  const summaryItems = [];
                  const valorPago = toNumber(reportList.valorPago);
                  const valorEstornado = toNumber(reportList.valorEstornado);
                  const valorRejeitado = toNumber(reportList.valorRejeitado);
                  const valorAguardandoPagamento = toNumber(reportList.valorAguardandoPagamento);
                  const valorAPagar = toNumber(reportList.valorAPagar);
                  const valorPendente = toNumber(reportList.valorPendente);
                  const valorPendenciaPaga = toNumber(reportList.valorPendenciaPaga);
                  const valorTotal = toNumber(reportList.valorTotal);

                  if (valorPago > 0) summaryItems.push(`Total Pago: ${formatCurrency(valorPago)}`);
                  if (valorEstornado > 0) summaryItems.push(`Total Estorno: ${formatCurrency(valorEstornado)}`);
                  if (valorRejeitado > 0) summaryItems.push(`Total Rejeitado: ${formatCurrency(valorRejeitado)}`);
                  if (valorAguardandoPagamento > 0) {
                    summaryItems.push(`Total Aguardando Pagamento: ${formatCurrency(valorAguardandoPagamento)}`);
                  }
                  if (valorAPagar > 0) summaryItems.push(`Total A Pagar: ${formatCurrency(valorAPagar)}`);
                  if (valorPendente > 0) summaryItems.push(`Total OPs atrasadas: ${formatCurrency(valorPendente)}`);
                  if (valorPendenciaPaga > 0) {
                    summaryItems.push(`Total Pendencia Paga: ${formatCurrency(valorPendenciaPaga)}`);
                  }
                  if (valorTotal > 0) summaryItems.push(`Total Geral: ${formatCurrency(valorTotal)}`);

                  if (summaryItems.length === 0) return null;

                  return (
                    <TableRow>
                      <TableCell />
                      <TableCell
                        colSpan={7}
                        className="text-right font-bold text-black text-base pt-16"
                      >
                        {summaryItems.join("    |    ")}
                      </TableCell>
                    </TableRow>
                  );
                })()}
              </TableFooter>
            </Table>
          </div>
        </Box>
      </Paper>
    </>
  );
}
