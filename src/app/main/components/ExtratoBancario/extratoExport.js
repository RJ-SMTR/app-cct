import jsPDF from 'jspdf';
import 'jspdf-autotable';
import ExcelJS from 'exceljs/dist/exceljs.min.js';
import { api } from 'app/configs/api/api';

export const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/** 'yyyy-MM-dd' -> 'dd/MM/yyyy' sem passar por Date (evita deslocamento de fuso). */
export function fmtDate(value) {
  if (!value) return '-';
  const [y, m, d] = String(value).slice(0, 10).split('-');
  return y && m && d ? `${d}/${m}/${y}` : '-';
}

export function formatConta(conta) {
  if (!conta) return '-';
  const banco = conta.bancoNome ? `Banco ${conta.banco} - ${conta.bancoNome}` : conta.banco ? `Banco ${conta.banco}` : null;
  const ag = conta.agencia ? `Agência ${conta.agencia}` : null;
  const cc = conta.conta ? `Conta ${conta.conta}${conta.digito ? `-${conta.digito}` : ''}` : null;
  const tipo = conta.tipoConta ? `Conta ${conta.tipoConta === 'poupanca' ? 'poupança' : conta.tipoConta}` : null;
  return [banco, ag, cc, tipo].filter(Boolean).join(' · ') || '-';
}

export function periodoOrdens(l) {
  const { dataOrdemInicio, dataOrdemFim } = l.ordens || {};
  if (!dataOrdemInicio) return '-';
  return dataOrdemInicio === dataOrdemFim
    ? fmtDate(dataOrdemInicio)
    : `${fmtDate(dataOrdemInicio)} a ${fmtDate(dataOrdemFim)}`;
}

/** Conta CETT = ciclo de gratuidade; demais pagadores (ex.: Conta Bilhetagem) = ciclo normal. */
export function descricaoLancamento(l) {
  const gratuidade = /CETT/i.test(l.pagador?.nome || '');
  const base = gratuidade ? 'Pagamento do ciclo gratuidade' : 'Pagamento do ciclo';
  const { dataOrdemInicio, dataOrdemFim } = l.ordens || {};
  if (!dataOrdemInicio) return base;
  return `${base} no período de ${fmtDate(dataOrdemInicio)} à ${fmtDate(dataOrdemFim || dataOrdemInicio)}`;
}

function origemLancamento(l) {
  const nsa = l.remessa?.nsa ? `Remessa NSA ${l.remessa.nsa}` : 'Remessa não identificada';
  return `${l.pagador?.nome || '-'}\n${nsa}`;
}

function dataCreditoLabel(l) {
  return l.dataEfetivacao ? fmtDate(l.dataCredito) : `${fmtDate(l.dataCredito)} (venc.)`;
}

/** Cabeçalho do relatório: título, "Nome - Código de Permissão", dados da conta e período. */
function cabecalho(extrato, meta) {
  const nome = meta.userName || 'Permissionário';
  const codigo = meta.permitCode ? `Código de Permissão ${meta.permitCode}` : 'Código de Permissão não informado';
  return {
    titulo: 'Extrato Bancário de Créditos',
    linhaPermissionario: `${nome} - ${codigo}`,
    linhaConta: formatConta(meta.conta),
    linhaPeriodo: `Período: ${fmtDate(extrato.dataInicio)} a ${fmtDate(extrato.dataFim)}`,
  };
}

const NOTA_RODAPE =
  'Considera os pagamentos com status Pago ou Pendência paga. O saldo acumulado soma apenas os créditos do período ' +
  'selecionado (não é o saldo da conta bancária). "(venc.)": o banco não informou a data de efetivação, exibindo a data de vencimento.';

/** Nome do banco pelo código (lista /banks); falha silenciosamente. */
export async function resolveBankName(code) {
  if (!code) return null;
  try {
    const response = await api.get('/banks');
    const bank = (response.data || []).find((b) => String(b.code) === String(code));
    return bank?.name ?? null;
  } catch {
    return null;
  }
}

function loadLogo() {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext('2d').drawImage(img, 0, 0);
        resolve({ dataUrl: canvas.toDataURL('image/png'), width: img.naturalWidth, height: img.naturalHeight });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = `${process.env.PUBLIC_URL || ''}/assets/icons/logoPrefeitura.png`;
  });
}

