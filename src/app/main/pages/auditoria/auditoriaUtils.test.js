import { diferencas, formatData, formatBRL, limparFiltros, mensagemDeErro, resumirJson, validarPeriodoSincronizacao } from './auditoriaUtils';

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

  it('valida o período da sincronização manual', () => {
    expect(validarPeriodoSincronizacao('2026-11-06', '2026-11-06')).toBe('');
    expect(validarPeriodoSincronizacao('', '2026-11-06')).toMatch(/Informe/);
    expect(validarPeriodoSincronizacao('2026-11-07', '2026-11-06')).toMatch(/menor ou igual/);
    expect(validarPeriodoSincronizacao('2026-10-01', '2026-11-06')).toMatch(/máximo/);
  });
});
