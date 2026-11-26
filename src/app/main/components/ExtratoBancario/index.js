import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { api } from 'app/configs/api/api';
import {
  brl,
  buildExtratoPdf,
  descricaoLancamento,
  exportExtratoXlsx,
  fmtDate,
  formatConta,
  resolveBankName,
} from './extratoExport';

/** Chave de exibição do botão "Extrato bancário" (Dados Bancários). */
export const EXTRATO_BANCARIO_VISIVEL = true;

/** O extrato é exibido somente para favorecidos com perfil de permissionário (role "User"). */
const ROLE_PERMISSIONARIO = 2;

function toIsoDate(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function presetRange(kind) {
  const today = new Date();
  if (kind === 'mesAtual') {
    return [toIsoDate(new Date(today.getFullYear(), today.getMonth(), 1)), toIsoDate(today)];
  }
  if (kind === 'mesAnterior') {
    return [
      toIsoDate(new Date(today.getFullYear(), today.getMonth() - 1, 1)),
      toIsoDate(new Date(today.getFullYear(), today.getMonth(), 0)),
    ];
  }
  const start = new Date(today);
  start.setDate(start.getDate() - 29);
  return [toIsoDate(start), toIsoDate(today)];
}

function SummaryCard({ label, value, hint }) {
  return (
    <Box className="rounded-8 border p-12 flex-1 min-w-160">
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h6" className="font-semibold">
        {value}
      </Typography>
      {hint ? (
        <Typography variant="caption" color="text.secondary">
          {hint}
        </Typography>
      ) : null}
    </Box>
  );
}

function LancamentoRow({ lancamento: l }) {
  const dataPrevista = !l.dataEfetivacao;

  return (
    <TableRow hover>
      <TableCell className="whitespace-nowrap">
        {fmtDate(l.dataCredito)}
        {dataPrevista ? (
          <Tooltip title="O banco não informou a data de efetivação; exibindo a data de vencimento do pagamento.">
            <Typography component="span" variant="caption" color="text.secondary" className="ml-4">
              (venc.)
            </Typography>
          </Tooltip>
        ) : null}
      </TableCell>
      <TableCell>
        <Typography variant="body2">{descricaoLancamento(l)}</Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2">{l.pagador?.nome || '-'}</Typography>
        <Typography variant="caption" color="text.secondary">
          {l.remessa?.nsa ? `Remessa NSA ${l.remessa.nsa}` : 'Remessa não identificada'}
        </Typography>
      </TableCell>
      <TableCell>
        <Chip size="small" color={l.statusRemessa === 5 ? 'info' : 'success'} label={l.descricaoStatus} />
      </TableCell>
      <TableCell align="right" className="whitespace-nowrap font-semibold" sx={{ color: 'success.main' }}>
        + {brl.format(l.valorCreditado)}
      </TableCell>
      <TableCell align="right" className="whitespace-nowrap">
        {brl.format(l.saldoAcumulado)}
      </TableCell>
    </TableRow>
  );
}

/**
 * Botão "Extrato bancário": abre um diálogo para escolher o período e exibe tudo que foi creditado na
 * conta do favorecido (pagamentos efetivados), como um extrato. "Imprimir" gera o PDF (com a logo da prefeitura) e
 * abre a pré-visualização, de onde também é possível exportar para o Excel.
 */
export function ExtratoBancarioButton({ user, className }) {
  const roleId = Number(user?.role?.id ?? user?.roleId);
  if (!EXTRATO_BANCARIO_VISIVEL || roleId !== ROLE_PERMISSIONARIO) return null;
  return <ExtratoBancarioButtonConteudo user={user} className={className} />;
}

function ExtratoBancarioButtonConteudo({ user, className }) {
  const userId = user?.id;
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState(() => presetRange('mesAtual'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [extrato, setExtrato] = useState(null);
  const [pdf, setPdf] = useState(null); // { url, blob, meta }
  const [buildingPdf, setBuildingPdf] = useState(false);
  const [buildingXlsx, setBuildingXlsx] = useState(false);

  const [dataInicio, dataFim] = range;
  const invalidRange = !dataInicio || !dataFim || dataInicio > dataFim;

  useEffect(
    () => () => {
      if (pdf?.url) URL.revokeObjectURL(pdf.url);
    },
    [pdf],
  );

  async function consultar(customRange) {
    const [ini, fim] = customRange || range;
    if (!ini || !fim || ini > fim) return;
    setLoading(true);
    setError(null);
    try {
      const token = window.localStorage.getItem('jwt_access_token');
      const response = await api.get('ordem-pagamento/extrato-bancario', {
        params: { userId, dataInicio: ini, dataFim: fim },
        headers: { Authorization: `Bearer ${token}` },
      });
      setExtrato(response.data);
    } catch (e) {
      setExtrato(null);
      setError(e?.response?.data?.message || 'Não foi possível carregar o extrato. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  function applyPreset(kind) {
    const next = presetRange(kind);
    setRange(next);
    consultar(next);
  }

  /** Dados do cabeçalho do relatório: permissionário, código de permissão e conta (com o nome do banco). */
  async function buildMeta() {
    const conta = extrato.contaAtual || {};
    const bancoNome = (await resolveBankName(conta.banco)) || user?.aux_bank?.name || null;
    return {
      userName: user?.fullName,
      permitCode: user?.permitCode,
      conta: { ...conta, bancoNome },
    };
  }

  function nomeArquivo(ext) {
    return `extrato-bancario-${userId}-${extrato.dataInicio}-a-${extrato.dataFim}.${ext}`;
  }

  async function exportarExcelDireto() {
    if (!extrato) return;
    setBuildingXlsx(true);
    try {
      await exportExtratoXlsx(extrato, await buildMeta(), nomeArquivo('xlsx'));
    } catch (e) {
      setError('Não foi possível gerar o Excel do extrato.');
    } finally {
      setBuildingXlsx(false);
    }
  }

  async function imprimir() {
    if (!extrato) return;
    setBuildingPdf(true);
    try {
      const meta = await buildMeta();
      const blob = await buildExtratoPdf(extrato, meta);
      setPdf({ url: URL.createObjectURL(blob), blob, meta });
    } catch (e) {
      setError('Não foi possível gerar o PDF do extrato.');
    } finally {
      setBuildingPdf(false);
    }
  }

  function baixarPdf() {
    if (!pdf) return;
    const link = document.createElement('a');
    link.href = pdf.url;
    link.download = nomeArquivo('pdf');
    link.click();
  }

  /** Dentro da pré-visualização do PDF: usa os mesmos dados do cabeçalho que geraram o PDF. */
  async function exportarExcel() {
    if (!pdf || !extrato) return;
    try {
      await exportExtratoXlsx(extrato, pdf.meta, nomeArquivo('xlsx'));
    } catch (e) {
      setError('Não foi possível gerar o Excel do extrato.');
    }
  }

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        className={className}
        startIcon={<FuseSvgIcon size={18}>heroicons-outline:document-text</FuseSvgIcon>}
        onClick={() => setOpen(true)}
      >
        Extrato bancário
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="lg" scroll="paper">
        <DialogTitle className="flex justify-between items-center">
          <span className="font-semibold">Extrato bancário</span>
          <IconButton onClick={() => setOpen(false)} aria-label="fechar">
            <FuseSvgIcon>heroicons-outline:x</FuseSvgIcon>
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" className="mb-16">
            Selecione um período para ver tudo que foi creditado na conta bancária cadastrada, com a origem de cada
            crédito e o saldo acumulado.
          </Typography>

          <Box className="flex flex-wrap items-center gap-12 mb-16">
            <TextField
              label="Data inicial"
              type="date"
              size="small"
              value={dataInicio}
              onChange={(e) => setRange([e.target.value, dataFim])}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Data final"
              type="date"
              size="small"
              value={dataFim}
              onChange={(e) => setRange([dataInicio, e.target.value])}
              InputLabelProps={{ shrink: true }}
            />
            <Button variant="contained" color="secondary" disabled={invalidRange || loading} onClick={() => consultar()}>
              Consultar
            </Button>
            <Button size="small" onClick={() => applyPreset('mesAtual')}>
              Mês atual
            </Button>
            <Button size="small" onClick={() => applyPreset('mesAnterior')}>
              Mês anterior
            </Button>
            <Button size="small" onClick={() => applyPreset('ultimos30')}>
              Últimos 30 dias
            </Button>
            {extrato ? (
              <Box className="flex items-center gap-8 ml-auto">
                <Button
                  size="small"
                  variant="outlined"
                  disabled={buildingXlsx}
                  startIcon={
                    buildingXlsx ? <CircularProgress size={16} /> : <FuseSvgIcon size={18}>heroicons-outline:table</FuseSvgIcon>
                  }
                  onClick={exportarExcelDireto}
                >
                  Exportar para Excel
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  disabled={buildingPdf}
                  startIcon={
                    buildingPdf ? <CircularProgress size={16} /> : <FuseSvgIcon size={18}>heroicons-outline:printer</FuseSvgIcon>
                  }
                  onClick={imprimir}
                >
                  Imprimir
                </Button>
              </Box>
            ) : null}
          </Box>
          {dataInicio && dataFim && dataInicio > dataFim ? (
            <Typography variant="caption" color="error" className="block mb-12">
              A data inicial não pode ser maior que a data final.
            </Typography>
          ) : null}

          {loading ? (
            <Box className="flex justify-center m-40">
              <CircularProgress />
            </Box>
          ) : null}

          {error ? <Typography color="error">{error}</Typography> : null}

          {!loading && !error && !extrato ? (
            <Typography variant="body2" color="text.secondary">
              Escolha o período e clique em &quot;Consultar&quot;.
            </Typography>
          ) : null}

          {!loading && extrato ? (
            <>
              <Box className="flex flex-wrap gap-12 mb-16">
                <SummaryCard
                  label="Período"
                  value={`${fmtDate(extrato.dataInicio)} a ${fmtDate(extrato.dataFim)}`}
                  hint={`Conta atual: ${formatConta(extrato.contaAtual)}`}
                />
                <SummaryCard label="Total creditado" value={brl.format(extrato.totalCreditado)} />
                <SummaryCard label="Créditos no período" value={extrato.quantidadeCreditos} />
                <SummaryCard
                  label="Maior / menor crédito"
                  value={`${brl.format(extrato.maiorCredito)} / ${brl.format(extrato.menorCredito)}`}
                />
              </Box>

              {extrato.lancamentos.length === 0 ? (
                <Typography variant="body2" className="my-24">
                  Nenhum crédito efetivado neste período.
                </Typography>
              ) : (
                <TableContainer sx={{ maxHeight: 520 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Data do crédito</TableCell>
                        <TableCell>Descrição</TableCell>
                        <TableCell>Origem</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Valor creditado</TableCell>
                        <TableCell align="right">Saldo acumulado</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {extrato.lancamentos.map((l) => (
                        <LancamentoRow key={l.detalheAId} lancamento={l} />
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              <Typography variant="caption" color="text.secondary" className="block mt-12">
                Considera os pagamentos com status Pago ou Pendência paga. O saldo acumulado soma apenas os créditos do
                período selecionado (não é o saldo da conta bancária).
              </Typography>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(pdf)} onClose={() => setPdf(null)} fullWidth maxWidth="xl" scroll="paper">
        <DialogTitle className="flex flex-wrap justify-between items-center gap-12">
          <span className="font-semibold">Extrato bancário – PDF</span>
          <Box className="flex flex-wrap items-center gap-8">
            <Button
              variant="contained"
              color="secondary"
              size="small"
              startIcon={<FuseSvgIcon size={18}>heroicons-outline:table</FuseSvgIcon>}
              onClick={exportarExcel}
            >
              Exportar para Excel
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<FuseSvgIcon size={18}>heroicons-outline:download</FuseSvgIcon>}
              onClick={baixarPdf}
            >
              Baixar PDF
            </Button>
            <IconButton onClick={() => setPdf(null)} aria-label="fechar">
              <FuseSvgIcon>heroicons-outline:x</FuseSvgIcon>
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          {pdf ? (
            <iframe
              title="Extrato bancário em PDF"
              src={pdf.url}
              style={{ width: '100%', height: '75vh', border: 0, display: 'block' }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ExtratoBancarioButton;
