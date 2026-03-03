import { Rate } from '../../src/shared/domain/rate';

describe('Rate', () => {
  it('creates from decimal', () => {
    const r = Rate.of(0.085);
    expect(r.value).toBe(0.085);
    expect(r.percentage).toBeCloseTo(8.5);
  });

  it('creates from percentage', () => {
    const r = Rate.fromPercentage(8.5);
    expect(r.value).toBe(0.085);
  });

  it('rejects rate < 0', () => {
    expect(() => Rate.of(-0.1)).toThrow();
  });

  it('rejects rate > 1', () => {
    expect(() => Rate.of(1.1)).toThrow();
  });

  it('applies to amount', () => {
    expect(Rate.of(0.1).apply(1000)).toBe(100);
  });
});
