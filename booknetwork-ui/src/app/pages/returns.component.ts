import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';

import { approveReturn } from '../api/fn/lending/approve-return';
import { returnedToMe } from '../api/fn/lending/returned-to-me';
import { PageResponseLoanResponse } from '../api/models/page-response-loan-response';
import { Api } from '../core/api';
import { PaginatorComponent } from '../shared/paginator.component';
import { ToastService } from '../shared/toast.service';

/** Returns of the caller's own books — approving one frees the book again. */
@Component({
  selector: 'pt-returns',
  imports: [TranslocoDirective, RouterLink, DatePipe, PaginatorComponent],
  template: `
    <ng-container *transloco="let t">
      <h1 class="font-display mb-1 text-3xl font-semibold">{{ t('returns.title') }}</h1>
      <p class="mb-6 text-sm text-ink-soft">{{ t('returns.subtitle') }}</p>

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
                  {{ t('returns.returnedOn', { date: loan.returnedAt | date: 'mediumDate' }) }}
                </span>
                @if (loan.approved) {
                  <span class="rounded-full bg-ok/10 px-2.5 py-0.5 text-xs font-medium text-ok">
                    {{ t('returns.approved') }}
                  </span>
                } @else {
                  <button (click)="approve(loan.bookId!)"
                          class="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-deep">
                    {{ t('returns.approve') }}
                  </button>
                }
              </li>
            }
          </ul>
          <pt-paginator [page]="pageIndex()" [totalPages]="page.totalPages ?? 0"
                        (pageChange)="load($event)" />
        } @else {
          <p class="rounded-lg border border-dashed border-shelf p-10 text-center text-ink-soft">
            {{ t('returns.empty') }}
          </p>
        }
      }
    </ng-container>
  `,
})
export class ReturnsComponent implements OnInit {
  private readonly api = inject(Api);
  private readonly toast = inject(ToastService);

  protected readonly loans = signal<PageResponseLoanResponse | null>(null);
  protected readonly pageIndex = signal(0);

  ngOnInit(): void {
    this.load(0);
  }

  protected load(page: number): void {
    this.pageIndex.set(page);
    this.api.invoke(returnedToMe, { page, size: 12 }).subscribe((result) => this.loans.set(result));
  }

  protected approve(bookId: number): void {
    this.api.invoke(approveReturn, { id: bookId }).subscribe({
      next: () => {
        this.toast.show('ok', 'toasts.approved');
        this.load(this.pageIndex());
      },
      error: (err) => this.toast.apiError(err),
    });
  }
}
