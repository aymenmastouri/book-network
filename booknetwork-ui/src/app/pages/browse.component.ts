import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoDirective } from '@jsverse/transloco';

import { browse } from '../api/fn/books/browse';
import { borrow } from '../api/fn/lending/borrow';
import { reserve } from '../api/fn/reservations/reserve';
import { cancel } from '../api/fn/reservations/cancel';
import { add } from '../api/fn/wishlist/add';
import { remove } from '../api/fn/wishlist/remove';
import { BookResponse } from '../api/models/book-response';
import { PageResponseBookResponse } from '../api/models/page-response-book-response';
import { Api } from '../core/api';
import { BookCardComponent } from '../shared/book-card.component';
import { PaginatorComponent } from '../shared/paginator.component';
import { ToastService } from '../shared/toast.service';

const GENRES = ['ALL', 'CLASSIC', 'CRIME', 'SCIFI', 'FANTASY', 'ROMANCE', 'HISTORY', 'NONFICTION', 'OTHER'] as const;

/** The community shelf: search it, filter it by genre, sort it, act on it. */
@Component({
  selector: 'bn-browse',
  imports: [TranslocoDirective, FormsModule, BookCardComponent, PaginatorComponent],
  template: `
    <ng-container *transloco="let t">
      <div class="mb-4 flex items-end justify-between">
        <div>
          <h1 class="font-display text-3xl font-semibold">{{ t('browse.title') }}</h1>
          <p class="mt-1 text-sm text-ink-soft">{{ t('browse.subtitle') }}</p>
        </div>
        <select [ngModel]="sort()" (ngModelChange)="setSort($event)"
                class="rounded-md border border-shelf bg-card px-3 py-1.5 text-sm">
          <option value="NEWEST">{{ t('sort.newest') }}</option>
          <option value="RATING">{{ t('sort.rating') }}</option>
        </select>
      </div>

      <input type="search" [ngModel]="query()" (ngModelChange)="setQuery($event)"
             [placeholder]="t('browse.search')"
             class="mb-3 w-full max-w-md rounded-md border border-shelf bg-card px-3 py-2 text-sm focus:outline-brand" />

      <div class="mb-6 flex flex-wrap gap-1.5">
        @for (g of genres; track g) {
          <button (click)="setGenre(g)"
                  class="rounded-full border px-3 py-1 text-xs font-medium"
                  [class.border-brand]="genre() === g"
                  [class.bg-brand]="genre() === g"
                  [class.text-white]="genre() === g"
                  [class.border-shelf]="genre() !== g"
                  [class.text-ink-soft]="genre() !== g">
            {{ t('genres.' + g) }}
          </button>
        }
      </div>

      @if (books(); as page) {
        @if (page.content?.length) {
          <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            @for (book of page.content; track book.id) {
              <bn-book-card [book]="book" (wishlistToggle)="toggleWishlist(book)">
                @if (!book.borrowed && book.shareable) {
                  <button (click)="borrowBook(book.id!)"
                          class="w-full rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-deep">
                    {{ t('book.borrow') }}
                  </button>
                } @else if (book.borrowed && book.reservedByMe) {
                  <button (click)="cancelReservation(book.id!)"
                          class="w-full rounded-md border border-brand px-3 py-1.5 text-sm font-medium text-brand-deep hover:bg-shelf">
                    {{ t('book.cancelReservation') }}
                  </button>
                } @else if (book.borrowed) {
                  <button (click)="reserveBook(book.id!)"
                          class="w-full rounded-md border border-brand px-3 py-1.5 text-sm font-medium text-brand-deep hover:bg-shelf">
                    {{ t('book.reserve') }}
                  </button>
                }
              </bn-book-card>
            }
          </div>
          <bn-paginator [page]="pageIndex()" [totalPages]="page.totalPages ?? 0"
                        (pageChange)="load($event)" />
        } @else {
          <p class="rounded-lg border border-dashed border-shelf p-10 text-center text-ink-soft">
            {{ t('browse.empty') }}
          </p>
        }
      }
    </ng-container>
  `,
})
export class BrowseComponent implements OnInit {
  private readonly api = inject(Api);
  private readonly toast = inject(ToastService);

  protected readonly genres = GENRES;
  protected readonly books = signal<PageResponseBookResponse | null>(null);
  protected readonly pageIndex = signal(0);
  protected readonly query = signal('');
  protected readonly genre = signal<(typeof GENRES)[number]>('ALL');
  protected readonly sort = signal<'NEWEST' | 'RATING'>('NEWEST');

  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.load(0);
  }

  protected load(page: number): void {
    this.pageIndex.set(page);
    const genre = this.genre();
    this.api.invoke(browse, {
      page,
      size: 12,
      q: this.query(),
      genre: genre === 'ALL' ? undefined : genre,
      sort: this.sort(),
    }).subscribe((result) => this.books.set(result));
  }

  protected setQuery(value: string): void {
    this.query.set(value);
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    this.searchTimer = setTimeout(() => this.load(0), 250);
  }

  protected setGenre(value: (typeof GENRES)[number]): void {
    this.genre.set(value);
    this.load(0);
  }

  protected setSort(value: 'NEWEST' | 'RATING'): void {
    this.sort.set(value);
    this.load(0);
  }

  protected borrowBook(id: number): void {
    this.api.invoke(borrow, { id }).subscribe({
      next: () => {
        this.toast.show('ok', 'toasts.borrowed');
        this.load(this.pageIndex());
      },
      error: (err) => this.toast.apiError(err),
    });
  }

  protected reserveBook(id: number): void {
    this.api.invoke(reserve, { id }).subscribe({
      next: () => {
        this.toast.show('ok', 'toasts.reserved');
        this.load(this.pageIndex());
      },
      error: (err) => this.toast.apiError(err),
    });
  }

  protected cancelReservation(id: number): void {
    this.api.invoke(cancel, { id }).subscribe({
      next: () => {
        this.toast.show('ok', 'toasts.reservationCanceled');
        this.load(this.pageIndex());
      },
      error: (err) => this.toast.apiError(err),
    });
  }

  protected toggleWishlist(book: BookResponse): void {
    const call = book.wishlisted
      ? this.api.invoke(remove, { id: book.id! })
      : this.api.invoke(add, { id: book.id! });
    call.subscribe({
      next: () => {
        this.toast.show('ok', book.wishlisted ? 'toasts.wishlistRemoved' : 'toasts.wishlistAdded');
        this.load(this.pageIndex());
      },
      error: (err) => this.toast.apiError(err),
    });
  }
}
