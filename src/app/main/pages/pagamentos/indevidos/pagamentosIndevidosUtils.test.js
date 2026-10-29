import { CABECALHO_PLANILHA, formatCpfCnpj, formatData, montarPlanilha, nomeArquivo, somarLinhas } from './pagamentosIndevidosUtils';

const itens = [
  { guardador: 'A', cpfCnpj: '12345678901', dataReferencia: '2026-10-16', valorPago: '100.00', valorPagar: '0.00', valorIndevido: '100.00', valorDebitado: '40.00', saldoDevedor: '60.00', situacao: 'devendo' },
  { guardador: 'B', cpfCnpj: null, dataReferencia: null, valorPago: '50.10', valorPagar: '0.00', valorIndevido: '50.10', valorDebitado: '50.10', saldoDevedor: '0.00', situacao: 'quitado' },
];

describe('pagamentosIndevidosUtils', () => {
  it('formata data e CPF/CNPJ', () => {
    expect(formatData('2026-10-16')).toBe('16/10/2026');
    expect(formatData(null)).toBe('—');
    expect(formatCpfCnpj('12345678901')).toBe('123.456.789-01');
    expect(formatCpfCnpj('12345678000190')).toBe('12.345.678/0001-90');
    expect(formatCpfCnpj(null)).toBe('—');
  });

  it('soma indevido, debitado e saldo sem erro de ponto flutuante', () => {
    expect(somarLinhas(itens)).toEqual({ valorIndevido: 150.1, valorDebitado: 90.1, saldoDevedor: 60 });
  });

  it('monta a planilha com cabeçalho, linhas e TOTAL GERAL', () => {
    const folha = montarPlanilha(itens).Sheets['Pagamentos indevidos'];
    expect(folha.A1.v).toBe(CABECALHO_PLANILHA[0]);
    expect(folha.A2.v).toBe('A');
    expect(folha.B2.v).toBe('123.456.789-01');
    expect(folha.C2.v).toBe('16/10/2026');
    expect(folha.F2.v).toBe(60);
    expect(folha.G3.v).toBe('Quitado');
    expect(folha.A4.v).toBe('TOTAL GERAL');
    expect(folha.D4.v).toBe(150.1);
    expect(folha.E4.v).toBe(90.1);
    expect(folha.F4.v).toBe(60);
    expect(CABECALHO_PLANILHA).toEqual(['Guardador', 'CPF/CNPJ', 'Referência', 'Indevido', 'Já debitado', 'Deve', 'Situação']);
  });

  it('nome do arquivo leva a data', () => {
    expect(nomeArquivo(new Date('2026-10-20T12:00:00Z'))).toBe('pagamentos-indevidos-guardadores_2026-10-20.xlsx');
  });
});
