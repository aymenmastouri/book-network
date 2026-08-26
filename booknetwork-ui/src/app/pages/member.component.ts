import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';

import { books } from '../api/fn/members/books';
import { member } from '../api/fn/members/member';
import { borrow } from '../api/fn/lending/borrow';
import { reserve } from '../api/fn/reservations/reserve';
import { add } from '../api/fn/wishlist/add';
import { remove } from '../api/fn/wishlist/remove';
import { BookResponse } from '../api/models/book-response';
import { MemberResponse } from '../api/models/member-response';
import { PageResponseBookResponse } from '../api/models/page-response-book-response';
import { Api } from '../core/api';
import { BookCardComponent } from '../shared/book-card.component';
import { PaginatorComponent } from '../shared/paginator.component';
import { ToastService } from '../shared/toast.service';

/** A member's public shelf. */
@Component({
  selector: 'bn-member',
  imports: [TranslocoDirective, DatePipe, BookCardComponent, PaginatorComponent],
  template: `
    <ng-container *transloco="let t">
      @if (profile(); as m) {
        <h1 class="font-display text-3xl font-semibold">{{ m.fullName }}</h1>
        <p class="mb-6 mt-1 text-sm text-ink-soft">
          {{ t('member.since', { date: m.memberSince | date: 'mediumDate' }) }}
          · {{ t('member.shares', { count: m.sharedBooks }) }}
        </p>
      }

      <h2 class="font-display mb-4 text-lg font-semibold">{{ t('member.shelfTitle') }}</h2>
      @if (shelf(); as page) {
        @if (page.content?.length) {
          <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            @for (book of page.content; track book.id) {
              <bn-book-card [book]="book" (wishlistToggle)="toggleWishlist(book)">
                @if (!book.borrowed && book.shareable) {
                  <button (click)="borrowBook(book.id!)"
                          class="w-full rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-deep">
                    {{ t('book.borrow') }}
                  </button>
                } @else if (book.borrowed && !book.reservedByMe) {
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
        }
      }
    </ng-container>
  `,
})
export class MemberComponent implements OnInit {
  private readonly api = inject(Api);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);

  protected readonly profile = signal<MemberResponse | null>(null);
  protected readonly shelf = signal<PageResponseBookResponse | null>(null);
  protected readonly pageIndex = signal(0);

  private memberId = '';

  ngOnInit(): void {
    this.memberId = this.route.snapshot.paramMap.get('id') ?? '';
    this.api.invoke(member, { id: this.memberId }).subscribe((m) => this.profile.set(m));
    this.load(0);
  }

  protected load(page: number): void {
    this.pageIndex.set(page);
    this.api.invoke(books, { id: this.memberId, page, size: 12 })
      .subscribe((result) => this.shelf.set(result));
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

  protected toggleWishlist(book: BookResponse): void {
    const call = book.wishlisted
      ? this.api.invoke(remove, { id: book.id! })
      : this.api.invoke(add, { id: book.id! });
    call.subscribe(() => {
      this.toast.show('ok', book.wishlisted ? 'toasts.wishlistRemoved' : 'toasts.wishlistAdded');
      this.load(this.pageIndex());
    });
  }
}