/** Gera o PDF do extrato (A4 paisagem) e devolve um Blob. */
export async function buildExtratoPdf(extrato, meta) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 36;
  const head = cabecalho(extrato, meta);
  const logo = await loadLogo();

  let textX = margin;
  if (logo) {
    const logoH = 46;
    const logoW = (logo.width / logo.height) * logoH;
    doc.addImage(logo.dataUrl, 'PNG', margin, 28, logoW, logoH);
    textX = margin + logoW + 18;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text(head.titulo, textX, 46);
  doc.setFontSize(10.5);
  doc.text(head.linhaPermissionario, textX, 64);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(head.linhaConta, textX, 79);
  const emitido = new Date().toLocaleString('pt-BR');
  doc.text(`${head.linhaPeriodo}   ·   Emitido em ${emitido}`, textX, 93);
  doc.setDrawColor(180);
  doc.line(margin, 104, pageWidth - margin, 104);

  doc.autoTable({
    startY: 114,
    margin: { left: margin, right: margin },
    head: [['Total creditado', 'Créditos no período', 'Maior crédito', 'Menor crédito']],
    body: [
      [
        brl.format(extrato.totalCreditado),
        String(extrato.quantidadeCreditos),
        brl.format(extrato.maiorCredito),
        brl.format(extrato.menorCredito),
      ],
    ],
    theme: 'grid',
    styles: { fontSize: 10, halign: 'center', cellPadding: 6 },
    headStyles: { fillColor: [235, 239, 245], textColor: 40, fontStyle: 'bold' },
    bodyStyles: { fontStyle: 'bold', fontSize: 12 },
  });

  const rows = extrato.lancamentos.map((l) => [
    dataCreditoLabel(l),
    descricaoLancamento(l),
    origemLancamento(l),
    l.descricaoStatus,
    `+ ${brl.format(l.valorCreditado)}`,
    brl.format(l.saldoAcumulado),
  ]);

  if (rows.length === 0) {
    doc.setFontSize(11);
    doc.text('Nenhum crédito efetivado neste período.', margin, doc.lastAutoTable.finalY + 28);
  } else {
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 14,
      margin: { left: margin, right: margin, bottom: 46 },
      head: [['Data do crédito', 'Descrição', 'Origem', 'Status', 'Valor creditado', 'Saldo acumulado']],
      body: rows,
      foot: [['', '', '', 'Total creditado', `+ ${brl.format(extrato.totalCreditado)}`, '']],
      showFoot: 'lastPage',
      theme: 'striped',
      styles: { fontSize: 8.5, cellPadding: 4, valign: 'middle' },
      headStyles: { fillColor: [0, 70, 130], textColor: 255 },
      footStyles: { fillColor: [235, 239, 245], textColor: 20, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 'wrap' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 'wrap' },
        4: { cellWidth: 'wrap', halign: 'right' },
        5: { cellWidth: 'wrap', halign: 'right' },
      },
    });
    const noteLines = doc.splitTextToSize(NOTA_RODAPE, pageWidth - margin * 2);
    let noteY = doc.lastAutoTable.finalY + 14;
    if (noteY + noteLines.length * 10 > pageHeight - 40) {
      doc.addPage();
      noteY = margin;
    }
    doc.setFontSize(8);
    doc.setTextColor(110);
    doc.text(noteLines, margin, noteY);
    doc.setTextColor(0);
  }

  const total = doc.internal.getNumberOfPages();
  for (let page = 1; page <= total; page += 1) {
    doc.setPage(page);
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(`Página ${page} de ${total}`, pageWidth - margin, pageHeight - 20, { align: 'right' });
    doc.text(`${head.linhaPermissionario}`, margin, pageHeight - 20);
    doc.setTextColor(0);
  }

  return doc.output('blob');
}

const MOEDA = '"R$" #,##0.00';
const MOEDA_CREDITO = '"+ R$" #,##0.00';
const DATA = 'dd/mm/yyyy';
const DATA_VENC = 'dd/mm/yyyy "(venc.)"';
const AZUL = 'FF004682';
const CINZA = 'FFEBEFF5';
const ZEBRA = 'FFF7F9FC';
const VERDE = 'FF1B7F3B';
const BORDA = { style: 'thin', color: { argb: 'FFD0D5DD' } };
const BORDAS = { top: BORDA, left: BORDA, bottom: BORDA, right: BORDA };

/** 'yyyy-MM-dd' -> Date em UTC (o ExcelJS grava datas em UTC; evita deslocar um dia). */
function toExcelDate(value) {
  if (!value) return null;
  const [y, m, d] = String(value).slice(0, 10).split('-').map(Number);
  return y && m && d ? new Date(Date.UTC(y, m - 1, d)) : null;
}

function fill(argb) {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb } };
}

