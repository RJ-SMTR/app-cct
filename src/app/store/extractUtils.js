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

