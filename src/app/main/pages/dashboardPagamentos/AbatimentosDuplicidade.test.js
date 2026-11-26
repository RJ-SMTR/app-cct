import { filtrarAbatimentos, formatarData } from './AbatimentosDuplicidade';

jest.mock('app/configs/api/api', () => ({ api: {} }), { virtual: true });

describe('AbatimentosDuplicidade', () => {
  const itens = [
    { detalheAId: 1, guardador: 'JOÃO DA SILVA', cpfCnpj: '123.456.789-00' },
    { detalheAId: 2, guardador: 'MARIA SOUZA', cpfCnpj: '98765432100' },
  ];

  it('busca por parte do nome, sem diferenciar acento e maiúsculas', () => {
    expect(filtrarAbatimentos(itens, 'joao').map((i) => i.detalheAId)).toEqual([1]);
    expect(filtrarAbatimentos(itens, 'Souza').map((i) => i.detalheAId)).toEqual([2]);
  });

  it('busca por CPF com ou sem pontuação (a partir de 3 dígitos)', () => {
    expect(filtrarAbatimentos(itens, '456789').map((i) => i.detalheAId)).toEqual([1]);
    expect(filtrarAbatimentos(itens, '987.654').map((i) => i.detalheAId)).toEqual([2]);
    expect(filtrarAbatimentos(itens, '12')).toEqual([]);
  });

  it('sem busca devolve tudo', () => {
    expect(filtrarAbatimentos(itens, '  ')).toBe(itens);
  });

  it('formata a data sem deslocar o dia por fuso', () => {
    expect(formatarData('2026-11-23')).toBe('23/11/2026');
    expect(formatarData(null)).toBe('-');
  });
});
