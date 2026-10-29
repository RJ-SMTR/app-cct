import { corpoDoFormulario, formularioDe, formularioNovo, idManual, parseValor } from './controleRemessaErroUtils';

describe('controleRemessaErroUtils', () => {
  it('parseValor entende formatos brasileiros e numéricos', () => {
    expect(parseValor('1.234,56')).toBe(1234.56);
    expect(parseValor('R$ 10,5')).toBe(10.5);
    expect(parseValor('1234.56')).toBe(1234.56);
    expect(parseValor('')).toBeNull();
    expect(Number.isNaN(parseValor('abc'))).toBe(true);
  });

  it('corpoDoFormulario exige a data de geração e valida valores', () => {
    expect(corpoDoFormulario({ ...formularioNovo(), dataGeracao: '' }).erro).toMatch(/data de geração/);
    expect(corpoDoFormulario({ ...formularioNovo(), valorPagar: 'x' }).erro).toMatch(/Valor p\/ pgto/);
  });

  it('corpoDoFormulario monta o corpo da API', () => {
    const { corpo } = corpoDoFormulario({ ...formularioNovo(), dataGeracao: '2026-10-23', favorecido: ' Intersul ', valorPagar: '1.000,50', status: 'Pago' });
    expect(corpo).toMatchObject({ dataGeracao: '2026-10-23', dataPagamento: null, favorecido: 'Intersul', valorPagar: 1000.5, valorPagoJuizo: null, status: 'Pago' });
  });

  it('formularioDe preenche a edição e idManual converte o id', () => {
    expect(formularioDe({ dataGeracao: '2026-10-23', valorPagar: 10.5, status: 'Pago' })).toMatchObject({ valorPagar: '10,5', status: 'Pago', nomeRemessa: '' });
    expect(idManual('man-12')).toBe(12);
  });
});
