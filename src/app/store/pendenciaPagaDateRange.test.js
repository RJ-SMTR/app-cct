import {
  hasSingleDayStatus,
  toSingleDayRange,
} from './pendenciaPagaDateRange';

describe('hasSingleDayStatus', () => {
  it('detects Pendencia Paga with or without accent', () => {
    expect(hasSingleDayStatus(['Pendencia Paga'])).toBe(true);
    expect(hasSingleDayStatus(['Pendência Paga'])).toBe(true);
  });

  it('does not restrict pendência de pagamento to a single day', () => {
    expect(hasSingleDayStatus(['Pendência de Pagamento'])).toBe(false);
  });

  it('is false for other statuses or no statuses', () => {
    expect(hasSingleDayStatus(['Pago', 'A Pagar'])).toBe(false);
    expect(hasSingleDayStatus([])).toBe(false);
    expect(hasSingleDayStatus(undefined)).toBe(false);
  });
});

describe('toSingleDayRange', () => {
  const start = new Date(2026, 8, 3);
  const end = new Date(2026, 8, 10);

  it('makes the end date equal to the start date', () => {
    expect(toSingleDayRange([start, end])).toEqual([start, start]);
  });

  it('keeps a single selected day as the start and end', () => {
    expect(toSingleDayRange([start, start])).toEqual([start, start]);
  });

  it('returns an empty range when there is no start date', () => {
    expect(toSingleDayRange([null, null])).toEqual([]);
    expect(toSingleDayRange([])).toEqual([]);
    expect(toSingleDayRange(undefined)).toEqual([]);
  });
});