function styleHeaderCell(cell) {
  cell.font = { name: 'Calibri', bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
  cell.fill = fill(AZUL);
  cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  cell.border = BORDAS;
}

const FORMA_LANCAMENTO = { 41: 'TED', '01': 'Crédito em conta corrente', '05': 'Crédito em conta poupança' };

/**
 * Monta o Excel do extrato: aba "Extrato" (igual ao PDF, com a logo da prefeitura) e aba "Detalhamento"
 * (todos os dados de cada crédito). Devolve o ArrayBuffer do .xlsx.
 */
export async function buildExtratoXlsx(extrato, meta) {
  const head = cabecalho(extrato, meta);
  const wb = new ExcelJS.Workbook();
  wb.creator = 'CCT - Câmara de Compensação Tarifária';
  wb.created = new Date();

  const logo = meta.logo === undefined ? await loadLogo() : meta.logo;
  const logoId = logo ? wb.addImage({ base64: logo.dataUrl, extension: 'png' }) : null;

  // ---------------------------------------------------------------- Aba 1: Extrato
  const ws = wb.addWorksheet('Extrato', {
    views: [{ showGridLines: false }],
    pageSetup: { orientation: 'landscape', paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });
  ws.columns = [{ width: 18 }, { width: 70 }, { width: 54 }, { width: 14 }, { width: 20 }, { width: 20 }];

  // Cabeçalho: logo (A1:A4) + título, "Nome - Código de Permissão", conta e período
  [30, 22, 18, 18].forEach((h, i) => {
    ws.getRow(i + 1).height = h;
  });
  if (logoId !== null) {
    const maxW = 120;
    const maxH = 78;
    const ratio = logo.width / logo.height;
    let w = maxW;
    let h = w / ratio;
    if (h > maxH) {
      h = maxH;
      w = h * ratio;
    }
    ws.addImage(logoId, { tl: { col: 0.08, row: 0.1 }, ext: { width: w, height: h } });
  }
  const headerLines = [
    { text: head.titulo, font: { name: 'Calibri', bold: true, size: 18, color: { argb: AZUL } } },
    { text: head.linhaPermissionario, font: { name: 'Calibri', bold: true, size: 12 } },
    { text: head.linhaConta, font: { name: 'Calibri', size: 10, color: { argb: 'FF555555' } } },
    {
      text: `${head.linhaPeriodo}   ·   Emitido em ${new Date().toLocaleString('pt-BR')}`,
      font: { name: 'Calibri', size: 10, color: { argb: 'FF555555' } },
    },
  ];
  headerLines.forEach((line, i) => {
    ws.mergeCells(i + 1, 2, i + 1, 6);
    const cell = ws.getCell(i + 1, 2);
    cell.value = line.text;
    cell.font = line.font;
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
  });
  ws.getRow(5).height = 8;

  // Resumo (cartões)
  const cards = [
    { c1: 1, c2: 2, label: 'Total creditado', value: extrato.totalCreditado, fmt: MOEDA },
    { c1: 3, c2: 3, label: 'Créditos no período', value: extrato.quantidadeCreditos, fmt: '0' },
    { c1: 4, c2: 5, label: 'Maior crédito', value: extrato.maiorCredito, fmt: MOEDA },
    { c1: 6, c2: 6, label: 'Menor crédito', value: extrato.menorCredito, fmt: MOEDA },
  ];
  ws.getRow(6).height = 18;
  ws.getRow(7).height = 26;
  cards.forEach(({ c1, c2, label, value, fmt }) => {
    if (c2 > c1) {
      ws.mergeCells(6, c1, 6, c2);
      ws.mergeCells(7, c1, 7, c2);
    }
    const lab = ws.getCell(6, c1);
    lab.value = label;
    lab.font = { name: 'Calibri', bold: true, size: 9, color: { argb: 'FF666666' } };
    const val = ws.getCell(7, c1);
    val.value = value;
    val.numFmt = fmt;
    val.font = { name: 'Calibri', bold: true, size: 14 };
    for (let c = c1; c <= c2; c += 1) {
      [6, 7].forEach((r) => {
        const cell = ws.getCell(r, c);
        cell.fill = fill(CINZA);
        cell.border = BORDAS;
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });
    }
  });
  ws.getRow(8).height = 10;

  // Tabela
  const headerRow = 9;
  ['Data do crédito', 'Descrição', 'Origem', 'Status', 'Valor creditado', 'Saldo acumulado'].forEach((title, i) => {
    const cell = ws.getCell(headerRow, i + 1);
    cell.value = title;
    styleHeaderCell(cell);
  });
  ws.getRow(headerRow).height = 24;

  let row = headerRow + 1;
  const firstData = row;
  extrato.lancamentos.forEach((l, i) => {
    const r = ws.getRow(row);
    r.height = 22;
    const zebra = i % 2 === 1;
    const date = ws.getCell(row, 1);
    date.value = toExcelDate(l.dataCredito);
    date.numFmt = l.dataEfetivacao ? DATA : DATA_VENC;
    ws.getCell(row, 2).value = descricaoLancamento(l);
    ws.getCell(row, 3).value = `${l.pagador?.nome || '-'} - ${
      l.remessa?.nsa ? `Remessa NSA ${l.remessa.nsa}` : 'Remessa não identificada'
    }`;
    ws.getCell(row, 4).value = l.descricaoStatus;
    const valor = ws.getCell(row, 5);
    valor.value = l.valorCreditado;
    valor.numFmt = MOEDA_CREDITO;
    const saldo = ws.getCell(row, 6);
    saldo.value = l.saldoAcumulado;
    saldo.numFmt = MOEDA;
    for (let c = 1; c <= 6; c += 1) {
      const cell = ws.getCell(row, c);
      cell.font = { name: 'Calibri', size: 10.5 };
      cell.border = BORDAS;
      if (zebra) cell.fill = fill(ZEBRA);
      cell.alignment = {
        vertical: 'middle',
        horizontal: c === 1 || c === 4 ? 'center' : c >= 5 ? 'right' : 'left',
        indent: c === 2 || c === 3 ? 1 : 0,
      };
    }
    valor.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: VERDE } };
    ws.getCell(row, 4).font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: l.statusRemessa === 5 ? 'FF1565C0' : VERDE } };
    row += 1;
  });
  const lastData = row - 1;

  if (extrato.lancamentos.length === 0) {
    ws.mergeCells(row, 1, row, 6);
    const cell = ws.getCell(row, 1);
    cell.value = 'Nenhum crédito efetivado neste período.';
    cell.font = { name: 'Calibri', italic: true, size: 11 };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(row).height = 26;
    row += 1;
  } else {
    // Linha de total (fórmula, com o valor calculado em cache)
    ws.mergeCells(row, 1, row, 4);
    const label = ws.getCell(row, 1);
    label.value = 'Total creditado no período';
    const total = ws.getCell(row, 5);
    total.value = { formula: `SUM(E${firstData}:E${lastData})`, result: extrato.totalCreditado };
    total.numFmt = MOEDA_CREDITO;
    ws.getRow(row).height = 24;
    for (let c = 1; c <= 6; c += 1) {
      const cell = ws.getCell(row, c);
      cell.fill = fill(CINZA);
      cell.font = { name: 'Calibri', bold: true, size: 11, color: c === 5 ? { argb: VERDE } : undefined };
      cell.border = { ...BORDAS, top: { style: 'medium', color: { argb: AZUL } } };
      cell.alignment = { vertical: 'middle', horizontal: c <= 4 ? 'right' : 'right' };
    }
    row += 1;
    ws.autoFilter = { from: { row: headerRow, column: 1 }, to: { row: lastData, column: 6 } };
  }

  row += 1;
  ws.mergeCells(row, 1, row, 6);
  const nota = ws.getCell(row, 1);
  nota.value = NOTA_RODAPE;
  nota.font = { name: 'Calibri', italic: true, size: 9, color: { argb: 'FF666666' } };
  nota.alignment = { wrapText: true, vertical: 'top', horizontal: 'left' };
  ws.getRow(row).height = 30;
  ws.pageSetup.printTitlesRow = `${headerRow}:${headerRow}`;

  // ---------------------------------------------------------------- Aba 2: Detalhamento
  const det = wb.addWorksheet('Detalhamento', {
    views: [{ state: 'frozen', xSplit: 1, ySplit: 1, showGridLines: true }],
  });
  const colunas = [
    { t: 'Data do crédito', w: 16, k: 'data' },
    { t: 'Data de efetivação (banco)', w: 18, k: 'data' },
    { t: 'Data de vencimento', w: 16, k: 'data' },
    { t: 'Data da tentativa de pagamento', w: 20, k: 'data' },
    { t: 'Descrição', w: 66, k: 'texto' },
    { t: 'Status', w: 16, k: 'centro' },
    { t: 'Valor creditado', w: 18, k: 'moeda' },
    { t: 'Valor do lançamento', w: 18, k: 'moeda' },
    { t: 'Valor real efetivado (banco)', w: 20, k: 'moeda' },
    { t: 'Saldo acumulado', w: 18, k: 'moeda' },
    { t: 'Pagador', w: 34, k: 'texto' },
    { t: 'CNPJ do pagador', w: 18, k: 'centro' },
    { t: 'NSA da remessa', w: 14, k: 'centro' },
    { t: 'Arquivo de remessa', w: 40, k: 'texto' },
    { t: 'Arquivo de retorno', w: 34, k: 'texto' },
    { t: 'Data de geração da remessa', w: 18, k: 'data' },
    { t: 'Forma de lançamento', w: 24, k: 'texto' },
    { t: 'Doc. empresa', w: 14, k: 'centro' },
    { t: 'Doc. banco', w: 14, k: 'centro' },
    { t: 'NSR', w: 10, k: 'centro' },
    { t: 'Banco de destino', w: 12, k: 'centro' },
    { t: 'Agência de destino', w: 14, k: 'centro' },
    { t: 'Conta de destino', w: 16, k: 'centro' },
    { t: 'Qtd. de ordens', w: 12, k: 'centro' },
    { t: 'Período das ordens', w: 26, k: 'centro' },
    { t: 'Valor das ordens', w: 18, k: 'moeda' },
    { t: 'Qtd. ordens de guardador', w: 14, k: 'centro' },
    { t: 'Valor ordens de guardador', w: 18, k: 'moeda' },
    { t: 'Consórcios', w: 22, k: 'texto' },
    { t: 'Código de retorno do banco', w: 16, k: 'centro' },
    { t: 'Ocorrências', w: 40, k: 'texto' },
    { t: 'Ordem agrupada', w: 14, k: 'centro' },
    { t: 'Detalhe A', w: 12, k: 'centro' },
  ];
  det.columns = colunas.map((c) => ({ width: c.w }));
  colunas.forEach((c, i) => styleHeaderCell(det.getCell(1, i + 1)));
  colunas.forEach((c, i) => {
    det.getCell(1, i + 1).value = c.t;
  });
  det.getRow(1).height = 36;

  extrato.lancamentos.forEach((l, idx) => {
    const r = idx + 2;
    const valores = [
      toExcelDate(l.dataCredito),
      toExcelDate(l.dataEfetivacao),
      toExcelDate(l.dataVencimento),
      toExcelDate(l.dataTentativaPagamento),
      descricaoLancamento(l),
      l.descricaoStatus,
      l.valorCreditado,
      l.valorLancamento,
      l.valorRealEfetivado,
      l.saldoAcumulado,
      l.pagador?.nome ?? '',
      l.pagador?.documento ?? '',
      l.remessa?.nsa ?? '',
      l.remessa?.arquivoRemessa ?? '',
      l.remessa?.arquivoRetorno ?? '',
      toExcelDate(l.remessa?.dataGeracao),
      FORMA_LANCAMENTO[String(l.remessa?.formaLancamento)] || l.remessa?.formaLancamento || '',
      l.documento?.numeroDocumentoEmpresa ?? '',
      l.documento?.numeroDocumentoBanco ?? '',
      l.documento?.nsr ?? '',
      l.contaDestino?.banco ?? '',
      l.contaDestino?.agencia ?? '',
      l.contaDestino?.conta ? `${l.contaDestino.conta}${l.contaDestino.digito ? `-${l.contaDestino.digito}` : ''}` : '',
      l.ordens?.quantidade ?? 0,
      periodoOrdens(l),
      l.ordens?.valorOrdens ?? null,
      l.ordens?.quantidadeGuardador ?? 0,
      l.ordens?.valorGuardador ?? null,
      l.ordens?.consorcios ?? '',
      l.motivoStatusRemessa ?? '',
      l.ocorrencias ?? '',
      l.ordemPagamentoAgrupadoId,
      l.detalheAId,
    ];
    valores.forEach((v, i) => {
      const cell = det.getCell(r, i + 1);
      cell.value = v === '' ? null : v;
      cell.font = { name: 'Calibri', size: 10.5 };
      cell.border = BORDAS;
      if (idx % 2 === 1) cell.fill = fill(ZEBRA);
      const kind = colunas[i].k;
      if (kind === 'data') cell.numFmt = DATA;
      if (kind === 'moeda') cell.numFmt = MOEDA;
      cell.alignment = {
        vertical: 'middle',
        horizontal: kind === 'texto' ? 'left' : kind === 'moeda' ? 'right' : 'center',
      };
    });
  });
  det.autoFilter = { from: { row: 1, column: 1 }, to: { row: Math.max(extrato.lancamentos.length + 1, 1), column: colunas.length } };

  return wb.xlsx.writeBuffer();
}

/** Gera o Excel e baixa o arquivo no navegador. */
export async function exportExtratoXlsx(extrato, meta, fileName) {
  const buffer = await buildExtratoXlsx(extrato, meta);
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
