import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';

import { mine } from '../api/fn/books/mine';
import { toggleArchived } from '../api/fn/books/toggle-archived';
import { toggleShareable } from '../api/fn/books/toggle-shareable';
import { uploadCover } from '../api/fn/books/upload-cover';
import { PageResponseBookResponse } from '../api/models/page-response-book-response';
import { Api } from '../core/api';
import { BookCardComponent } from '../shared/book-card.component';
import { PaginatorComponent } from '../shared/paginator.component';
import { ToastService } from '../shared/toast.service';

/** The caller's own books, with the owner-only controls. */
@Component({
  selector: 'pt-shelf',
  imports: [TranslocoDirective, RouterLink, BookCardComponent, PaginatorComponent],
  template: `
    <ng-container *transloco="let t">
      <div class="mb-6 flex items-end justify-between">
        <div>
          <h1 class="font-display text-3xl font-semibold">{{ t('shelf.title') }}</h1>
          <p class="mt-1 text-sm text-ink-soft">{{ t('shelf.subtitle') }}</p>
        </div>
        <a routerLink="/books/new"
           class="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-deep">
          {{ t('shelf.add') }}
        </a>
      </div>

      @if (books(); as page) {
        @if (page.content?.length) {
          <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            @for (book of page.content; track book.id) {
              <pt-book-card [book]="book">
                <div class="flex flex-wrap gap-1.5 text-xs">
                  <a [routerLink]="['/books', book.id, 'edit']" class="owner-btn">{{ t('shelf.edit') }}</a>
                  <button (click)="onToggleShareable(book.id!)" class="owner-btn">
                    {{ book.shareable ? t('shelf.unshare') : t('shelf.share') }}
                  </button>
                  <button (click)="onToggleArchived(book.id!)" class="owner-btn">
                    {{ book.archived ? t('shelf.restore') : t('shelf.archive') }}
                  </button>
                  <label class="owner-btn cursor-pointer">
                    {{ t('shelf.cover') }}
                    <input type="file" accept="image/jpeg,image/png,image/webp" class="hidden"
                           (change)="onCover(book.id!, $event)" />
                  </label>
                </div>
              </pt-book-card>
            }
          </div>
          <pt-paginator [page]="pageIndex()" [totalPages]="page.totalPages ?? 0"
                        (pageChange)="load($event)" />
        } @else {
          <p class="rounded-lg border border-dashed border-shelf p-10 text-center text-ink-soft">
            {{ t('shelf.empty') }}
          </p>
        }
      }
    </ng-container>
  `,
  styles: `
    .owner-btn {
      border: 1px solid var(--color-shelf); border-radius: 0.375rem;
      padding: 0.25rem 0.5rem; color: var(--color-ink-soft);
    }
    .owner-btn:hover { background: var(--color-shelf); color: var(--color-ink); }
  `,
})
export class ShelfComponent implements OnInit {
  private readonly api = inject(Api);
  private readonly toast = inject(ToastService);

  protected readonly books = signal<PageResponseBookResponse | null>(null);
  protected readonly pageIndex = signal(0);

  ngOnInit(): void {
    this.load(0);
  }

  protected load(page: number): void {
    this.pageIndex.set(page);
    this.api.invoke(mine, { page, size: 12 }).subscribe((result) => this.books.set(result));
  }

  protected onToggleShareable(id: number): void {
    this.api.invoke(toggleShareable, { id }).subscribe(() => this.load(this.pageIndex()));
  }

  protected onToggleArchived(id: number): void {
    this.api.invoke(toggleArchived, { id }).subscribe(() => this.load(this.pageIndex()));
  }

  protected onCover(id: number, event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) {
      return;
    }
    this.api.invoke(uploadCover, { id, body: { file } }).subscribe({
      next: () => {
        this.toast.show('ok', 'toasts.coverUploaded');
        this.load(this.pageIndex());
      },
      error: (err) => this.toast.apiError(err),
    });
  }
}
