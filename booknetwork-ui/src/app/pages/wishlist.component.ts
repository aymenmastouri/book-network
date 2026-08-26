import { Component, OnInit, inject, signal } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';

import { borrow } from '../api/fn/lending/borrow';
import { reserve } from '../api/fn/reservations/reserve';
import { list } from '../api/fn/wishlist/list';
import { remove } from '../api/fn/wishlist/remove';
import { PageResponseBookResponse } from '../api/models/page-response-book-response';
import { Api } from '../core/api';
import { BookCardComponent } from '../shared/book-card.component';
import { PaginatorComponent } from '../shared/paginator.component';
import { ToastService } from '../shared/toast.service';

/** Want-to-read bookmarks, ready to borrow the moment a book frees up. */
@Component({
  selector: 'bn-wishlist',
  imports: [TranslocoDirective, BookCardComponent, PaginatorComponent],
  template: `
    <ng-container *transloco="let t">
      <h1 class="font-display mb-1 text-3xl font-semibold">{{ t('wishlist.title') }}</h1>
      <p class="mb-6 text-sm text-ink-soft">{{ t('wishlist.subtitle') }}</p>

      @if (books(); as page) {
        @if (page.content?.length) {
          <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            @for (book of page.content; track book.id) {
              <bn-book-card [book]="book" (wishlistToggle)="removeFromWishlist(book.id!)">
                @if (!book.borrowed && book.shareable && !book.archived) {
                  <button (click)="borrowBook(book.id!)"
                          class="w-full rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-deep">
                    {{ t('book.borrow') }}
                  </button>
                } @else if (book.borrowed && !book.reservedByMe && !book.borrowedByMe) {
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
            {{ t('wishlist.empty') }}
          </p>
        }
      }
    </ng-container>
  `,
})
export class WishlistComponent implements OnInit {
  private readonly api = inject(Api);
  private readonly toast = inject(ToastService);

  protected readonly books = signal<PageResponseBookResponse | null>(null);
  protected readonly pageIndex = signal(0);

  ngOnInit(): void {
    this.load(0);
  }

  protected load(page: number): void {
    this.pageIndex.set(page);
    this.api.invoke(list, { page, size: 12 }).subscribe((result) => this.books.set(result));
  }

  protected removeFromWishlist(id: number): void {
    this.api.invoke(remove, { id }).subscribe(() => {
      this.toast.show('ok', 'toasts.wishlistRemoved');
      this.load(this.pageIndex());
    });
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
}
