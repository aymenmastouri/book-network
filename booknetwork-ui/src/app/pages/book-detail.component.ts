import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';

import { get } from '../api/fn/books/get';
import { forBook } from '../api/fn/feedback/for-book';
import { give } from '../api/fn/feedback/give';
import { borrow } from '../api/fn/lending/borrow';
import { cancel } from '../api/fn/reservations/cancel';
import { reserve } from '../api/fn/reservations/reserve';
import { add } from '../api/fn/wishlist/add';
import { remove } from '../api/fn/wishlist/remove';
import { BookResponse } from '../api/models/book-response';
import { PageResponseFeedbackResponse } from '../api/models/page-response-feedback-response';
import { Api } from '../core/api';
import { StarRatingComponent } from '../shared/star-rating.component';
import { ToastService } from '../shared/toast.service';

/** One book in full: synopsis, queue, community feedback, and every action. */
@Component({
  selector: 'bn-book-detail',
  imports: [TranslocoDirective, DatePipe, FormsModule, RouterLink, StarRatingComponent],
  template: `
    <ng-container *transloco="let t">
      @if (book(); as b) {
        <div class="grid gap-8 lg:grid-cols-[260px_1fr]">
          <div>
            @if (b.hasCover) {
              <img [src]="api.coverUrl(b.id!)" [alt]="b.title"
                   class="w-full rounded-lg border border-shelf object-cover shadow-sm" />
            } @else {
              <div class="flex aspect-[3/4] items-center justify-center rounded-lg border border-shelf bg-gradient-to-br from-shelf to-brand/25 p-6">
                <span class="font-display text-center text-xl italic text-brand-deep">{{ b.title }}</span>
              </div>
            }
            @if (!b.mine && !b.borrowed && b.shareable) {
              <button (click)="borrowThis()"
                      class="mt-4 w-full rounded-md bg-brand px-4 py-2 font-medium text-white hover:bg-brand-deep">
                {{ t('book.borrow') }}
              </button>
            }
            @if (!b.mine && b.borrowed && !b.reservedByMe) {
              <button (click)="reserveThis()"
                      class="mt-4 w-full rounded-md border border-brand px-4 py-2 font-medium text-brand-deep hover:bg-shelf">
                {{ t('book.reserve') }}
              </button>
            }
            @if (b.reservedByMe) {
              <button (click)="cancelReservation()"
                      class="mt-4 w-full rounded-md border border-shelf px-4 py-2 hover:bg-shelf">
                {{ t('book.cancelReservation') }}
              </button>
            }
            @if (!b.mine) {
              <button (click)="toggleWishlist()"
                      class="mt-2 w-full rounded-md border border-shelf px-4 py-2 text-sm hover:bg-shelf"
                      [class.text-brand-deep]="b.wishlisted">
                {{ b.wishlisted ? '♥ ' + t('wishlist.remove') : '♡ ' + t('wishlist.add') }}
              </button>
            }
            @if (b.borrowed) {
              <p class="mt-4 rounded-md bg-warn/10 px-3 py-2 text-center text-sm text-warn">
                {{ t('status.borrowed') }}
                @if (b.queueLength) {
                  · {{ t('book.queue', { count: b.queueLength }) }}
                }
              </p>
            }
          </div>

          <div>
            <h1 class="font-display text-3xl font-semibold">{{ b.title }}</h1>
            <p class="mt-1 text-lg text-ink-soft">{{ b.authorName }}</p>
            <div class="mt-2 flex flex-wrap items-center gap-3 text-sm text-ink-soft">
              <bn-star-rating [value]="b.rating ?? 0" />
              <span class="rounded-full bg-shelf px-2 py-0.5 text-xs">{{ t('genres.' + b.genre) }}</span>
              @if (b.isbn) { <span>ISBN {{ b.isbn }}</span> }
              @if (!b.mine) {
                <a [routerLink]="['/members', b.ownerId]" class="hover:text-brand-deep hover:underline">
                  {{ t('book.sharedBy', { name: b.ownerName }) }}
                </a>
              }
            </div>
            @if (b.synopsis) {
              <p class="mt-5 max-w-2xl leading-relaxed">{{ b.synopsis }}</p>
            }

            <h2 class="font-display mt-10 text-xl font-semibold">{{ t('feedback.title') }}</h2>

            @if (!b.mine) {
              <form (ngSubmit)="submitFeedback()" class="mt-3 max-w-2xl rounded-lg border border-shelf bg-card p-4">
                <div class="flex items-center gap-3">
                  <span class="text-sm text-ink-soft">{{ t('feedback.yourRating') }}</span>
                  <bn-star-rating [(value)]="newRating" [interactive]="true" />
                </div>
                <textarea [(ngModel)]="newComment" name="comment" rows="2"
                          [placeholder]="t('feedback.placeholder')"
                          class="mt-3 w-full rounded-md border border-shelf bg-paper px-3 py-2 text-sm focus:outline-brand"></textarea>
                <button type="submit" [disabled]="newRating() === 0"
                        class="mt-2 rounded-md bg-brand px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-deep disabled:opacity-40">
                  {{ t('feedback.submit') }}
                </button>
              </form>
            }

            @if (feedbacks(); as fb) {
              @if (fb.content?.length) {
                <ul class="mt-4 max-w-2xl space-y-3">
                  @for (item of fb.content; track item.id) {
                    <li class="rounded-lg border border-shelf bg-card p-4">
                      <div class="flex items-center justify-between">
                        <span class="text-sm font-semibold">
                          {{ item.mine ? t('feedback.you') : item.authorName }}
                        </span>
                        <bn-star-rating [value]="item.rating ?? 0" />
                      </div>
                      @if (item.comment) {
                        <p class="mt-1.5 text-sm leading-relaxed">{{ item.comment }}</p>
                      }
                      <p class="mt-1.5 text-xs text-ink-soft">{{ item.createdAt | date: 'mediumDate' }}</p>
                    </li>
                  }
                </ul>
              } @else {
                <p class="mt-4 text-sm text-ink-soft">{{ t('feedback.empty') }}</p>
              }
            }
          </div>
        </div>
      }
    </ng-container>
  `,
})
export class BookDetailComponent implements OnInit {
  protected readonly api = inject(Api);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);

  protected readonly book = signal<BookResponse | null>(null);
  protected readonly feedbacks = signal<PageResponseFeedbackResponse | null>(null);
  protected readonly newRating = signal(0);
  protected readonly newComment = signal('');

  private bookId = 0;

  ngOnInit(): void {
    this.bookId = Number(this.route.snapshot.paramMap.get('id'));
    this.reload();
  }

  private reload(): void {
    this.api.invoke(get, { id: this.bookId }).subscribe((b) => this.book.set(b));
    this.api.invoke(forBook, { id: this.bookId, page: 0, size: 20 })
      .subscribe((fb) => this.feedbacks.set(fb));
  }

  protected borrowThis(): void {
    this.api.invoke(borrow, { id: this.bookId }).subscribe({
      next: () => {
        this.toast.show('ok', 'toasts.borrowed');
        this.reload();
      },
      error: (err) => this.toast.apiError(err),
    });
  }

  protected reserveThis(): void {
    this.api.invoke(reserve, { id: this.bookId }).subscribe({
      next: () => {
        this.toast.show('ok', 'toasts.reserved');
        this.reload();
      },
      error: (err) => this.toast.apiError(err),
    });
  }

  protected cancelReservation(): void {
    this.api.invoke(cancel, { id: this.bookId }).subscribe({
      next: () => {
        this.toast.show('ok', 'toasts.reservationCanceled');
        this.reload();
      },
      error: (err) => this.toast.apiError(err),
    });
  }

  protected toggleWishlist(): void {
    const b = this.book();
    if (!b) {
      return;
    }
    const call = b.wishlisted
      ? this.api.invoke(remove, { id: this.bookId })
      : this.api.invoke(add, { id: this.bookId });
    call.subscribe({
      next: () => {
        this.toast.show('ok', b.wishlisted ? 'toasts.wishlistRemoved' : 'toasts.wishlistAdded');
        this.reload();
      },
      error: (err) => this.toast.apiError(err),
    });
  }

  protected submitFeedback(): void {
    this.api
      .invoke(give, { body: { bookId: this.bookId, rating: this.newRating(), comment: this.newComment() } })
      .subscribe({
        next: () => {
          this.toast.show('ok', 'toasts.feedbackSaved');
          this.newRating.set(0);
          this.newComment.set('');
          this.reload();
        },
        error: (err) => this.toast.apiError(err),
      });
  }
}
