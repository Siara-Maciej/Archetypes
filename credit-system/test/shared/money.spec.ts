import { Money } from '../../src/shared/domain/money';

describe('Money', () => {
  it('creates with amount and currency', () => {
    const m = Money.of(100, 'PLN');
    expect(m.amount).toBe(100);
    expect(m.currency).toBe('PLN');
  });

  it('defaults to PLN', () => {
    expect(Money.of(50).currency).toBe('PLN');
  });

  it('rejects negative amount', () => {
    expect(() => Money.of(-1)).toThrow('negative');
  });

  it('adds money', () => {
    const result = Money.of(100).add(Money.of(50));
    expect(result.amount).toBe(150);
  });

  it('subtracts money', () => {
    const result = Money.of(100).subtract(Money.of(30));
    expect(result.amount).toBe(70);
  });

  it('multiplies by factor', () => {
    const result = Money.of(100).multiply(0.15);
    expect(result.amount).toBe(15);
  });

  it('rejects currency mismatch on add', () => {
    expect(() => Money.of(100, 'PLN').add(Money.of(50, 'EUR'))).toThrow(
      'Currency mismatch',
    );
  });

  it('compares amounts', () => {
    expect(Money.of(100).isGreaterThan(Money.of(50))).toBe(true);
    expect(Money.of(50).isLessThan(Money.of(100))).toBe(true);
  });
});
