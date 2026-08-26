import { Component, input, output } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'pt-paginator',
  imports: [TranslocoDirective],
  template: `
    <ng-container *transloco="let t">
      @if (totalPages() > 1) {
        <nav class="mt-6 flex items-center justify-center gap-4 text-sm">
          <button (click)="pageChange.emit(page() - 1)" [disabled]="page() === 0"
                  class="rounded-md border border-shelf px-3 py-1.5 hover:bg-shelf disabled:opacity-40">
            {{ t('paging.previous') }}
          </button>
          <span class="text-ink-soft">{{ t('paging.of', { page: page() + 1, total: totalPages() }) }}</span>
          <button (click)="pageChange.emit(page() + 1)" [disabled]="page() >= totalPages() - 1"
                  class="rounded-md border border-shelf px-3 py-1.5 hover:bg-shelf disabled:opacity-40">
            {{ t('paging.next') }}
          </button>
        </nav>
      }
    </ng-container>
  `,
})
export class PaginatorComponent {
  readonly page = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly pageChange = output<number>();
}
