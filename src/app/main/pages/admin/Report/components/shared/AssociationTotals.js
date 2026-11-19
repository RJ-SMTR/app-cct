import { Box } from "@mui/material";

// Linhas de cada associação selecionada no resultado do Guardador (Consolidado e Movimentação Financeira):
// nome da associação e o valor pago a ela e/ou o valor dos guardadores vinculados a ela, conforme a seleção
// (ver buildAgentAssociationTotalLines). `lines` vem de fetch*AssociationTotals.
export default function AssociationTotals({ lines, formatValue }) {
  if (!Array.isArray(lines) || lines.length === 0) {
    return null;
  }

  return (
    <Box sx={{ width: "100%", mt: 2 }} data-testid="association-totals">
      {lines.map((line) => (
        <Box
          key={`${line.nome}-${line.label}`}
          sx={{ display: "flex", justifyContent: "space-between", width: "100%", gap: 2, py: 0.5 }}
          className="font-semibold text-black"
        >
          <span>Associação: {line.nome}</span>
          <span>
            {line.label}: {formatValue(line.valor)}
          </span>
        </Box>
      ))}
    </Box>
  );
}
