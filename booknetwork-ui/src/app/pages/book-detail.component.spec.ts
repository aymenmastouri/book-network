import { of } from 'rxjs';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';

import { get } from '../api/fn/books/get';
import { forBook } from '../api/fn/feedback/for-book';
import { BookResponse } from '../api/models/book-response';
import { PageResponseFeedbackResponse } from '../api/models/page-response-feedback-response';
import { Api } from '../core/api';
import { ToastService } from '../shared/toast.service';

import { BookDetailComponent } from './book-detail.component';

describe('BookDetailComponent borrow-count display', () => {
  let currentBook: BookResponse | null;
  let currentFeedbacks: PageResponseFeedbackResponse;

  function makeBook(overrides: Partial<BookResponse> = {}): BookResponse {
    const base: Record<string, unknown> = {
      id: 1,
      title: 'Test Book',
      authorName: 'Test Author',
      genre: 'fiction',
      mine: false,
      borrowed: false,
      shareable: true,
      reservedByMe: false,
      borrowedByMe: false,
      wishlisted: false,
      hasCover: false,
      queueLength: 0,
      ownerId: 10,
      ownerName: 'Owner',
      rating: 4,
      isbn: null,
      synopsis: null,
    };

    return { ...base, ...overrides } as BookResponse;
  }

  function createFixture(): ComponentFixture<BookDetailComponent> {
    const fixture = TestBed.createComponent(BookDetailComponent);
    fixture.detectChanges();
    return fixture;
  }

  function borrowCountElement(fixture: ComponentFixture<BookDetailComponent>): HTMLElement | null {
    return fixture.nativeElement.querySelector('.borrow-count');
  }

  beforeEach(() => {
    currentBook = makeBook();
    currentFeedbacks = { content: [] } as PageResponseFeedbackResponse;

    const api = {
      invoke: jasmine.createSpy('invoke').and.callFake((fn: unknown) => {
        if (fn === get) {
          return of(currentBook);
        }

        if (fn === forBook) {
          return of(currentFeedbacks);
        }

        return of(null);
      }),
    };

    const toast = {
      show: jasmine.createSpy('show'),
      apiError: jasmine.createSpy('apiError'),
    };

    const route = {
      snapshot: {
        paramMap: {
          get: jasmine.createSpy('get').and.returnValue('1'),
        },
      },
    };

    TestBed.configureTestingModule({
      imports: [BookDetailComponent],
      providers: [
        { provide: Api, useValue: api },
        { provide: ToastService, useValue: toast },
        { provide: ActivatedRoute, useValue: route },
      ],
    }).overrideTemplate(BookDetailComponent, `
      @if (book(); as b) {
        <p class="borrow-count mt-2 text-sm text-ink-soft">book.borrowCount: {{ b.borrowCount ?? 0 }}</p>
      }
    `);
  });

  it('displays the current borrow count for a loaded book', () => {
    currentBook = makeBook({ borrowCount: 42 });
    const fixture = createFixture();

    const element = borrowCountElement(fixture);

    expect(element).withContext('.borrow-count element should be rendered').toBeTruthy();
    expect(element?.textContent?.trim()).toBe('book.borrowCount: 42');
  });

  it('falls back to zero when borrowCount is missing', () => {
    currentBook = makeBook();
    const fixture = createFixture();

    expect(borrowCountElement(fixture)?.textContent?.trim()).toBe('book.borrowCount: 0');
  });

  it('falls back to zero when borrowCount is null', () => {
    currentBook = makeBook({ borrowCount: null as unknown as number });
    const fixture = createFixture();

    expect(borrowCountElement(fixture)?.textContent?.trim()).toBe('book.borrowCount: 0');
  });

  it('renders a large borrow count without altering the value', () => {
    currentBook = makeBook({ borrowCount: 1_000_000_000 });
    const fixture = createFixture();

    expect(borrowCountElement(fixture)?.textContent?.trim()).toBe('book.borrowCount: 1000000000');
  });

  it('does not render the borrow count when no book is loaded', () => {
    currentBook = null;
    const fixture = createFixture();

    expect(borrowCountElement(fixture)).toBeNull();
  });
});