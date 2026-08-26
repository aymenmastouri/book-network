import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';

import { get } from '../api/fn/books/get';
import { forBook } from '../api/fn/feedback/for-book';
import { give } from '../api/fn/feedback/give';
import { borrow } from '../api/fn/lending/borrow';
import { BookResponse } from '../api/models/book-response';
import { PageResponseFeedbackResponse } from '../api/models/page-response-feedback-response';
import { Api } from '../core/api';
import { StarRatingComponent } from '../shared/star-rating.component';
import { ToastService } from '../shared/toast.service';

/** One book in full: synopsis, community feedback, and a place to add yours. */
@Component({
  selector: 'pt-book-detail',
  imports: [TranslocoDirective, DatePipe, FormsModule, StarRatingComponent],
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
            @if (b.borrowed) {
              <p class="mt-4 rounded-md bg-warn/10 px-3 py-2 text-center text-sm text-warn">
                {{ t('status.borrowed') }}
              </p>
            }
          </div>

          <div>
            <h1 class="font-display text-3xl font-semibold">{{ b.title }}</h1>
            <p class="mt-1 text-lg text-ink-soft">{{ b.authorName }}</p>
            <div class="mt-2 flex items-center gap-3 text-sm text-ink-soft">
              <pt-star-rating [value]="b.rating ?? 0" />
              @if (b.isbn) { <span>ISBN {{ b.isbn }}</span> }
              @if (!b.mine) { <span>{{ t('book.sharedBy', { name: b.ownerName }) }}</span> }
            </div>
            @if (b.synopsis) {
              <p class="mt-5 max-w-2xl leading-relaxed">{{ b.synopsis }}</p>
            }

            <h2 class="font-display mt-10 text-xl font-semibold">{{ t('feedback.title') }}</h2>

            @if (!b.mine) {
              <form (ngSubmit)="submitFeedback()" class="mt-3 max-w-2xl rounded-lg border border-shelf bg-card p-4">
                <div class="flex items-center gap-3">
                  <span class="text-sm text-ink-soft">{{ t('feedback.yourRating') }}</span>
                  <pt-star-rating [(value)]="newRating" [interactive]="true" />
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
                        <pt-star-rating [value]="item.rating ?? 0" />
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
