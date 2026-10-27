import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  MenuItem,
  Autocomplete,
  TextField,
  Button,
  Paper,
  CircularProgress,
  Menu,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
} from '@mui/material';
import { DataGrid, ptBR as pt } from '@mui/x-data-grid';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import { format } from 'date-fns';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { CSVLink } from 'react-csv';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { utils, writeFile as writeFileXLSX } from 'xlsx';

import { handleConsolidadoPage, fetchAgentConsolidatedReport, setReportList } from 'app/store/reportSlice';
import { showMessage } from 'app/store/fuse/messageSlice';
import {
  flattenAgentConsolidatedReportBlocks,
  getAgentConsolidatedReportTotal,
  normalizeAgentStatusSelection,
  normalizeSelectAllAutocompleteValue,
  shouldShowAgentNameFilter,
  shouldShowAssociationFilter,
} from 'app/store/agentConsolidatedReportUtils';
import { normalizeErroStatusSelection } from './reportUtils';
import { buildReportConsorcioOptions } from './consorcioOptions';
import ValorRangeFilter from './shared/ValorRangeFilter';
import ReportPeriodFilter from './shared/ReportPeriodFilter';
import useFavorecidoGuardadorOptions from './shared/useFavorecidoGuardadorOptions';
import { applyPendenciaDePagamentoErro, applyEspecificosFlags } from './shared/reportRequestUtils';
import { explodeStucGratuidadeRows } from './shared/StucGratuidadeTable';
import {
  STATUS_OPTIONS,
  ERRO_STATUS_OPTIONS,
  ESPECIFICOS_OPTIONS,
  MIN_SELECTABLE_DATE_GUARDADOR,
  MIN_SELECTABLE_DATE_PERMISSIONARIO,
} from './shared/reportFilterOptions';

const DEFAULT_PAGE_SIZE = 25;

// Status/erro-status do guardador usam um vocabulário próprio (valores diferentes dos
// labels de STATUS_OPTIONS/ERRO_STATUS_OPTIONS usados pelo permissionário) — herdado tal
// qual de AgentsConsolidatedReport.js pra não mudar o contrato com o backend.
const GUARDADOR_STATUS_OPTIONS = [
  { label: "A pagar", value: "A pagar" },
  { label: "Aguardando pagamento", value: "Em processamento" },
  { label: "Pago", value: "Pago" },
  { label: "Pendência de pagamento", value: "Erros" },
  { label: "Pendência paga", value: "Pendencia Paga" },
];

const GUARDADOR_ERRO_STATUS_OPTIONS = [
  { label: "Todos", value: "Todos" },
  { label: "Estorno", value: "Estorno" },
  { label: "Rejeitado", value: "Rejeitado" },
];

function getGuardadorStatusLabel(statusValue) {
  return GUARDADOR_STATUS_OPTIONS.find((option) => option.value === statusValue)?.label ?? statusValue;
}

function getFormattedReportFilename(dateRange, extension, prefix) {
  if (Array.isArray(dateRange) && dateRange[0] && dateRange[1]) {
    return `${prefix}_${format(dateRange[0], 'dd-MM-yyyy')}_${format(dateRange[1], 'dd-MM-yyyy')}.${extension}`;
  }
  return `${prefix}_${format(new Date(), 'dd-MM-yyyy')}.${extension}`;
}

/**
 * Relatório Consolidado — Permissionário e Guardador (ConsolidatedReport.js +
 * AgentsConsolidatedReport.js antes desta unificação) divergem mais que o par de
 * Movimentação Financeira: paginação server-side via redux (permissionário) vs busca única
 * agregada em memória (guardador), vocabulário de status diferente, e filtro "Específicos"
 * que só existe pro permissionário. Ainda assim, o shell (form, grid, export) e boa parte
 * das regras de erroStatus são os mesmos — unificados aqui atrás do prop `perfil`.
 */
