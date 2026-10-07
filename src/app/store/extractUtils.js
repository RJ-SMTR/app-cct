export function groupTransactionsByType(transactions) {
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return {};
  }

  const PREFERRED_TYPE_ORDER = [
    'Integral',
    'Integração',
    'Gratuidade',
  ];

  const grouped = transactions.reduce((acc, transaction) => {
    if (!transaction) return acc;

    const rawType =
      transaction.tipo_transacao ??
      transaction.tipoTransacao ??
      transaction.transactionType ??
      'Outros';
    const type = String(rawType).trim() || 'Outros';

    const rawValue =
      transaction.valor_pagamento ??
      transaction.valorPagamento ??
      transaction.valor_transacao ??
      transaction.transactionValue ??
      transaction.valor ??
      0;
    const value = Number(rawValue) || 0;

    if (!acc[type]) {
      acc[type] = {
        count: 0,
        transactionValue: 0,
      };
    }

    acc[type].count += 1;
    acc[type].transactionValue =
      Math.round((acc[type].transactionValue + value) * 100) / 100;

    return acc;
  }, {});

  const sortedEntries = Object.entries(grouped).sort(([typeA], [typeB]) => {
    const idxA = PREFERRED_TYPE_ORDER.indexOf(typeA);
    const idxB = PREFERRED_TYPE_ORDER.indexOf(typeB);

    if (idxA !== -1 && idxB !== -1) {
      return idxA - idxB;
    }
    if (idxA !== -1) {
      return -1;
    }
    if (idxB !== -1) {
      return 1;
    }
    return typeA.localeCompare(typeB);
  });

  return Object.fromEntries(sortedEntries);
}

// Data passada sem status de remessa venceu e não foi enviada: "Pendência de Pagamento", sem badge de erro (#1164).
const hasRemittanceStatus = (statusRemessa) =>
  statusRemessa !== null && statusRemessa !== undefined && statusRemessa !== '';

export function markMonthlyPendingPayments(statements) {
  const today = new Date().toISOString().slice(0, 10);
  const latestPaymentDate = statements.reduce((latestDate, statement) => {
    const paymentDate = statement.dataTentativaPagamento ?? statement.data;

    return paymentDate > latestDate ? paymentDate : latestDate;
  }, '');

  return statements.map((statement) => {
    const paymentDate = statement.dataTentativaPagamento ?? statement.data;
    const isPast = Boolean(paymentDate) && String(paymentDate).slice(0, 10) < today;
    const isUnsent = !hasRemittanceStatus(statement.statusRemessa);
    const hasValue = Number(statement.valorTotal ?? statement.valor ?? 0) > 0;

    if (isPast && isUnsent && hasValue) {
      return { ...statement, paymentStatus: 'Pendência de Pagamento' };
    }

    if (Number(statement.statusRemessa) !== 4) {
      return statement;
    }

    const isLatestPendingPayment = paymentDate === latestPaymentDate;
    const hasLaterPaymentWithStatus = statements.some((laterStatement) => {
      const laterPaymentDate = laterStatement.dataTentativaPagamento ?? laterStatement.data;

      return laterPaymentDate > paymentDate && hasRemittanceStatus(laterStatement.statusRemessa);
    });

    return isLatestPendingPayment || hasLaterPaymentWithStatus
      ? { ...statement, paymentStatus: 'Pendência de Pagamento' }
      : statement;
  });
}

