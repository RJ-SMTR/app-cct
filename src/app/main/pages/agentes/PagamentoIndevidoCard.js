import {
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { format, isValid, parseISO } from "date-fns";
import { memo } from "react";

function formatAmount(value) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);
}

function formatDate(value) {
  const parsedDate = value ? parseISO(value) : null;
  return parsedDate && isValid(parsedDate) ? format(parsedDate, "dd/MM/yyyy") : "-";
}

// Mesmas cores dos status da tela de relatório (ReportApp.getStatusStyles: green-300, gray-400 e red-300, texto preto).
function getStatusSx(status) {
  const backgrounds = {
    Pago: "#86efac",
    "Aguardando Pagamento": "#9ca3af",
    "A pagar": "#9ca3af",
  };

  return { backgroundColor: backgrounds[status] || "#fca5a5", color: "#000" };
}

/**
 * Quadro do valor indevido do guardador (tabela pagamento_indevido). Só aparece quando ainda há saldo devedor: sem saldo, sem
 * pagamento indevido ou se a consulta falhar, nada é exibido e o resto da tela não é afetado. Recebe o indevido já buscado
 * (`useAgentePagamentoIndevido`), o mesmo que marca o "Abatimento por duplicidade" na visão mensal.
 */
const PagamentoIndevidoCard = memo(function PagamentoIndevidoCard({ indevido }) {
  if (!indevido?.hasBalance) {
    return null;
  }

  return (
    <Paper className="flex flex-col flex-auto p-16 rounded-2xl shadow overflow-hidden mt-24">
      <div>
        <Typography className="text-lg font-medium tracking-tight leading-6 truncate">
          Valor indevido a pagar
        </Typography>
        <Typography color="text.secondary">
          Pagamentos feitos a mais ao guardador e o que já foi abatido nos pagamentos seguintes.
        </Typography>
      </div>

      <TableContainer sx={{ maxHeight: 440, overflowX: "auto" }} className="mt-24">
        <Table stickyHeader sx={{ minWidth: 560 }}>
          <TableHead>
            <TableRow>
              <TableCell>Data</TableCell>
              <TableCell>Valor devido</TableCell>
              <TableCell>Valor pago</TableCell>
              <TableCell>Diferença</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {indevido.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography color="text.secondary">Ainda não houve abatimento em pagamento.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              indevido.items.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>{formatDate(item.date)}</TableCell>
                  <TableCell>{formatAmount(item.amountDue)}</TableCell>
                  <TableCell>{formatAmount(item.amountPaid)}</TableCell>
                  <TableCell>
                    <div>{formatAmount(item.difference)}</div>
                    {item.differenceNote ? (
                      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic" }}>
                        {item.differenceNote}
                      </Typography>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={item.status} sx={getStatusSx(item.status)} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography className="mt-16" color="text.secondary">
        Saldo devedor ainda a descontar:{" "}
        <Typography component="span" className="font-semibold" color="error">
          {formatCurrency(indevido.totalSaldoDevedor)}
        </Typography>
      </Typography>
    </Paper>
  );
});

export default PagamentoIndevidoCard;
