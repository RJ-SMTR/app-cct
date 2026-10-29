import { diferencas, formatData, formatBRL, limparFiltros, mensagemDeErro, resumirJson } from './auditoriaUtils';

describe('auditoriaUtils', () => {
  it('formata data ISO sem deslocar o dia', () => {
    expect(formatData('2026-10-09')).toBe('09/10/2026');
    expect(formatData('2026-10-09T03:00:00.000Z')).toBe('09/10/2026');
    expect(formatData(null)).toBe('—');
  });

  it('formata moeda e trata vazio', () => {
    expect(formatBRL(10)).toContain('10,00');
    expect(formatBRL(null)).toBe('—');
  });

  it('remove filtros vazios mas mantém o zero', () => {
    expect(limparFiltros({ a: '', b: null, c: undefined, d: false, e: 0, f: 'x' })).toEqual({ e: 0, f: 'x' });
  });

  it('resume JSON longo', () => {
    expect(resumirJson({ a: 'x'.repeat(200) }).endsWith('…')).toBe(true);
    expect(resumirJson(null)).toBe('—');
  });

  it('lista só os campos que mudaram', () => {
    expect(diferencas({ valor: '10', nome: 'a' }, { valor: '12', nome: 'a' })).toEqual([{ campo: 'valor', antes: '10', depois: '12' }]);
    expect(diferencas(null, { x: 1 })).toEqual([{ campo: 'x', antes: undefined, depois: 1 }]);
  });

  it('extrai a mensagem de erro da API', () => {
    expect(mensagemDeErro({ response: { data: { error: 'Acesso restrito.' } } })).toBe('Acesso restrito.');
    expect(mensagemDeErro({})).toBe('Não foi possível concluir a operação.');
  });
});