export default function ConsolidatedReportPage({ perfil }) {
  const isGuardador = perfil === 'guardador';
  const dispatch = useDispatch();

  const reportList = useSelector((state) => state.report.reportList);

  const [isLoading, setIsLoading] = useState(false);
  const { loadingUsers, userOptions, agentOptions, associationOptions } = useFavorecidoGuardadorOptions(isGuardador, {
    loadErrorMessage: "Não foi possível carregar os filtros de guardador.",
  });
  const [selectedAgentOptions, setSelectedAgentOptions] = useState([]);
  const [selectedAssociationOptions, setSelectedAssociationOptions] = useState([]);
  const [selectedStatusOptions, setSelectedStatusOptions] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [whichStatusShow, setWhichStatus] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showErroStatus, setShowErroStatus] = useState(false);
  const [selectedConsorcios, setSelectedConsorcios] = useState([]);
  const [selectedFavorecidos, setSelectedFavorecidos] = useState([]);
  const [selectedErroStatus, setSelectedErroStatus] = useState([]);
  const [selectedEspecificos, setSelectedEspecificos] = useState([]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  // Guardador pagina em memória (agregação já vem inteira); esse par replica o mesmo page/pageSize
  // do Permissionário só pro TablePagination controlar o DataGrid do Guardador, que não bate no
  // servidor a cada página.
  const [guardadorPage, setGuardadorPage] = useState(0);
  const [guardadorPageSize, setGuardadorPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [hasSearched, setHasSearched] = useState(false);
  const [dateError, setDateError] = useState(false);
  const [reportBlocks, setReportBlocks] = useState([]); // só guardador (agregação em memória)

  const consorcios = buildReportConsorcioOptions({ selectedField: selected, includeGtu: true });

  const defaultValues = isGuardador
    ? { agentNames: [], associations: [], status: [], erroStatus: [], dateRange: [], valorMin: '', valorMax: '' }
    : { name: [], dateRange: [], valorMax: '', valorMin: '', consorcioName: [], especificos: [], status: [], erroStatus: [] };

  const { handleSubmit, setValue, control, getValues, trigger, clearErrors, reset } = useForm({ defaultValues });

  // Guardador e Permissionário têm datas mínimas diferentes: ao trocar o perfil, a data
  // selecionada no filtro de período (de/até) é limpa para evitar um intervalo inválido.
  useEffect(() => {
    setValue('dateRange', []);
    setDateError(false);
  }, [perfil, setValue]);

  const formatter = useMemo(() => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }), []);

  // ---- Dados agregados (guardador) ----
  const flattenedRows = useMemo(
    () => (isGuardador ? flattenAgentConsolidatedReportBlocks(reportBlocks) : []),
    [isGuardador, reportBlocks],
  );
  const guardadorDisplayRows = useMemo(() => {
    if (!isGuardador) return [];
    const allStatusBlock = reportBlocks.find((block) => block.rawStatus === "todos");
    if (allStatusBlock) {
      return [...allStatusBlock.data].sort((a, b) => a.nome.localeCompare(b.nome));
    }
    return [...flattenedRows]
      .map((row) => ({ nome: row.nome, valor: row.valor }))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [isGuardador, flattenedRows, reportBlocks]);
  const guardadorTotal = useMemo(
    () => (isGuardador ? getAgentConsolidatedReportTotal(reportBlocks) : 0),
    [isGuardador, reportBlocks],
  );
  const hasRows = isGuardador ? guardadorDisplayRows.length > 0 : (reportList.count ?? 0) > 0;

  // STUC - Gratuidade (ADR 0012, api-cct): cada dia da janela de pagamento (até 4 dias) vira a
  // sua própria linha na grade, repetindo Nome/CPF - "Data Ordem"/"Valor Ordem" são daquele dia
  // específico, "Valor Lançamento" é o total da janela (igual nas linhas repetidas). Só Permissionário.
  const showStucColumns = !isGuardador && selectedEspecificos.includes('STUC - Gratuidade');

  // ---- Grid rows/columns ----
  // STUC - Gratuidade: mesmo componente/função da Movimentação Financeira (FinancialMovementReport.js) -
  // ver shared/StucGratuidadeTable.js. Essa tela não usa DataGrid pra esse caso (tabela simples abaixo).
  const stucExplodedRows = showStucColumns
    ? explodeStucGratuidadeRows(reportList.data, {
        nome: (report) => report.nomefavorecido,
        cpfCnpj: (report) => report.cpfCnpj,
        valor: (report) => report.valor,
        dataPagamento: (report) => report.dataPagamento,
      })
    : [];

  const gridRows = isGuardador
    ? guardadorDisplayRows.map((row) => ({ id: row.nome, ...row }))
    : (Array.isArray(reportList.data) ? reportList.data.map((report) => ({ id: report.nomefavorecido, ...report })) : []);

  const gridColumns = isGuardador
    ? [
        { field: 'nome', headerName: 'Nome', flex: 1, minWidth: 260 },
        { field: 'valor', headerName: 'Valor Total', width: 180, valueFormatter: (params) => formatter.format(params.value ?? 0) },
      ]
    : [
        { field: 'nomefavorecido', headerName: 'Nome', flex: 1, minWidth: 260 },
        { field: 'valor', headerName: 'Valor Total', width: 180, valueFormatter: (params) => formatter.format(params.value ?? 0) },
      ];

  const totalValue = isGuardador ? guardadorTotal : (reportList.valor ?? 0);

  // ---- Export CSV ----
  const currentDateRange = getValues('dateRange');
  const csvFilenamePrefix = isGuardador ? 'relatorio_agentes' : 'relatorio';
  const csvFilename = useMemo(
    () => getFormattedReportFilename(currentDateRange, 'csv', csvFilenamePrefix),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentDateRange],
  );

  const selectedStatusForExport = getValues('status') || [];
  const selectedStatusLabelForExport = isGuardador
    ? selectedStatusForExport.map(getGuardadorStatusLabel).join(',')
    : selectedStatusForExport.join(',');

  const csvData = useMemo(() => {
    if (!hasRows) return [];
    if (isGuardador) {
      return guardadorDisplayRows.map((row) => ({ Nome: row.nome, Valor: formatter.format(row.valor) }));
    }
    if (showStucColumns) {
      const rows = stucExplodedRows.map((row) => ({
        Nome: row.nomefavorecido,
        CPF: row.cpfCnpj ?? '',
        "Data Ordem": row.dataOrdem ?? '',
        "Valor Ordem": row.valorOrdem != null ? formatter.format(row.valorOrdem) : '',
        "Valor Lançamento": formatter.format(row.valorLancamento ?? 0),
      }));
      return [
        { Nome: "Status selecionado", CPF: "", "Data Ordem": "", "Valor Ordem": "", "Valor Lançamento": selectedStatusLabelForExport || "Todos" },
        ...rows,
        { Nome: "Valor Total", CPF: "", "Data Ordem": "", "Valor Ordem": "", "Valor Lançamento": formatter.format(reportList?.valor) },
      ];
    }
    const rows = reportList.data?.map((report) => ({
      Nome: report.nomefavorecido,
      Valor: formatter.format(report.valor),
      Status: "",
    })) ?? [];
    return [
      { Nome: "Status selecionado", Valor: "", Status: selectedStatusLabelForExport || "Todos" },
      ...rows,
      { Nome: "Valor Total", Valor: "", Status: formatter.format(reportList?.valor) },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasRows, isGuardador, guardadorDisplayRows, reportList, formatter, showStucColumns, stucExplodedRows]);

  const exportPDF = () => {
    if (!hasRows) return;
    const doc = new jsPDF({ orientation: "landscape" });
    const selectedDateRange = getValues('dateRange');
    const dateInicio = selectedDateRange?.[0];
    const dateFim = selectedDateRange?.[1];
    const rows = isGuardador
      ? guardadorDisplayRows.map((row) => [row.nome, formatter.format(row.valor)])
      : showStucColumns
        ? stucExplodedRows.map((row) => [
            row.nomefavorecido,
            row.cpfCnpj ?? '',
            row.dataOrdem ?? '',
            row.valorOrdem != null ? formatter.format(row.valorOrdem) : '',
            formatter.format(row.valorLancamento ?? 0),
          ])
        : reportList.data.map((report) => [report.nomefavorecido, formatter.format(report.valor)]);
    const head = isGuardador
      ? ["Nome", "Valor Total"]
      : showStucColumns
        ? ["Nome", "CPF", "Data Ordem", "Valor Ordem", "Valor Lançamento"]
        : ["Nome", "Valor Total"];

    doc.autoTable({
      head: [head],
      body: rows,
      margin: { left: 14, right: 14, top: 60 },
      startY: 60,
      didDrawPage: () => {
        if (!isGuardador) {
          const logoImg = 'assets/icons/logoPrefeitura.png';
          doc.addImage(logoImg, 'PNG', 14, 10, 30, 15);
          doc.setLineWidth(0.3);
          doc.line(14, 30, 196, 30);
        }
        doc.setFontSize(10);
        if (dateInicio && dateFim) {
          doc.text(`Relatório dos dias: ${format(dateInicio, 'dd/MM/yyyy')} a ${format(dateFim, 'dd/MM/yyyy')}`, 14, 45);
        }
        doc.text(`Status observado: ${selectedStatusLabelForExport || 'Todos'}`, 14, 50);
      },
    });

    if (!isGuardador) {
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        const currentPage = doc.internal.getCurrentPageInfo().pageNumber;
        doc.text(`Página ${currentPage} de ${pageCount}`, 14, doc.internal.pageSize.height - 5);
      }
    }

    doc.setFontSize(10);
    doc.text(`Valor total: ${formatter.format(totalValue ?? 0)}`, 14, doc.internal.pageSize.height - 10);
    doc.save(getFormattedReportFilename(selectedDateRange, 'pdf', csvFilenamePrefix));
  };

  const exportXLSX = () => {
    if (!hasRows) return;
    const selectedDateRange = getValues('dateRange');
    const rows = isGuardador
      ? guardadorDisplayRows.map((row) => [row.nome, formatter.format(row.valor)])
      : showStucColumns
        ? stucExplodedRows.map((row) => [
            row.nomefavorecido,
            row.cpfCnpj ?? '',
            row.dataOrdem ?? '',
            row.valorOrdem != null ? formatter.format(row.valorOrdem) : '',
            formatter.format(row.valorLancamento ?? 0),
          ])
        : reportList.data.map((report) => [report.nomefavorecido, formatter.format(report.valor)]);
    const totalLabel = isGuardador ? "Total geral" : "Valor Total";
    const header = isGuardador
      ? ["Nome", "Valor"]
      : showStucColumns
        ? ["Nome", "CPF", "Data Ordem", "Valor Ordem", "Valor Lançamento"]
        : ["Nome", "Valor"];

    const sheetData = [
      ["Status selecionado", "", selectedStatusLabelForExport || "Todos"],
      header,
      ...rows,
      [totalLabel, "", formatter.format(totalValue ?? 0)],
    ];

    // sheetData é sempre array de arrays (não de objetos) nos dois perfis - json_to_sheet
    // tratava o Permissionário como array de "objetos" com chaves numéricas (0,1,2), gerando
    // uma linha de cabeçalho bugada ("0"/"1"/"2") e empurrando os dados uma linha para baixo.
    const workbook = utils.book_new();
    const worksheet = utils.aoa_to_sheet(sheetData);
    utils.book_append_sheet(workbook, worksheet, isGuardador ? "Agentes" : undefined);
    writeFileXLSX(workbook, getFormattedReportFilename(selectedDateRange, 'xlsx', csvFilenamePrefix));
  };

  const handleMenuClose = (option) => {
    setAnchorEl(null);
    if (option === 'csv') {
      document.getElementById(isGuardador ? 'agents-report-csv-link' : 'csv-export-link')?.click();
    } else if (option === 'pdf') {
      exportPDF();
    } else if (option === 'xlsx') {
      exportXLSX();
    }
  };

  // ---- Filtros ----
  const handleAutocompleteChange = (field, newValue) => {
    if (isGuardador) {
      const normalizedValue = field === "status" ? normalizeAgentStatusSelection(newValue) : normalizeSelectAllAutocompleteValue(newValue);

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
        const selectedStatusValues = normalizedValue.map((option) => option.value);
        const hasErro = selectedStatusValues.includes("Erros");
        setShowErroStatus(hasErro);
        if (!hasErro) {
          setSelectedErroStatus([]);
          setValue("erroStatus", []);
        }
      }

      setValue(field, normalizedValue.map((option) => option.value));
      return;
    }

    if (field === 'status') {
      // Pendência Paga tem regra de data diferente (data de pagamento, dia único) dos demais
      // status (data de vencimento, intervalo). Por isso não pode ser combinada com eles.
      const hasPendenciaPaga = newValue.some((i) => i.label === 'Pendencia Paga');
      if (hasPendenciaPaga && newValue.length > 1) {
        newValue = newValue.filter((i) => i.label === 'Pendencia Paga');
        dispatch(showMessage({ message: 'Pendência Paga não pode ser combinada com outros status; os demais foram removidos.' }));
      }
      setSelectedStatusOptions(newValue);

      const status = newValue.map((i) => i.label);
      setWhichStatus(status);
      if (status.includes?.('Pendência de Pagamento')) {
        setShowErroStatus(true);
      } else {
        setShowErroStatus(false);
        setSelectedErroStatus([]);
        setValue("erroStatus", []);
      }
    }
    if (field === "especificos") {
      const especificos = newValue.map((i) => i.label);
      setSelectedEspecificos(especificos);
      // STUC - Gratuidade não tem conceito de "OPs atrasadas" (TD/ADR 0004); limpa a seleção
      // de motivo caso o usuário já tivesse marcado essa opção antes de escolher STUC.
      if (especificos.includes("STUC - Gratuidade") && selectedErroStatus.some((o) => o.label === "OPs atrasadas")) {
        const filtered = selectedErroStatus.filter((o) => o.label !== "OPs atrasadas");
        setSelectedErroStatus(filtered);
        setValue("erroStatus", filtered.map((option) => (isGuardador ? option.value : option.label)));
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

  const handleClear = () => {
    if (isGuardador) {
      reset(defaultValues);
      setSelectedAgentOptions([]);
      setSelectedAssociationOptions([]);
      setSelectedStatusOptions([]);
      setDateError(false);
      setReportBlocks([]);
      setGuardadorPage(0);
    } else {
      setValue('name', []);
      setSelectedStatusOptions([]);
      setValue('dateRange', []);
      setValue('valorMax', '');
      setValue('valorMin', '');
      setValue('consorcioName', []);
      setValue('status', []);
      setSelectedConsorcios([]);
      setSelectedFavorecidos([]);
      setSelectedEspecificos([]);
      document.querySelectorAll('.MuiAutocomplete-clearIndicator').forEach((button) => button.click());
    }

    setSelectedErroStatus([]);
    setShowErroStatus(false);
    setWhichStatus([]);
    setPage(0);
    setHasSearched(false);
    dispatch(setReportList([]));
  };

  // ---- Busca ----
  const buildRequestDataPermissionario = (data, pageIndex, currentPageSize) => {
    let requestData = { ...data };

    requestData = applyPendenciaDePagamentoErro(requestData, {
      whichStatusShow,
      selectedErroStatus,
      addPendentesOnTodos: true,
    });
    requestData = applyEspecificosFlags(requestData, data);

    requestData.page = pageIndex + 1;
    requestData.pageSize = currentPageSize;
    return requestData;
  };

  const submitPagePermissionario = (data, pageIndex, currentPageSize) => {
    if (whichStatusShow.includes("Pendência de Pagamento") && selectedErroStatus.length === 0) {
      dispatch(showMessage({ message: "Selecione um motivo para a Pendência de Pagamento." }));
      return;
    }

    setIsLoading(true);
    const requestData = buildRequestDataPermissionario(data, pageIndex, currentPageSize);

    dispatch(handleConsolidadoPage(requestData))
      .then(() => {
        setIsLoading(false);
        setPage(pageIndex);
      })
      .catch(() => {
        dispatch(showMessage({ message: 'Erro na busca, verifique os campos e tente novamente.' }));
        setIsLoading(false);
      });
  };

  const submitGuardador = async (data) => {
    if (
      !Array.isArray(data.dateRange) ||
      data.dateRange.length !== 2 ||
      !data.dateRange[0] ||
      !data.dateRange[1] ||
      data.dateRange[1] < data.dateRange[0]
    ) {
      setDateError(true);
      dispatch(showMessage({ message: "Selecione um intervalo de datas válido para gerar o relatório." }));
      return;
    }

    if (data.status.includes("Erros") && selectedErroStatus.length === 0) {
      dispatch(showMessage({ message: "Selecione um motivo para Pendência de pagamento." }));
      return;
    }

    setDateError(false);
    setIsLoading(true);
    setGuardadorPage(0);
    try {
      const responseBlocks = await dispatch(fetchAgentConsolidatedReport(data));
      setReportBlocks(responseBlocks);
      setHasSearched(true);
    } catch {
      setReportBlocks([]);
      dispatch(showMessage({ message: "Erro na busca do relatório de agentes. Verifique os filtros e tente novamente." }));
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = (data) => {
    setHasSearched(true);
    if (isGuardador) {
      submitGuardador(data);
    } else {
      submitPagePermissionario(data, 0, pageSize);
    }
  };

  // Permissionário (STUC e demais filtros) usa o mesmo TablePagination do Relatório
  // Movimentação Financeira (FinancialMovementReport.js) em vez da paginação embutida do
  // DataGrid, pra não divergir visualmente entre os dois relatórios nem entre os filtros deste
  // (a DataGrid continua sendo usada como grade, mas com o footer de paginação escondido -
  // ver `hideFooter` abaixo - e o paginationModel controlado por este mesmo page/pageSize).
  const handlePermissionarioChangePage = (_, newPage) => {
    if (!hasSearched) return;
    submitPagePermissionario(getValues(), newPage, pageSize);
  };
  const handlePermissionarioChangeRowsPerPage = (event) => {
    const newPageSize = parseInt(event.target.value, 10);
    setPageSize(newPageSize);
    if (!hasSearched) return;
    submitPagePermissionario(getValues(), 0, newPageSize);
  };

  // Guardador pagina em memória (fetchAgentConsolidatedReport já traz tudo) - aqui só fatia o
  // array já carregado, sem nova busca ao servidor.
  const handleGuardadorChangePage = (_, newPage) => setGuardadorPage(newPage);
  const handleGuardadorChangeRowsPerPage = (event) => {
    setGuardadorPageSize(parseInt(event.target.value, 10));
    setGuardadorPage(0);
  };

  return (
    <>
      <Paper>
        <Box className="w-full p-24 relative mt-32">
          <header className="mb-16">
            <h3 className="font-semibold text-lg">Filtros de Pesquisa</h3>
          </header>

          <form noValidate onSubmit={handleSubmit(onSubmit)}>
            {/* Linha 1: período + status + favorecido / consórcios / específicos (guardador: guardador / associações) */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <ReportPeriodFilter
                control={control}
                minDate={isGuardador ? MIN_SELECTABLE_DATE_GUARDADOR : MIN_SELECTABLE_DATE_PERMISSIONARIO}
                extraError={isGuardador && dateError}
                onChange={(value) => {
                  if (isGuardador && value?.[0] && value?.[1]) setDateError(false);
                }}
              />

              {(isGuardador || !selectedEspecificos.includes("Pendentes")) && (
                <Grid item xs={12} sm={6} md={4}>
                  <Autocomplete
                    id="status"
                    multiple
                    fullWidth
                    options={isGuardador ? GUARDADOR_STATUS_OPTIONS : STATUS_OPTIONS}
                    value={selectedStatusOptions}
                    getOptionLabel={(option) => option.label}
                    isOptionEqualToValue={isGuardador ? (option, value) => option.value === value.value : undefined}
                    filterSelectedOptions={!isGuardador}
                    onChange={(_, newValue) => handleAutocompleteChange('status', newValue)}
                    renderInput={(params) => <TextField {...params} label="Selecionar Status" variant="outlined" />}
                  />
                </Grid>
              )}

              {showErroStatus && (
                <Grid item xs={12} sm={6} md={4}>
                  <Autocomplete
                    id="erroStatus"
                    multiple
                    fullWidth
                    options={
                      isGuardador
                        ? GUARDADOR_ERRO_STATUS_OPTIONS
                        : selectedEspecificos.includes("STUC - Gratuidade")
                          ? ERRO_STATUS_OPTIONS.filter((o) => o.label !== "OPs atrasadas")
                          : ERRO_STATUS_OPTIONS
                    }
                    getOptionLabel={(option) => option.label}
                    isOptionEqualToValue={isGuardador ? (option, value) => option.value === value.value : undefined}
                    filterSelectedOptions={!isGuardador}
                    value={selectedErroStatus}
                    onChange={(_, newValue) => {
                      const normalizedValue = normalizeErroStatusSelection(newValue);
                      setSelectedErroStatus(normalizedValue);
                      setValue("erroStatus", normalizedValue.map((option) => (isGuardador ? option.value : option.label)));
                    }}
                    renderInput={(params) => <TextField {...params} label="Motivos" variant="outlined" />}
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
                        getOptionLabel={(option) => option.label}
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
                        getOptionLabel={(option) => option.label}
                        isOptionEqualToValue={(option, value) => option.value === value.value}
                        onChange={(_, newValue) => handleAutocompleteChange("associations", newValue)}
                        renderInput={(params) => (
                          <TextField {...params} label="Selecionar Associações" variant="outlined" />
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
                      onChange={(_, newValue) => handleSelection('name', newValue)}
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

                  {!selectedEspecificos.includes("Pendentes") && (
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
                        onChange={(_, newValue) => handleSelection('consorcioName', newValue)}
                        renderInput={(params) => <TextField {...params} label="Selecionar Consórcios" variant="outlined" />}
                      />
                    </Grid>
                  )}

                  <Grid item xs={12} sm={6} md={4}>
                    <Autocomplete
                      id="especificos"
                      multiple
                      fullWidth
                      options={ESPECIFICOS_OPTIONS}
                      getOptionLabel={(option) => option.label}
                      filterSelectedOptions
                      onChange={(_, newValue) => handleAutocompleteChange("especificos", newValue)}
                      renderInput={(params) => <TextField {...params} label="Selecionar Específicos" variant="outlined" />}
                    />
                  </Grid>
                </>
              )}

              <ValorRangeFilter control={control} getValues={getValues} trigger={trigger} clearErrors={clearErrors} />
            </Grid>

            {!isGuardador && whichStatusShow.includes("A pagar") && (
              <span className="text-sm text-red-600 block mt-16">
                Atenção: Para o status "a pagar", a data escolhida deve ser referente a Data Ordem de Pagamento (sexta a
                quinta-feira).
              </span>
            )}

            <Box className="mt-24">
              <Button variant="contained" color="secondary" className="mr-10" aria-label="Pesquisar" type="submit" size="medium">
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
          <header className="flex justify-between items-center">
            <h3 className="font-semibold mb-24">Data Vigente: {format(new Date(), 'dd/MM/yyyy')}</h3>

            <Button
              aria-controls="consolidated-report-export-menu"
              aria-haspopup="true"
              onClick={(event) => setAnchorEl(event.currentTarget)}
              style={{ marginTop: '20px' }}
              disabled={!hasRows}
              startIcon={<SaveAltIcon />}
            >
              Exportar
            </Button>
            <Menu
              id="consolidated-report-export-menu"
              anchorEl={anchorEl}
              keepMounted
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
            >
              <MenuItem onClick={() => handleMenuClose('csv')}>CSV</MenuItem>
              <MenuItem onClick={() => handleMenuClose('pdf')}>PDF</MenuItem>
              <MenuItem onClick={() => handleMenuClose('xlsx')}>XLSX</MenuItem>
            </Menu>

            <CSVLink
              id={isGuardador ? 'agents-report-csv-link' : 'csv-export-link'}
              data={csvData}
              filename={csvFilename}
              className="hidden"
            />
          </header>

          {showStucColumns ? (
            // STUC - Gratuidade no Consolidado: só Nome + Valor Lançamento, 1 linha por janela de
            // pagamento (reportList.data já vem pivotado por janela do backend - ver
            // pivotStucGratuidadeRows/findConsolidadoStucGratuidade - sem precisar explodir por dia
            // como stucExplodedRows faz para CPF/Data Ordem/Valor Ordem/Data Pagamento, que a
            // Movimentação Financeira ainda exibe).
            <>
            <TablePagination
              component="div"
              count={reportList?.count ?? 0}
              page={page}
              rowsPerPage={pageSize}
              onPageChange={handlePermissionarioChangePage}
              onRowsPerPageChange={handlePermissionarioChangeRowsPerPage}
              labelRowsPerPage="Linhas por página"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
              rowsPerPageOptions={[10, 25, 50, 100]}
            />
            <TableContainer sx={{ height: '60vh', width: '100%', overflowX: 'auto', overflowY: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow className="sticky top-0 bg-white z-10">
                    <TableCell className="font-semibold p-1 text-sm" style={{ whiteSpace: 'nowrap' }}>Nome</TableCell>
                    <TableCell className="font-semibold p-1 text-sm">Valor Lançamento</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {!isLoading ? (
                    (reportList.data?.length ?? 0) > 0 ? (
                      reportList.data.map((report, index) => (
                        <TableRow key={`${report.nomefavorecido}::${index}`} className="hover:bg-gray-50">
                          <TableCell className="text-xs py-6 px-1" style={{ whiteSpace: 'nowrap' }}>{report.nomefavorecido}</TableCell>
                          <TableCell className="text-xs py-6 px-1">{formatter.format(report.valor)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center py-4">
                          {!hasSearched ? 'Faça uma busca para visualizar os resultados' : 'Não há dados para serem exibidos'}
                        </TableCell>
                      </TableRow>
                    )
                  ) : (
                    <TableRow>
                      <TableCell colSpan={2}>
                        <Box className="flex justify-center items-center m-10">
                          <CircularProgress />
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            </>
          ) : (
            <>
            <TablePagination
              component="div"
              count={isGuardador ? guardadorDisplayRows.length : (reportList?.count ?? 0)}
              page={isGuardador ? guardadorPage : page}
              rowsPerPage={isGuardador ? guardadorPageSize : pageSize}
              onPageChange={isGuardador ? handleGuardadorChangePage : handlePermissionarioChangePage}
              onRowsPerPageChange={isGuardador ? handleGuardadorChangeRowsPerPage : handlePermissionarioChangeRowsPerPage}
              labelRowsPerPage="Linhas por página"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
              rowsPerPageOptions={[10, 25, 50, 100]}
            />
            <div style={{ height: '60vh', width: '100%' }}>
              <DataGrid
                localeText={{
                  ...pt.components.MuiDataGrid.defaultProps.localeText,
                  noRowsLabel: !isGuardador && !hasSearched
                    ? 'Faça uma busca para visualizar os resultados'
                    : 'Não há dados para serem exibidos',
                }}
                rows={gridRows}
                columns={gridColumns}
                loading={isLoading}
                disableRowSelectionOnClick
                hideFooter
                {...(isGuardador
                  ? { paginationModel: { page: guardadorPage, pageSize: guardadorPageSize }, onPaginationModelChange: ({ page: newPage, pageSize: newPageSize }) => { setGuardadorPage(newPage); setGuardadorPageSize(newPageSize); } }
                  : {
                      paginationMode: 'server',
                      rowCount: reportList.count ?? 0,
                      paginationModel: { page, pageSize },
                      onPaginationModelChange: ({ page: newPage, pageSize: newPageSize }) => {
                        if (!hasSearched) return;
                        setPageSize(newPageSize);
                        submitPagePermissionario(getValues(), newPage, newPageSize);
                      },
                    })}
              />
            </div>
            </>
          )}
          <Box className="flex justify-end mt-16">
            <span className="font-bold mr-8">Valor Total:</span>
            <span className="font-bold">{formatter.format(totalValue ?? 0)}</span>
          </Box>
        </Box>
      </Paper>
    </>
  );
}
