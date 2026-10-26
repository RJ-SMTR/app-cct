import React from 'react';
import { TableCell, TableRow, Tooltip } from '@mui/material';

/**
 * STUC - Gratuidade (ADR 0012): um dia da janela de pagamento por linha, repetindo
 * Nome/CPF/Valor Lançamento (e Data Ordem de Pagamento, quando aplicável). Usado pelo
 * Relatório Consolidado e pela Movimentação Financeira - uma única fonte evita que as duas
 * telas divirjam silenciosamente (já aconteceu: a Movimentação Financeira ficou com
 * "Valor Lançamento" errado por um tempo porque sua própria cópia dessa lógica não existia
 * aqui e o bug de soma no backend só foi notado ao testar essa tela).
 */
export function explodeStucGratuidadeRows(data, { nome, cpfCnpj, valor, dataPagamento }) {
  return (data ?? []).flatMap((report, reportIndex) =>
    [1, 2, 3, 4]
      .filter((n) => report[`dataOrdemPagamento${n}`] || report[`valorOrdemPagamento${n}`] != null)
      .map((n) => ({
        id: `${reportIndex}::${n}`,
        nome: nome(report),
        cpfCnpj: cpfCnpj(report),
        dataOrdem: report[`dataOrdemPagamento${n}`],
        valorOrdem: report[`valorOrdemPagamento${n}`],
        valorLancamento: valor(report),
        dataPagamento: dataPagamento ? dataPagamento(report) : undefined,
      })),
  );
}

export const STUC_GRATUIDADE_COLUMN_COUNT = { withDataPagamento: 6, withoutDataPagamento: 5 };

// STUC - Gratuidade é só Permissionário/pessoa física, então CPF (11 dígitos) - máscara fixa
// XXX.XXX.XXX-XX, não reaproveita o formatCpfCnpj de cada página (que trata CPF/CNPJ
// variável e não reconhecia CPF puro de 11 dígitos).
function formatCpf(value) {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (digits.length !== 11) return value || '-';
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

export function StucGratuidadeHeaderCells({ showDataPagamento }) {
  return (
    <>
      <TableCell className="font-semibold p-1 text-sm" style={{ whiteSpace: 'nowrap' }}>
        <Tooltip title="Nome"><span>Nome</span></Tooltip>
      </TableCell>
      <TableCell className="font-semibold p-1 text-sm">
        <Tooltip title="CPF"><span>CPF</span></Tooltip>
      </TableCell>
      <TableCell className="font-semibold p-1 text-sm">
        <Tooltip title="Data Ordem"><span>Data Ordem</span></Tooltip>
      </TableCell>
      <TableCell className="font-semibold p-1 text-sm">
        <Tooltip title="Valor Ordem"><span>Valor Ordem</span></Tooltip>
      </TableCell>
      <TableCell className="font-semibold p-1 text-sm">
        <Tooltip title="Valor Lançamento"><span>Valor Lançamento</span></Tooltip>
      </TableCell>
      {showDataPagamento && (
        <TableCell className="font-semibold p-1 text-sm">
          <Tooltip title="Data de Pagamento"><span>Data de Pagamento</span></Tooltip>
        </TableCell>
      )}
    </>
  );
}

export function StucGratuidadeBodyRows({ rows, formatCurrency, showDataPagamento }) {
  return rows.map((row) => (
    <TableRow key={row.id} className="hover:bg-gray-50">
      <TableCell className="text-xs py-6 px-1" style={{ whiteSpace: 'nowrap' }}>{row.nome}</TableCell>
      <TableCell className="text-xs py-6 px-1">{formatCpf(row.cpfCnpj)}</TableCell>
      <TableCell className="text-xs py-1">{row.dataOrdem ?? '-'}</TableCell>
      <TableCell className="text-xs py-6 px-1">{row.valorOrdem != null ? formatCurrency(row.valorOrdem) : '-'}</TableCell>
      <TableCell className="text-xs py-6 px-1">{formatCurrency(row.valorLancamento)}</TableCell>
      {showDataPagamento && <TableCell className="text-xs py-1">{row.dataPagamento ?? '-'}</TableCell>}
    </TableRow>
  ));
}
