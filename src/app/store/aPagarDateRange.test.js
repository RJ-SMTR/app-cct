import {
  hasAPagarStatus,
  isValidOpaStartDate,
  toOpaWindowRange,
} from './aPagarDateRange';

describe('hasAPagarStatus', () => {
  it('detects A Pagar with either casing', () => {
    expect(hasAPagarStatus(['A Pagar'])).toBe(true);
    expect(hasAPagarStatus(['A pagar'])).toBe(true);
  });

  it('is false for other statuses or no statuses', () => {
    expect(hasAPagarStatus(['Pago', 'Pendencia Paga'])).toBe(false);
    expect(hasAPagarStatus([])).toBe(false);
    expect(hasAPagarStatus(undefined)).toBe(false);
  });
});

describe('isValidOpaStartDate', () => {
  it('accepts Tuesday and Friday', () => {
    expect(isValidOpaStartDate(new Date(2026, 9, 6))).toBe(true); // terça
    expect(isValidOpaStartDate(new Date(2026, 9, 9))).toBe(true); // sexta
  });

  it('rejects any other day', () => {
    expect(isValidOpaStartDate(new Date(2026, 9, 5))).toBe(false); // segunda
    expect(isValidOpaStartDate(new Date(2026, 9, 7))).toBe(false); // quarta
    expect(isValidOpaStartDate(new Date(2026, 9, 8))).toBe(false); // quinta
    expect(isValidOpaStartDate(new Date(2026, 9, 10))).toBe(false); // sábado
    expect(isValidOpaStartDate(new Date(2026, 9, 11))).toBe(false); // domingo
  });

  it('is false for invalid input', () => {
    expect(isValidOpaStartDate(null)).toBe(false);
    expect(isValidOpaStartDate(new Date('invalid'))).toBe(false);
  });
});

describe('toOpaWindowRange', () => {
  it('completes Tuesday through Thursday', () => {
    const start = new Date(2026, 9, 6); // terça
    expect(toOpaWindowRange([start])).toEqual([start, new Date(2026, 9, 8)]);
  });

  it('completes Friday through Monday', () => {
    const start = new Date(2026, 9, 9); // sexta
    expect(toOpaWindowRange([start])).toEqual([start, new Date(2026, 9, 12)]);
  });

  it('returns a single-day range when the start is not Tuesday or Friday', () => {
    const start = new Date(2026, 9, 7); // quarta
    expect(toOpaWindowRange([start])).toEqual([start, start]);
  });

  it('returns an empty range when there is no start date', () => {
    expect(toOpaWindowRange([null, null])).toEqual([]);
    expect(toOpaWindowRange([])).toEqual([]);
    expect(toOpaWindowRange(undefined)).toEqual([]);
  });
});
