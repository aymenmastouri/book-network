import type { BookResponse } from './book-response';

describe('BookResponse.borrowCount', () => {
  it('accepts a numeric borrowCount', () => {
    const response: BookResponse = { borrowCount: 7 };

    expect(response.borrowCount).toBe(7);
    expect(typeof response.borrowCount).toBe('number');
  });

  it('allows borrowCount to be omitted', () => {
    const response: BookResponse = {};

    expect(response.borrowCount).toBeUndefined();
  });

  it('allows borrowCount to be explicitly undefined', () => {
    const response: BookResponse = { borrowCount: undefined };

    expect(response.borrowCount).toBeUndefined();
  });

  it('accepts boundary numeric values', () => {
    const zero: BookResponse = { borrowCount: 0 };
    const large: BookResponse = { borrowCount: Number.MAX_SAFE_INTEGER };
    const negative: BookResponse = { borrowCount: -1 };

    expect(zero.borrowCount).toBe(0);
    expect(large.borrowCount).toBe(Number.MAX_SAFE_INTEGER);
    expect(negative.borrowCount).toBe(-1);
  });

  it('does not accept non-number borrowCount values at compile time', () => {
    // @ts-expect-error borrowCount must be a number
    const invalid: BookResponse = { borrowCount: '7' };

    expect(invalid).toBeDefined();
  });
});