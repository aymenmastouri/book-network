import { BookResponse } from './book-response';

type Equals<T, U> = [T] extends [U] ? ([U] extends [T] ? true : false) : false;
type Expect<T extends true> = T;

type BorrowCountType = BookResponse['borrowCount'];
type BorrowCountIsOptionalNumber = Expect<Equals<BorrowCountType | undefined, number | undefined>>;
type NonNullableBorrowCountIsNumber = Expect<Equals<NonNullable<BorrowCountType>, number>>;

describe('BookResponse borrowCount', () => {
  let book: BookResponse;

  beforeEach(() => {
    book = {};
  });

  it('allows borrowCount to be omitted', () => {
    expect(book.borrowCount).toBeUndefined();
    expect('borrowCount' in book).toBe(false);
  });

  it('accepts a number as borrowCount', () => {
    book.borrowCount = 10;
    expect(book.borrowCount).toBe(10);
    expect(typeof book.borrowCount).toBe('number');
    expect('borrowCount' in book).toBe(true);
  });

  it('accepts zero as a boundary value', () => {
    book.borrowCount = 0;
    expect(book.borrowCount).toBe(0);
    expect(book.borrowCount).toBeDefined();
  });

  it('accepts large numeric values', () => {
    book.borrowCount = Number.MAX_SAFE_INTEGER;
    expect(book.borrowCount).toBe(Number.MAX_SAFE_INTEGER);
  });

  it('accepts fractional numbers because the property is declared as number', () => {
    book.borrowCount = 2.5;
    expect(book.borrowCount).toBe(2.5);
  });

  it('can remove borrowCount after it has been assigned', () => {
    book.borrowCount = 7;
    delete book.borrowCount;
    expect(book.borrowCount).toBeUndefined();
    expect('borrowCount' in book).toBe(false);
  });

  it('rejects non-number assignments at compile time', () => {
    // @ts-expect-error borrowCount must be a number
    book.borrowCount = '1';

    // @ts-expect-error borrowCount must be a number
    book.borrowCount = true;

    // @ts-expect-error borrowCount must be a number
    book.borrowCount = {};

    // @ts-expect-error borrowCount must be a number
    book.borrowCount = [1];

    expect(true).toBe(true);
  });

  it('declares borrowCount as an optional number in the type system', () => {
    const optionalNumber: BorrowCountIsOptionalNumber = true;
    const nonNullableNumber: NonNullableBorrowCountIsNumber = true;
    expect(optionalNumber).toBe(true);
    expect(nonNullableNumber).toBe(true);
  });
});