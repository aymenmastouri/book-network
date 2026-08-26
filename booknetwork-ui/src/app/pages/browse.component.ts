import { Component, OnInit, inject, signal } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';

import { browse } from '../api/fn/books/browse';
import { borrow } from '../api/fn/lending/borrow';
import { PageResponseBookResponse } from '../api/models/page-response-book-response';
import { Api } from '../core/api';
import { BookCardComponent } from '../shared/book-card.component';
import { PaginatorComponent } from '../shared/paginator.component';
import { ToastService } from '../shared/toast.service';

/** Every shareable book from other members — the community shelf. */
@Component({
  selector: 'pt-browse',
  imports: [TranslocoDirective, BookCardComponent, PaginatorComponent],
  template: `
    <ng-container *transloco="let t">
      <div class="mb-6 flex items-end justify-between">
        <div>
          <h1 class="font-display text-3xl font-semibold">{{ t('browse.title') }}</h1>
          <p class="mt-1 text-sm text-ink-soft">{{ t('browse.subtitle') }}</p>
        </div>
      </div>

      @if (books(); as page) {
        @if (page.content?.length) {
          <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            @for (book of page.content; track book.id) {
              <pt-book-card [book]="book">
                @if (!book.borrowed && book.shareable) {
                  <button (click)="borrowBook(book.id!)"
                          class="w-full rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-deep">
                    {{ t('book.borrow') }}
                  </button>
                }
              </pt-book-card>
            }
          </div>
          <pt-paginator [page]="pageIndex()" [totalPages]="page.totalPages ?? 0"
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

  protected readonly books = signal<PageResponseBookResponse | null>(null);
  protected readonly pageIndex = signal(0);

  ngOnInit(): void {
    this.load(0);
  }

  protected load(page: number): void {
    this.pageIndex.set(page);
    this.api.invoke(browse, { page, size: 12 }).subscribe((result) => this.books.set(result));
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
}
