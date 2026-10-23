import React, { useEffect, useRef, useState } from 'react';
import {
  Backdrop,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { DataGrid, ptBR as pt } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import HistoryIcon from '@mui/icons-material/History';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import DescriptionIcon from '@mui/icons-material/Description';
import SendIcon from '@mui/icons-material/Send';
import RefreshIcon from '@mui/icons-material/Refresh';
import { NumericFormat } from 'react-number-format';
import { DateRangePicker } from 'rsuite';
import dayjs from 'dayjs';
import { useDispatch } from 'react-redux';
import { api } from 'app/configs/api/api';
import { showMessage } from 'app/store/fuse/messageSlice';
import formatDateOnly from '../../ordemPagamento/shared/formatDateOnly';

const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function authHeaders() {
  const token = window.localStorage.getItem('jwt_access_token');
  return { Authorization: `Bearer ${token}` };
}

// Posições (1-based, inclusive) dos campos de data e valor no CNAB 240 (layout Caixa/104
// usado pelo remessa.service) — usadas só pra destacar visualmente o preview, não afetam
// o conteúdo do arquivo gerado. Ver templates em api-cct/src/cnab/templates/cnab-240/104.
function getCnabHighlightRanges(line) {
  const ranges = [];
  const add = (posInicio, posFim) => ranges.push({ start: posInicio - 1, end: posFim });
  const tipoRegistro = line[7];

  if (tipoRegistro === '0') {
    add(144, 151); // dataGeracaoArquivo (Header Arquivo)
  } else if (tipoRegistro === '3') {
    const segmento = line[13];
    if (segmento === 'A') {
      add(120, 134); // valorLancamento
      add(163, 177); // valorRealEfetivado
    } else if (segmento === 'B') {
      add(136, 150); // valorDocumento
      add(151, 165); // valorAbatimento
      add(166, 180); // valorDesconto
      add(181, 195); // valorMora
      add(196, 210); // valorMulta
    }
  }

  return ranges.filter((range) => range.end <= line.length).sort((a, b) => a.start - b.start);
}

function renderCnabLineWithHighlights(line) {
  const ranges = getCnabHighlightRanges(line);
  if (ranges.length === 0) return line;

  const parts = [];
  let cursor = 0;
  ranges.forEach((range, index) => {
    if (range.start > cursor) parts.push(line.slice(cursor, range.start));
    parts.push(
      <mark key={index} style={{ backgroundColor: '#fff59d', color: 'inherit' }}>
        {line.slice(range.start, range.end)}
      </mark>,
    );
    cursor = range.end;
  });
  if (cursor < line.length) parts.push(line.slice(cursor));

  return parts;
}

// Tela genérica de preparo/remessa reaproveitada pelas telas de Pagamentos > Consórcios
// e Pagamentos > Modais — só mudam título, endpoint base, rótulo da coluna de nome e se
// a edição de Valor BI (com auditoria) fica disponível.
const POLLING_INTERVAL_MS = 5000;

export default function PagamentoRemessaPage({
  title,
  apiBasePath,
  nomeColuna,
  permitirEdicaoValorBi = true,
  listaGrande = false,
  comBuscaPorNome = false,
  preparoAssincrono = false,
  botoesDataUsarHoje = false,
  mostrarTotalPorGrupo = false,
  mostrarBotoesRapidosData = true,
  permitirGratuidade = false,
  permitirRenovarNsa = false,
}) {
  const dispatch = useDispatch();
  const [dateRange, setDateRange] = useState([]);
  const [gratuidade, setGratuidade] = useState(false);
  const [confirmGratuidadeOpen, setConfirmGratuidadeOpen] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [rows, setRows] = useState([]);
  const [busca, setBusca] = useState('');
  const [buscaDebounced, setBuscaDebounced] = useState('');

  // Modo servidor: usado por telas com muitas linhas (modais) — a página busca só a
  // fatia atual no backend em vez de carregar tudo de uma vez no navegador.
  const paginaNoServidor = listaGrande;
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 100 });
  const [rowCount, setRowCount] = useState(0);
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [valorTotalServidor, setValorTotalServidor] = useState(0);
  const [totaisPorGrupo, setTotaisPorGrupo] = useState([]);

  const [editDialog, setEditDialog] = useState(null); // { row, novoValor, senha }
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [auditDialog, setAuditDialog] = useState(null); // { row, entries, isLoading }

  const [detalhamentoDialog, setDetalhamentoDialog] = useState(null); // { row, entries, isLoading }

  const [confirmLimparOpen, setConfirmLimparOpen] = useState(false);
  const [isLimpando, setIsLimpando] = useState(false);

  const [cnabPreview, setCnabPreview] = useState([]); // [{ name, content }]
  const [isGerandoRemessa, setIsGerandoRemessa] = useState(false);

  const [enviarBancoDialog, setEnviarBancoDialog] = useState(null); // { senha }
  const [isEnviando, setIsEnviando] = useState(false);
  const [renovarNsaDialog, setRenovarNsaDialog] = useState(null); // { nsa }
  const [isRenovandoNsa, setIsRenovandoNsa] = useState(false);

  const pollingTimeoutRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(
    () => () => {
      isMountedRef.current = false;
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
      }
    },
    [],
  );

  // Debounce da busca por nome: evita disparar uma requisição a cada tecla digitada.
  useEffect(() => {
    const timeout = setTimeout(() => setBuscaDebounced(busca), 400);
    return () => clearTimeout(timeout);
  }, [busca]);

  const buscarPagina = (pageModel) => {
    if (!paginaNoServidor) return;
    setIsLoadingPage(true);
    api
      .get(`${apiBasePath}/preparados`, {
        headers: authHeaders(),
        params: { page: pageModel.page + 1, pageSize: pageModel.pageSize, busca: buscaDebounced || undefined },
      })
      .then((response) => {
        if (!isMountedRef.current) return;
        const { data, count, valorTotalAgrupado, valorTotalBi, totaisPorConsorcio } = response.data ?? {};
        setRows(data ?? []);
        setRowCount(count ?? 0);
        setValorTotalServidor(permitirEdicaoValorBi ? valorTotalBi ?? 0 : valorTotalAgrupado ?? 0);
        setTotaisPorGrupo(totaisPorConsorcio ?? []);
      })
      .catch(() => {
        dispatch(showMessage({ message: 'Erro ao carregar a página de pagamentos preparados.' }));
      })
      .finally(() => {
        if (isMountedRef.current) setIsLoadingPage(false);
      });
  };

  // Busca a página atual sempre que a paginação ou a busca (já com debounce) mudarem —
  // e também já ao montar, pra mostrar o que já estiver preparado sem precisar clicar
  // em "Preparar Pagamentos" de novo a cada visita à tela.
  useEffect(() => {
    if (!paginaNoServidor) return;
    buscarPagina(paginationModel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginaNoServidor, paginationModel.page, paginationModel.pageSize, buscaDebounced]);

  // Se o preparo assíncrono ficou rodando de uma visita anterior à tela (ex.: usuário
  // navegou pra outra página e voltou), retoma o polling em vez de deixar a tela achar
  // que nada está acontecendo.
  useEffect(() => {
    if (!preparoAssincrono) return;
    api
      .get(`${apiBasePath}/preparar/status`, { headers: authHeaders() })
      .then((response) => {
        if (response.data?.preparando) {
          setIsPreparing(true);
          agendarConsultaStatus();
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const carregarPreparados = () => {
    setCnabPreview([]);
    setBusca('');

    if (paginaNoServidor) {
      // A tela busca a página no backend; aqui só garante que a busca fique limpa e a
      // paginação volte pra primeira página, o que já dispara a consulta pelo useEffect.
      setIsPreparing(false);
      if (paginationModel.page !== 0) {
        setPaginationModel((prev) => ({ ...prev, page: 0 }));
      } else {
        buscarPagina(paginationModel);
      }
      dispatch(showMessage({ message: 'Preparação concluída.' }));
      return;
    }

    api
      .get(`${apiBasePath}/preparados`, { headers: authHeaders() })
      .then((response) => {
        if (!isMountedRef.current) return;
        setRows(response.data ?? []);
        if (!response.data || response.data.length === 0) {
          dispatch(showMessage({ message: 'Nenhum pagamento preparado para o período informado.' }));
        } else {
          dispatch(showMessage({ message: 'Preparação concluída.' }));
        }
      })
      .catch(() => {
        dispatch(showMessage({ message: 'Erro ao carregar os pagamentos preparados.' }));
      })
      .finally(() => {
        if (isMountedRef.current) setIsPreparing(false);
      });
  };

  const consultarStatusPreparacao = () => {
    api
      .get(`${apiBasePath}/preparar/status`, { headers: authHeaders() })
      .then((response) => {
        if (!isMountedRef.current) return;
        const { preparando, erro } = response.data ?? {};
        if (preparando) {
          agendarConsultaStatus();
          return;
        }
        if (erro) {
          setIsPreparing(false);
          dispatch(showMessage({ message: `Erro ao preparar pagamentos: ${erro}` }));
          return;
        }
        carregarPreparados();
      })
      .catch(() => {
        if (!isMountedRef.current) return;
        setIsPreparing(false);
        dispatch(showMessage({ message: 'Erro ao consultar o status da preparação.' }));
      });
  };

  function agendarConsultaStatus() {
    pollingTimeoutRef.current = setTimeout(consultarStatusPreparacao, POLLING_INTERVAL_MS);
  }

  // Só dá um refresh na tela (a preparação continua rodando no servidor independente
  // disso) — ao recarregar, o efeito de retomada de polling já detecta que ainda está
  // preparando e volta a acompanhar normalmente.
  const handleAtualizarDuranteProparo = () => {
    window.location.reload();
  };

  const getUltimoDiaSemana = (diaSemana) => {
    let dia = dayjs().subtract(1, 'day');
    while (dia.day() !== diaSemana) {
      dia = dia.subtract(1, 'day');
    }
    return dia;
  };

  const getUltimaTercaFeira = () => getUltimoDiaSemana(2);

  const handlePreencherTercaFeira = () => {
    if (botoesDataUsarHoje) {
      const hoje = dayjs().toDate();
      setDateRange([hoje, hoje]);
      return;
    }
    const segunda = getUltimoDiaSemana(1);
    const sexta = segunda.subtract(3, 'day');
    setDateRange([sexta.toDate(), segunda.toDate()]);
  };

  const handlePreencherSextaFeira = () => {
    if (botoesDataUsarHoje) {
      const hoje = dayjs().toDate();
      setDateRange([hoje, hoje]);
      return;
    }
    const terca = getUltimaTercaFeira();
    const quinta = terca.add(2, 'day');
    setDateRange([terca.toDate(), quinta.toDate()]);
  };

  const handlePreparar = () => {
    if (!dateRange?.[0] || !dateRange?.[1]) {
      dispatch(showMessage({ message: 'Selecione a data início e a data fim.' }));
      return;
    }

    const payload = {
      dataInicio: dayjs(dateRange[0]).format('YYYY-MM-DD'),
      dataFim: dayjs(dateRange[1]).format('YYYY-MM-DD'),
    };
    if (permitirGratuidade && gratuidade) {
      payload.gratuidade = true;
    }

    setIsPreparing(true);

    if (preparoAssincrono) {
      api
        .post(`${apiBasePath}/preparar`, payload, { headers: authHeaders() })
        .then(() => {
          agendarConsultaStatus();
        })
        .catch((error) => {
          setIsPreparing(false);
          const message = error?.response?.data?.error || 'Erro ao iniciar a preparação dos pagamentos.';
          dispatch(showMessage({ message }));
        });
      return;
    }

    api
      .post(`${apiBasePath}/preparar`, payload, { headers: authHeaders() })
      .then((response) => {
        setRows(response.data ?? []);
        setCnabPreview([]);
        setBusca('');
        if (!response.data || response.data.length === 0) {
          dispatch(showMessage({ message: 'Nenhum pagamento preparado para o período informado.' }));
        }
      })
      .catch(() => {
        dispatch(showMessage({ message: 'Erro ao preparar os pagamentos.' }));
      })
      .finally(() => setIsPreparing(false));
  };

  const openEditDialog = (row) => {
    setEditDialog({ row, novoValor: row.valorBi ?? 0, senha: '' });
  };

  const handleConfirmEdit = () => {
    if (!editDialog) return;
    const novoValorNumber = Number(editDialog.novoValor);
    if (editDialog.novoValor === null || editDialog.novoValor === undefined || Number.isNaN(novoValorNumber)) {
      dispatch(showMessage({ message: 'Informe um valor numérico válido.' }));
      return;
    }
    if (!editDialog.senha) {
      dispatch(showMessage({ message: 'Informe sua senha para confirmar a alteração.' }));
      return;
    }

    setIsSavingEdit(true);
    api
      .patch(
        `${apiBasePath}/valor-bi/${editDialog.row.detalheAId}`,
        { novoValor: novoValorNumber, senha: editDialog.senha },
        { headers: authHeaders() },
      )
      .then(() => {
        setRows((prev) =>
          prev.map((row) =>
            row.detalheAId === editDialog.row.detalheAId ? { ...row, valorBi: novoValorNumber } : row,
          ),
        );
        // Qualquer remessa já gerada antes dessa edição fica desatualizada — força
        // gerar de novo antes de poder enviar, pra nunca mandar pro banco um CNAB
        // sem essa mudança de Valor BI.
        setCnabPreview([]);
        setEditDialog(null);
        dispatch(showMessage({ message: 'Valor BI atualizado com sucesso.' }));
      })
      .catch((error) => {
        const message = error?.response?.data?.error || 'Erro ao atualizar o Valor BI. Verifique a senha informada.';
        dispatch(showMessage({ message }));
      })
      .finally(() => setIsSavingEdit(false));
  };

  const openAuditDialog = (row) => {
    setAuditDialog({ row, entries: [], isLoading: true });
    api
      .get(`${apiBasePath}/valor-bi/${row.detalheAId}/auditoria`, { headers: authHeaders() })
      .then((response) => {
        setAuditDialog({ row, entries: response.data ?? [], isLoading: false });
      })
      .catch(() => {
        dispatch(showMessage({ message: 'Erro ao carregar o histórico de auditoria.' }));
        setAuditDialog(null);
      });
  };

  const openDetalhamentoDialog = (row) => {
    setDetalhamentoDialog({ row, entries: [], isLoading: true });
    api
      .get(`${apiBasePath}/valor-bi/${row.detalheAId}/detalhamento`, { headers: authHeaders() })
      .then((response) => {
        setDetalhamentoDialog({ row, entries: response.data ?? [], isLoading: false });
      })
      .catch(() => {
        dispatch(showMessage({ message: 'Erro ao carregar o detalhamento por dia.' }));
        setDetalhamentoDialog(null);
      });
  };

  const handleLimparPreparo = () => {
    setIsLimpando(true);
    api
      .delete(`${apiBasePath}/preparo`, { headers: authHeaders() })
      .then((response) => {
        setRows([]);
        setRowCount(0);
        setValorTotalServidor(0);
        setCnabPreview([]);
        setBusca('');
        setConfirmLimparOpen(false);
        const { gruposRemovidos } = response.data ?? {};
        dispatch(
          showMessage({
            message: gruposRemovidos
              ? `Preparo desfeito: ${gruposRemovidos} grupo(s) removido(s).`
              : 'Nenhum preparo encontrado para desfazer.',
          }),
        );
      })
      .catch(() => {
        dispatch(showMessage({ message: 'Erro ao limpar o preparo.' }));
      })
      .finally(() => setIsLimpando(false));
  };

  const handleGerarRemessa = () => {
    setIsGerandoRemessa(true);
    api
      .post(`${apiBasePath}/gerar-remessa`, {}, { headers: authHeaders() })
      .then((response) => {
        const arquivos = response.data ?? [];
        setCnabPreview(arquivos);
        if (arquivos.length === 0) {
          dispatch(showMessage({ message: 'Nenhum arquivo de remessa foi gerado.' }));
        }
      })
      .catch(() => {
        dispatch(showMessage({ message: 'Erro ao gerar a remessa.' }));
      })
      .finally(() => setIsGerandoRemessa(false));
  };

  // Remessa rejeitada pelo banco: reabre o header com um NSA novo; depois é só gerar e enviar de novo.
  const handleConfirmRenovarNsa = () => {
    const nsa = Number(renovarNsaDialog?.nsa);
    if (!Number.isInteger(nsa) || nsa < 1) {
      dispatch(showMessage({ message: 'Informe o NSA do arquivo rejeitado.' }));
      return;
    }

    setIsRenovandoNsa(true);
    api
      .post(`${apiBasePath}/renovar-nsa`, { nsa }, { headers: authHeaders() })
      .then((response) => {
        const { nsaAnterior, nsaNovo } = response.data ?? {};
        setRenovarNsaDialog(null);
        setCnabPreview([]);
        dispatch(
          showMessage({
            message: `NSA ${nsaAnterior} substituído pelo NSA ${nsaNovo}. Clique em "Gerar Remessa" para gerar o arquivo novamente.`,
          }),
        );
      })
      .catch((error) => {
        dispatch(showMessage({ message: error?.response?.data?.error || 'Erro ao renovar o NSA da remessa.' }));
      })
      .finally(() => setIsRenovandoNsa(false));
  };

  const handleConfirmEnviarBanco = () => {
    if (!enviarBancoDialog?.senha) {
      dispatch(showMessage({ message: 'Informe sua senha para confirmar o envio.' }));
      return;
    }

    setIsEnviando(true);
    api
      .post(`${apiBasePath}/enviar-banco`, { senha: enviarBancoDialog.senha }, { headers: authHeaders() })
      .then((response) => {
        const { enviados } = response.data ?? {};
        setEnviarBancoDialog(null);
        setCnabPreview([]);
        dispatch(showMessage({ message: `${enviados ?? 0} arquivo(s) enviado(s) para o SFTP do banco.` }));
      })
      .catch((error) => {
        const message = error?.response?.data?.error || 'Erro ao enviar a remessa para o banco.';
        dispatch(showMessage({ message }));
      })
      .finally(() => setIsEnviando(false));
  };

  const columns = [
    { field: 'nomeConsorcio', headerName: nomeColuna, flex: 1, minWidth: 160 },
    ...(comBuscaPorNome ? [{ field: 'nomeUsuario', headerName: 'Nome', flex: 1.5, minWidth: 220 }] : []),
    {
      field: 'valorAgrupado',
      headerName: 'Valor Agrupado',
      width: 180,
      valueFormatter: (params) => formatter.format(params.value ?? 0),
    },
    ...(permitirEdicaoValorBi
      ? [
          {
            field: 'valorBi',
            headerName: 'Valor BI',
            width: 180,
            valueFormatter: (params) => formatter.format(params.value ?? 0),
          },
          {
            field: 'acoes',
            headerName: 'Ações',
            width: 130,
            sortable: false,
            filterable: false,
            renderCell: (params) => (
              <>
                <IconButton
                  size="small"
                  onClick={(event) => {
                    event.stopPropagation();
                    openEditDialog(params.row);
                  }}
                  title="Editar Valor BI"
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={(event) => {
                    event.stopPropagation();
                    openAuditDialog(params.row);
                  }}
                  title="Ver Auditoria"
                >
                  <HistoryIcon fontSize="small" />
                </IconButton>
              </>
            ),
          },
        ]
      : []),
  ];

  // No modo servidor a busca e a paginação já vêm prontas do backend (ver `buscarPagina`);
  // o filtro client-side só se aplica no modo simples (consórcios, poucas linhas).
  const buscaNormalizada = busca.trim().toLowerCase();
  const linhasFiltradas =
    !paginaNoServidor && comBuscaPorNome && buscaNormalizada
      ? rows.filter((row) => (row.nomeUsuario ?? '').toLowerCase().includes(buscaNormalizada))
      : rows;

  const valorTotal = paginaNoServidor
    ? valorTotalServidor
    : linhasFiltradas.reduce((sum, row) => sum + (permitirEdicaoValorBi ? row.valorBi ?? 0 : row.valorAgrupado ?? 0), 0);

  return (
    <div className="p-24 pt-10">
      <Typography className="font-medium text-3xl mb-24">{title}</Typography>

      <Paper className="p-24 rounded-2xl mb-24">
        <Typography className="font-semibold text-lg mb-16">Preparar Pagamentos</Typography>
        {mostrarBotoesRapidosData && (
          <Box className="flex items-center gap-16 flex-wrap mb-16">
            <Button size="small" variant="outlined" onClick={handlePreencherTercaFeira}>
              Terça-feira
            </Button>
            <Button size="small" variant="outlined" onClick={handlePreencherSextaFeira}>
              Sexta-feira
            </Button>
          </Box>
        )}
        <Box className="flex items-center gap-16 flex-wrap">
          <DateRangePicker
            placeholder="Data Início - Data Fim"
            format="dd/MM/yy"
            character=" - "
            value={dateRange}
            onChange={setDateRange}
          />
          {permitirGratuidade && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={gratuidade}
                  onChange={(event) => {
                    if (event.target.checked) {
                      setConfirmGratuidadeOpen(true);
                    } else {
                      setGratuidade(false);
                    }
                  }}
                />
              }
              label={<Typography className="font-bold">Gratuidade</Typography>}
            />
          )}
          <Button
            variant="contained"
            color="secondary"
            disabled={isPreparing}
            onClick={handlePreparar}
            startIcon={isPreparing ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {isPreparing ? 'Preparando...' : 'Preparar Pagamentos'}
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteSweepIcon />}
            disabled={isLimpando || isPreparing}
            onClick={() => setConfirmLimparOpen(true)}
          >
            Limpar Preparo
          </Button>
          <Button
            variant="contained"
            startIcon={<DescriptionIcon />}
            disabled={(paginaNoServidor ? rowCount === 0 : rows.length === 0) || isGerandoRemessa || isPreparing}
            onClick={handleGerarRemessa}
          >
            {isGerandoRemessa ? 'Gerando...' : 'Gerar Remessa'}
          </Button>
          {permitirRenovarNsa && (
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              disabled={isRenovandoNsa || isGerandoRemessa || isPreparing}
              onClick={() => setRenovarNsaDialog({ nsa: '' })}
            >
              Renovar NSA
            </Button>
          )}
          <a
            href="https://www.accesstage.com.br/infotrack/login.do"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'blue', backgroundColor: 'transparent', textDecoration: 'underline' }}
          >
            Acompanhe o envio do remessa na Accesstage
          </a>
        </Box>
        {isPreparing && (
          <Box className="flex items-center gap-16 mt-16 flex-wrap">
            <Typography className="text-13 text-grey-600">
              {preparoAssincrono
                ? 'Preparação em andamento no servidor — a tela consulta o status automaticamente a cada alguns segundos e é atualizada assim que terminar. Você pode acompanhar sem travar a navegação.'
                : 'Agrupando e preparando as ordens de pagamento... Isso pode levar alguns minutos quando há um grande volume de ordens.'}
            </Typography>
            {preparoAssincrono && (
              <Button size="small" variant="outlined" startIcon={<RefreshIcon />} onClick={handleAtualizarDuranteProparo}>
                Atualizar
              </Button>
            )}
          </Box>
        )}
      </Paper>

      <Paper className="p-12 rounded-2xl">
        <Typography className="text-13 text-grey-600 mb-8">
          Clique em uma linha para ver o detalhamento por dia do Valor Agrupado.
        </Typography>
        {mostrarTotalPorGrupo && totaisPorGrupo.length > 0 && (
          <Box className="flex items-center gap-16 flex-wrap mb-16">
            {totaisPorGrupo.map((grupo) => (
              <Typography key={grupo.nomeConsorcio} className="text-14">
                <span className="font-bold">{grupo.nomeConsorcio}:</span>{' '}
                {formatter.format(permitirEdicaoValorBi ? grupo.valorBi : grupo.valorAgrupado)}
              </Typography>
            ))}
          </Box>
        )}
        {comBuscaPorNome && (
          <TextField
            fullWidth
            className="mb-16"
            label="Buscar por nome"
            placeholder="Digite o nome para filtrar"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
          />
        )}
        {listaGrande ? (
          <div style={{ height: 650, width: '100%' }}>
            <DataGrid
              localeText={pt.components.MuiDataGrid.defaultProps.localeText}
              rows={rows}
              columns={columns}
              getRowId={(row) => row.detalheAId}
              paginationMode="server"
              rowCount={rowCount}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              pageSizeOptions={[25, 50, 100]}
              loading={isLoadingPage}
              disableRowSelectionOnClick
              onRowClick={(params) => openDetalhamentoDialog(params.row)}
              sx={{ '& .MuiDataGrid-row': { cursor: 'pointer' } }}
            />
          </div>
        ) : (
          <DataGrid
            autoHeight
            localeText={pt.components.MuiDataGrid.defaultProps.localeText}
            rows={linhasFiltradas}
            columns={columns}
            getRowId={(row) => row.detalheAId}
            hideFooter
            disableRowSelectionOnClick
            onRowClick={(params) => openDetalhamentoDialog(params.row)}
            sx={{ '& .MuiDataGrid-row': { cursor: 'pointer' } }}
          />
        )}
        {(paginaNoServidor ? rowCount > 0 : rows.length > 0) && (
          <Box className="flex justify-end mt-16">
            <span className="font-bold mr-8">Valor Total{permitirEdicaoValorBi ? ' (Valor BI)' : ''}:</span>
            <span className="font-bold">{formatter.format(valorTotal)}</span>
          </Box>
        )}
      </Paper>

      {cnabPreview.length > 0 && (
        <Paper className="p-24 rounded-2xl mt-24">
          <Typography className="font-semibold text-lg mb-16">Arquivo CNAB 240 Gerado</Typography>
          <Typography className="text-12 text-grey-600 mb-16">
            <Box component="mark" sx={{ backgroundColor: '#fff59d', color: 'inherit', px: '2px' }}>
              destacado
            </Box>{' '}
            = data do header do arquivo e valores dos registros.
          </Typography>
          {cnabPreview.map((arquivo, index) => (
            <Box key={arquivo.name || index} className="mb-16">
              <Typography className="text-13 text-grey-600 mb-8">
                {arquivo.name || `Arquivo ${index + 1}`} — {arquivo.content?.split('\n').length ?? 0} linha(s)
              </Typography>
              <Box
                component="pre"
                className="p-12 rounded"
                sx={{
                  backgroundColor: 'action.hover',
                  overflowX: 'auto',
                  maxHeight: 300,
                  fontSize: 11,
                  fontFamily: 'monospace',
                }}
              >
                {(arquivo.content?.split('\n') ?? []).map((line, lineIndex, lines) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <React.Fragment key={lineIndex}>
                    {renderCnabLineWithHighlights(line)}
                    {lineIndex < lines.length - 1 ? '\n' : ''}
                  </React.Fragment>
                ))}
              </Box>
            </Box>
          ))}

          <Box className="flex justify-end mt-16">
            <Button
              variant="contained"
              color="error"
              startIcon={<SendIcon />}
              onClick={() => setEnviarBancoDialog({ senha: '' })}
            >
              Enviar para o Banco
            </Button>
          </Box>
        </Paper>
      )}

      {permitirEdicaoValorBi && (
        <Dialog open={Boolean(editDialog)} onClose={() => setEditDialog(null)} fullWidth maxWidth="xs">
          <DialogTitle>Editar Valor BI</DialogTitle>
          <DialogContent>
            <Typography className="mb-16 text-14">
              {nomeColuna}: <strong>{editDialog?.row?.nomeConsorcio}</strong>
            </Typography>
            <NumericFormat
              customInput={TextField}
              fullWidth
              label="Novo Valor BI"
              className="mb-16"
              margin="dense"
              thousandSeparator="."
              decimalSeparator=","
              fixedDecimalScale
              decimalScale={2}
              prefix="R$ "
              value={editDialog?.novoValor ?? ''}
              onValueChange={(values) => setEditDialog((prev) => ({ ...prev, novoValor: values.floatValue ?? null }))}
            />
            <TextField
              fullWidth
              type="password"
              label="Confirme sua senha"
              margin="dense"
              value={editDialog?.senha ?? ''}
              onChange={(event) => setEditDialog((prev) => ({ ...prev, senha: event.target.value }))}
            />
          </DialogContent>
          <Box className="flex justify-end gap-8 p-16">
            <Button onClick={() => setEditDialog(null)}>Cancelar</Button>
            <Button variant="contained" color="secondary" disabled={isSavingEdit} onClick={handleConfirmEdit}>
              {isSavingEdit ? 'Salvando...' : 'Confirmar'}
            </Button>
          </Box>
        </Dialog>
      )}

      {permitirEdicaoValorBi && (
        <Dialog open={Boolean(auditDialog)} onClose={() => setAuditDialog(null)} fullWidth maxWidth="sm">
          <DialogTitle>Histórico de Alterações — {auditDialog?.row?.nomeConsorcio}</DialogTitle>
          <DialogContent>
            {auditDialog?.isLoading ? (
              <Typography>Carregando...</Typography>
            ) : auditDialog?.entries?.length ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Data</TableCell>
                      <TableCell>Usuário</TableCell>
                      <TableCell>Valor Anterior</TableCell>
                      <TableCell>Valor Novo</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {auditDialog.entries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{dayjs(entry.createdAt).format('DD/MM/YYYY HH:mm')}</TableCell>
                        <TableCell>{entry.user?.fullName || entry.user?.email || entry.userId}</TableCell>
                        <TableCell>{formatter.format(entry.valorAnterior)}</TableCell>
                        <TableCell>{formatter.format(entry.valorNovo)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography>Nenhuma alteração registrada.</Typography>
            )}
          </DialogContent>
          <Box className="flex justify-end gap-8 p-16">
            <Button onClick={() => setAuditDialog(null)}>Fechar</Button>
          </Box>
        </Dialog>
      )}

      <Dialog open={Boolean(detalhamentoDialog)} onClose={() => setDetalhamentoDialog(null)} fullWidth maxWidth="sm">
        <DialogTitle>Detalhamento por Dia — {detalhamentoDialog?.row?.nomeConsorcio}</DialogTitle>
        <DialogContent>
          {detalhamentoDialog?.isLoading ? (
            <Typography>Carregando...</Typography>
          ) : detalhamentoDialog?.entries?.length ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Dia</TableCell>
                    <TableCell>Id do Usuário</TableCell>
                    <TableCell>Qtd. Ordens</TableCell>
                    <TableCell>Valor</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {detalhamentoDialog.entries.map((entry) => (
                    <TableRow key={entry.data}>
                      <TableCell>{formatDateOnly(entry.data)}</TableCell>
                      <TableCell>{entry.userId}</TableCell>
                      <TableCell>{entry.quantidade}</TableCell>
                      <TableCell>{formatter.format(entry.valor)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell className="font-bold">Total</TableCell>
                    <TableCell />
                    <TableCell className="font-bold">
                      {detalhamentoDialog.entries.reduce((sum, entry) => sum + entry.quantidade, 0)}
                    </TableCell>
                    <TableCell className="font-bold">
                      {formatter.format(detalhamentoDialog.entries.reduce((sum, entry) => sum + entry.valor, 0))}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography>Nenhuma ordem encontrada.</Typography>
          )}
        </DialogContent>
        <Box className="flex justify-end gap-8 p-16">
          <Button onClick={() => setDetalhamentoDialog(null)}>Fechar</Button>
        </Box>
      </Dialog>

      <Dialog open={confirmLimparOpen} onClose={() => setConfirmLimparOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Limpar Preparo Atual</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja limpar o preparo atual? Isso vai desfazer o agrupamento de hoje, apagar os
            registros de remessa gerados (DetalheA/DetalheB) e devolver as ordens ao estado "não agrupada" — elas
            poderão ser preparadas novamente depois.
          </Typography>
        </DialogContent>
        <Box className="flex justify-end gap-8 p-16">
          <Button onClick={() => setConfirmLimparOpen(false)}>Cancelar</Button>
          <Button variant="contained" color="error" disabled={isLimpando} onClick={handleLimparPreparo}>
            {isLimpando ? 'Limpando...' : 'Limpar Preparo'}
          </Button>
        </Box>
      </Dialog>

      <Dialog open={confirmGratuidadeOpen} onClose={() => setConfirmGratuidadeOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Agrupar por Gratuidade</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja preparar os pagamentos por <strong>Gratuidade</strong>? Nesse modo o agrupamento
            usa o valor de gratuidade de cada ordem (não o valor normal) e o pagador CETT, de forma independente do
            agrupamento normal já feito ou a fazer no mesmo período.
          </Typography>
        </DialogContent>
        <Box className="flex justify-end gap-8 p-16">
          <Button onClick={() => setConfirmGratuidadeOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => {
              setGratuidade(true);
              setConfirmGratuidadeOpen(false);
            }}
          >
            Confirmar
          </Button>
        </Box>
      </Dialog>

      <Dialog open={Boolean(enviarBancoDialog)} onClose={() => setEnviarBancoDialog(null)} fullWidth maxWidth="xs">
        <DialogTitle>Enviar Remessa para o Banco</DialogTitle>
        <DialogContent>
          <Typography className="mb-16" color="error">
            Atenção: essa ação envia o arquivo CNAB 240 para o SFTP do banco e não pode ser desfeita. Confirme sua
            senha para prosseguir.
          </Typography>
          <TextField
            fullWidth
            type="password"
            label="Confirme sua senha"
            margin="dense"
            value={enviarBancoDialog?.senha ?? ''}
            onChange={(event) => setEnviarBancoDialog((prev) => ({ ...prev, senha: event.target.value }))}
          />
        </DialogContent>
        <Box className="flex justify-end gap-8 p-16">
          <Button onClick={() => setEnviarBancoDialog(null)}>Cancelar</Button>
          <Button variant="contained" color="error" disabled={isEnviando} onClick={handleConfirmEnviarBanco}>
            {isEnviando ? 'Enviando...' : 'Enviar para o Banco'}
          </Button>
        </Box>
      </Dialog>

      {permitirRenovarNsa && (
        <Dialog open={Boolean(renovarNsaDialog)} onClose={() => setRenovarNsaDialog(null)} fullWidth maxWidth="xs">
          <DialogTitle>Renovar NSA da Remessa</DialogTitle>
          <DialogContent>
            <Typography className="mb-16">
              Use quando o banco rejeitou o arquivo enviado. Informe o NSA do arquivo rejeitado: a remessa volta a ficar
              pronta para gerar com um NSA novo, usando os mesmos pagamentos já preparados.
            </Typography>
            <TextField
              fullWidth
              type="number"
              label="NSA do arquivo rejeitado"
              margin="dense"
              value={renovarNsaDialog?.nsa ?? ''}
              onChange={(event) => setRenovarNsaDialog((prev) => ({ ...prev, nsa: event.target.value }))}
            />
          </DialogContent>
          <Box className="flex justify-end gap-8 p-16">
            <Button onClick={() => setRenovarNsaDialog(null)}>Cancelar</Button>
            <Button variant="contained" disabled={isRenovandoNsa} onClick={handleConfirmRenovarNsa}>
              {isRenovandoNsa ? 'Renovando...' : 'Renovar NSA'}
            </Button>
          </Box>
        </Dialog>
      )}

      <Backdrop
        open={isPreparing && !preparoAssincrono}
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1, flexDirection: 'column', gap: 2 }}
      >
        <CircularProgress color="inherit" />
        <Typography>Preparando pagamentos, aguarde...</Typography>
      </Backdrop>
    </div>
  );
}
