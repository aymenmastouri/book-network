import { DatePipe } from '@angular/common';
import {
  Component,
  Directive,
  EventEmitter,
  Input,
  Output,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EMPTY, of } from 'rxjs';

import { get } from '../api/fn/books/get';
import { Api } from '../core/api';
import { ToastService } from '../shared/toast.service';
import { BookDetailComponent } from './book-detail.component';

// The real TranslocoDirective instantiates the *transloco template with a
// context whose `$implicit` is the `t` translation function itself, so
// `*transloco="let t"` binds a callable to `t`. The mock mirrors that shape
// (and also exposes a `t` key with the same function) so template calls such
// as `t('book.borrowCount')` resolve to this identity translator.
interface MockTranslocoContext {
  $implicit: (key: string, params?: Record<string, unknown>) => string;
  t: (key: string, params?: Record<string, unknown>) => string;
}

@Directive({
  selector: '[transloco]',
  standalone: true,
  exportAs: 'transloco',
})
class MockTranslocoDirective {
  private readonly translate = (key: string): string => key;

  private readonly context: MockTranslocoContext = {
    $implicit: this.translate,
    t: this.translate,
  };

  @Input('transloco')
  set transloco(_value: unknown) {}

  constructor(
    private readonly template: TemplateRef<MockTranslocoContext>,
    private readonly viewContainer: ViewContainerRef,
  ) {}

  ngAfterViewInit(): void {
    if (this.viewContainer.length === 0) {
      this.viewContainer.createEmbeddedView(this.template, this.context);
    }
  }
}

@Component({
  selector: 'bn-star-rating',
  standalone: true,
  template: `<span class="mock-star-rating"></span>`,
})
class MockStarRatingComponent {
  @Input() value: any = 0;
  @Input() interactive: boolean = false;
  @Output('valueChange') valueChange = new EventEmitter<any>();
}

describe('BookDetailComponent', () => {
  let currentBook: any;

  function makeBook(overrides: Record<string, any> = {}): any {
    return {
      id: 1,
      title: 'Sample Book',
      authorName: 'Sample Author',
      genre: 'fiction',
      hasCover: false,
      mine: true,
      borrowed: false,
      borrowedByMe: false,
      reservedByMe: false,
      shareable: false,
      wishlisted: false,
      queueLength: 0,
      rating: 4,
      isbn: null,
      synopsis: null,
      borrowCount: 0,
      ...overrides,
    };
  }

  function createFixture(): ComponentFixture<BookDetailComponent> {
    const fixture = TestBed.createComponent(BookDetailComponent);
    fixture.detectChanges();
    fixture.detectChanges();
    return fixture;
  }

  function queryBorrowCount(fixture: ComponentFixture<BookDetailComponent>): Element | null {
    return fixture.nativeElement.querySelector('.borrow-count');
  }

  function borrowCountText(fixture: ComponentFixture<BookDetailComponent>): string {
    const element = queryBorrowCount(fixture);
    expect(element).withContext('the borrow-count element should be rendered').not.toBeNull();
    return element ? (element.textContent ?? '').trim() : '';
  }

  function expectNoBorrowCount(fixture: ComponentFixture<BookDetailComponent>): void {
    const element = queryBorrowCount(fixture);
    expect(element).withContext('the borrow-count element should not be rendered').toBeNull();
  }

  beforeEach(async () => {
    currentBook = makeBook();

    const apiMock: any = {
      invoke: (fn: any) => (fn === get ? of(currentBook) : EMPTY),
    };
    const toastMock: any = {
      show: () => {},
      apiError: () => {},
    };
    const routeMock: any = {
      snapshot: {
        paramMap: {
          get: () => '1',
        },
      },
    };
    const routerMock: any = {
      createUrlTree: () => [],
    };

    TestBed.overrideComponent(BookDetailComponent, {
      set: {
        imports: [
          MockTranslocoDirective,
          DatePipe,
          FormsModule,
          RouterLink,
          MockStarRatingComponent,
        ],
      },
    });

    TestBed.configureTestingModule({
      imports: [BookDetailComponent],
      providers: [
        { provide: Api, useValue: apiMock },
        { provide: ToastService, useValue: toastMock },
        { provide: ActivatedRoute, useValue: routeMock },
        { provide: Router, useValue: routerMock },
      ],
    }).compileComponents();
  });

  it('renders the translated borrow count when a book provides borrowCount', () => {
    currentBook = makeBook({ borrowCount: 7 });

    const fixture = createFixture();

    expect(borrowCountText(fixture)).toBe('book.borrowCount: 7');
  });

  it('renders 0 for missing or null borrowCount and preserves zero/large values', () => {
    const cases: Array<[borrowCount: any, expected: string]> = [
      [undefined, '0'],
      [null, '0'],
      [0, '0'],
      [1000000, '1000000'],
    ];

    for (const [borrowCount, expected] of cases) {
      currentBook = makeBook({ borrowCount });
      const fixture = createFixture();

      expect(borrowCountText(fixture))
        .withContext(`borrowCount=${String(borrowCount)}`)
        .toBe(`book.borrowCount: ${expected}`);
    }
  });

  it('does not render a borrow count when the book is missing', () => {
    currentBook = null;

    const fixture = createFixture();

    expectNoBorrowCount(fixture);
  });
});