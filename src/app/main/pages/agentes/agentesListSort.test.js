import { semNome, sortAgentsByName } from './agentesListSort';

describe('sortAgentsByName', () => {
  it('ordena por nome A-Z e deixa em branco e "Guardador" no final', () => {
    const lista = [
      { id: 1, fullName: '' },
      { id: 2, fullName: 'Guardador' },
      { id: 3, fullName: 'zeca' },
      { id: 4, fullName: null },
      { id: 5, fullName: 'Álvaro' },
      { id: 6, fullName: 'Bruno' },
    ];

    expect(sortAgentsByName(lista).map((a) => a.id)).toEqual([5, 6, 3, 1, 2, 4]);
  });

  it('não altera a lista original e aceita valor inválido', () => {
    const lista = [{ id: 1, fullName: 'B' }, { id: 2, fullName: 'A' }];

    sortAgentsByName(lista);

    expect(lista.map((a) => a.id)).toEqual([1, 2]);
    expect(sortAgentsByName(undefined)).toEqual([]);
  });

  it('semNome reconhece vazio, espaços e o rótulo genérico', () => {
    expect(semNome('  ')).toBe(true);
    expect(semNome('GUARDADOR')).toBe(true);
    expect(semNome('Guardador Silva')).toBe(false);
  });
});
