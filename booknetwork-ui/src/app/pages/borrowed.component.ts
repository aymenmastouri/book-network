import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';

import { borrowed } from '../api/fn/lending/borrowed';
import { giveBack } from '../api/fn/lending/give-back';
import { cancel } from '../api/fn/reservations/cancel';
import { myReservations } from '../api/fn/reservations/my-reservations';
import { PageResponseLoanResponse } from '../api/models/page-response-loan-response';
import { ReservationResponse } from '../api/models/reservation-response';
import { Api } from '../core/api';
import { PaginatorComponent } from '../shared/paginator.component';
import { ToastService } from '../shared/toast.service';

/** Everything the caller has borrowed — and where they stand in queues. */
@Component({
  selector: 'bn-borrowed',
  imports: [TranslocoDirective, RouterLink, DatePipe, PaginatorComponent],
  template: `
    <ng-container *transloco="let t">
      <h1 class="font-display mb-1 text-3xl font-semibold">{{ t('borrowed.title') }}</h1>
      <p class="mb-6 text-sm text-ink-soft">{{ t('borrowed.subtitle') }}</p>

      @if (reservations().length) {
        <h2 class="font-display mb-2 text-lg font-semibold">{{ t('reservations.title') }}</h2>
        <ul class="mb-8 divide-y divide-shelf overflow-hidden rounded-lg border border-shelf bg-card">
          @for (reservation of reservations(); track reservation.id) {
            <li class="flex flex-wrap items-center gap-3 px-4 py-3">
              <div class="min-w-0 flex-1">
                <a [routerLink]="['/books', reservation.bookId]"
                   class="font-display font-semibold hover:text-brand-deep">{{ reservation.title }}</a>
                <p class="text-sm text-ink-soft">{{ reservation.authorName }}</p>
              </div>
              <span class="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-medium text-brand-deep">
                {{ t('reservations.position', { position: reservation.position }) }}
              </span>
              <button (click)="cancelReservation(reservation.bookId!)"
                      class="rounded-md border border-shelf px-3 py-1.5 text-sm hover:bg-shelf">
                {{ t('reservations.cancel') }}
              </button>
            </li>
          }
        </ul>
      }

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
                  @if (loan.overdue) {
                    <span class="chip bg-warn text-white">{{ t('borrowed.overdue') }}</span>
                  } @else {
                    <span class="chip bg-shelf text-ink-soft">
                      {{ t('borrowed.due', { date: loan.dueAt | date: 'mediumDate' }) }}
                    </span>
                  }
                  <button (click)="returnBook(loan.bookId!)"
                          class="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-deep">
                    {{ t('borrowed.return') }}
                  </button>
                }
              </li>
            }
          </ul>
          <bn-paginator [page]="pageIndex()" [totalPages]="page.totalPages ?? 0"
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
  protected readonly reservations = signal<ReservationResponse[]>([]);
  protected readonly pageIndex = signal(0);

  ngOnInit(): void {
    this.load(0);
  }

  protected load(page: number): void {
    this.pageIndex.set(page);
    this.api.invoke(borrowed, { page, size: 12 }).subscribe((result) => this.loans.set(result));
    this.api.invoke(myReservations, {}).subscribe((result) => this.reservations.set(result));
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

  protected cancelReservation(bookId: number): void {
    this.api.invoke(cancel, { id: bookId }).subscribe({
      next: () => {
        this.toast.show('ok', 'toasts.reservationCanceled');
        this.load(this.pageIndex());
      },
      error: (err) => this.toast.apiError(err),
    });
  }
}
