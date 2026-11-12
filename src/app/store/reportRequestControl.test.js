import {
  REPORT_REQUEST_TIMEOUT_MS,
  REPORT_TIMEOUT_MESSAGE,
  beginReportSearch,
  classifyReportError,
  currentReportSignal,
  reportErrorMessage,
  withReportRequestControl,
} from './reportRequestControl';

describe('report request control (ADR 0023 da api-cct)', () => {
  it('uses a 130 s timeout, above the 120 s limit of the API', () => {
    expect(REPORT_REQUEST_TIMEOUT_MS).toBe(130000);
  });

  it('adds the timeout and the current search signal to a request config', () => {
    beginReportSearch();

    const config = withReportRequestControl({ method: 'get', url: '/x' });

    expect(config).toEqual(expect.objectContaining({ method: 'get', url: '/x', timeout: 130000, signal: currentReportSignal() }));
  });

  it('aborts the previous search when a new one begins', () => {
    beginReportSearch();
    const anterior = currentReportSignal();

    beginReportSearch();

    expect(anterior.aborted).toBe(true);
    expect(currentReportSignal().aborted).toBe(false);
  });

  describe('classifyReportError', () => {
    it.each([
      ['a 504 from the API', { response: { status: 504 } }],
      ['an axios timeout', { code: 'ECONNABORTED' }],
      ['an axios timeout with clarified error', { code: 'ETIMEDOUT' }],
    ])('returns "timeout" for %s', (_caso, erro) => {
      expect(classifyReportError(erro)).toBe('timeout');
    });

    it.each([
      ['an axios cancellation', { code: 'ERR_CANCELED', name: 'CanceledError' }],
      ['a DOM abort', { name: 'AbortError' }],
    ])('returns "cancelado" for %s', (_caso, erro) => {
      expect(classifyReportError(erro)).toBe('cancelado');
    });

    it('returns "erro" for anything else', () => {
      expect(classifyReportError({ response: { status: 400 } })).toBe('erro');
      expect(classifyReportError(new Error('x'))).toBe('erro');
      expect(classifyReportError(undefined)).toBe('erro');
    });
  });

  it('has the same message the API sends on 504', () => {
    expect(REPORT_TIMEOUT_MESSAGE).toBe('A consulta demorou mais de 2 minutos; reduza o período');
  });

  describe('reportErrorMessage', () => {
    it('returns null for a cancelled search, the timeout message for a timeout, and the screen message otherwise', () => {
      expect(reportErrorMessage({ code: 'ERR_CANCELED' }, 'padrao')).toBeNull();
      expect(reportErrorMessage({ response: { status: 504 } }, 'padrao')).toBe(REPORT_TIMEOUT_MESSAGE);
      expect(reportErrorMessage({ response: { status: 400 } }, 'padrao')).toBe('padrao');
    });
  });
});
