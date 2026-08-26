import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';

import { borrowed } from '../api/fn/lending/borrowed';
import { giveBack } from '../api/fn/lending/give-back';
import { PageResponseLoanResponse } from '../api/models/page-response-loan-response';
import { Api } from '../core/api';
import { PaginatorComponent } from '../shared/paginator.component';
import { ToastService } from '../shared/toast.service';

/** Everything the caller has borrowed, past and present. */
@Component({
  selector: 'pt-borrowed',
  imports: [TranslocoDirective, RouterLink, DatePipe, PaginatorComponent],
  template: `
    <ng-container *transloco="let t">
      <h1 class="font-display mb-1 text-3xl font-semibold">{{ t('borrowed.title') }}</h1>
      <p class="mb-6 text-sm text-ink-soft">{{ t('borrowed.subtitle') }}</p>

      @if (loans(); as page) {
        @if (page.content?.length) {
          <ul class="divide-y divide-shelf overflow-hidden rounded-lg border border-shelf bg-card">
            @for (loan of page.content; track loan.id) {
              <li class="flex flex-wrap items-center gap-3 px-4 py-3">
                <div class="min-w-0 flex-1">
                  <a [routerLink]="['/books', loan.bookId]"
                     class="font-display font-semibold hover:text-brand-deep">{{ loan.title }}</a>
                  <p class="text-sm text-ink-soft">{{ loan.authorName }}</p>
                </div>
                <span class="text-xs text-ink-soft">
                  {{ t('borrowed.since', { date: loan.borrowedAt | date: 'mediumDate' }) }}
                </span>
                @if (loan.approved) {
                  <span class="chip bg-shelf text-ink-soft">{{ t('borrowed.closed') }}</span>
                } @else if (loan.returned) {
                  <span class="chip bg-brand/10 text-brand-deep">{{ t('borrowed.waitingApproval') }}</span>
                } @else {
                  <button (click)="returnBook(loan.bookId!)"
                          class="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-deep">
                    {{ t('borrowed.return') }}
                  </button>
                }
              </li>
            }
          </ul>
          <pt-paginator [page]="pageIndex()" [totalPages]="page.totalPages ?? 0"
                        (pageChange)="load($event)" />
        } @else {
          <p class="rounded-lg border border-dashed border-shelf p-10 text-center text-ink-soft">
            {{ t('borrowed.empty') }}
          </p>
        }
      }
    </ng-container>
  `,
  styles: `.chip { border-radius: 9999px; padding: 0.125rem 0.625rem; font-size: 0.75rem; font-weight: 500; }`,
})
export class BorrowedComponent implements OnInit {
  private readonly api = inject(Api);
  private readonly toast = inject(ToastService);

  protected readonly loans = signal<PageResponseLoanResponse | null>(null);
  protected readonly pageIndex = signal(0);

  ngOnInit(): void {
    this.load(0);
  }

  protected load(page: number): void {
    this.pageIndex.set(page);
    this.api.invoke(borrowed, { page, size: 12 }).subscribe((result) => this.loans.set(result));
  }

  protected returnBook(bookId: number): void {
    this.api.invoke(giveBack, { id: bookId }).subscribe({
      next: () => {
        this.toast.show('ok', 'toasts.returned');
        this.load(this.pageIndex());
      },
      error: (err) => this.toast.apiError(err),
    });
  }
}
