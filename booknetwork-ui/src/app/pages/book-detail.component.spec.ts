import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { BookResponse } from '../api/models/book-response';
import { BookDetailComponent } from './book-detail.component';

/**
 * Renders the detail view with mocked HTTP and a real (testing) Transloco
 * service so the borrow-count line is exercised exactly as a member sees it.
 */
describe('BookDetailComponent (borrowCount)', () => {
  let http: HttpTestingController;
  const rootUrl = 'http://localhost:8088/api/v1';

  /** Boots the component for book id 7 and lets its book + feedback requests settle. */
  function mount(book: BookResponse) {
    const fixture = TestBed.createComponent(BookDetailComponent);
    fixture.detectChanges(); // fires ngOnInit → issues GET /books/7 and GET /books/7/feedbacks
    http.expectOne((r) => r.url === `${rootUrl}/books/7`).flush(book);
    http.expectOne((r) => r.url.startsWith(`${rootUrl}/books/7/feedbacks`)).flush({ content: [] });
    fixture.detectChanges(); // reflect book + feedbacks in the DOM
    http.verify();
    return fixture;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        TranslocoTestingModule.forRoot({
          langs: {
            en: {
              book: { borrowCount: 'Times borrowed' },
              feedback: { title: 'Feedback', empty: 'No feedback yet.' },
            },
          },
          translocoConfig: { availableLangs: ['en'] },
        }),
      ],
      providers: [{ provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '7' } } } }],
    });
    http = TestBed.inject(HttpTestingController);
  });

  it('shows the borrow count with a member-facing label', fakeAsync(() => {
    const fixture = mount({ id: 7, title: 'Dune', mine: true, borrowCount: 3 });
    tick();

    const line = fixture.nativeElement.querySelector('.borrow-count');
    expect(line).withContext('renders the labelled element').not.toBeNull();
    expect(line.textContent).withContext('resolves the label').toContain('Times borrowed');
    expect(line.textContent).withContext('shows the count').toContain('3');
  }));

  it('renders zero for a book that was never borrowed', fakeAsync(() => {
    const fixture = mount({ id: 7, title: 'Dune', mine: true }); // no borrowCount on the response
    tick();

    const line = fixture.nativeElement.querySelector('.borrow-count');
    expect(line).withContext('renders the labelled element').not.toBeNull();
    expect(line.textContent).withContext('absent count renders zero, not an empty field').toContain('Times borrowed: 0');
  }));
});
