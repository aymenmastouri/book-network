import { Component, computed, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';

import { BookResponse } from '../api/models/book-response';
import { Api } from '../core/api';
import { StarRatingComponent } from './star-rating.component';

/**
 * One book on a shelf: cover (or a spine-styled placeholder), the essentials,
 * a wishlist bookmark for other people's books, and whatever actions the page
 * projects into the footer slot. The owner's name links to their shelf.
 */
@Component({
  selector: 'bn-book-card',
  imports: [RouterLink, TranslocoDirective, StarRatingComponent],
  template: `
    <ng-container *transloco="let t">
      <article class="relative flex h-full flex-col overflow-hidden rounded-lg border border-shelf bg-card shadow-sm transition hover:shadow-md">
        @if (!book().mine) {
          <button (click)="wishlistToggle.emit()"
                  class="absolute right-2 top-2 z-[1] rounded-full bg-card/90 px-2 py-1 text-base shadow"
                  [class.text-brand]="book().wishlisted"
                  [class.text-ink-soft]="!book().wishlisted"
                  [attr.aria-label]="book().wishlisted ? t('wishlist.remove') : t('wishlist.add')">
            {{ book().wishlisted ? '♥' : '♡' }}
          </button>
        }
        <a [routerLink]="['/books', book().id]" class="block">
          @if (book().hasCover) {
            <img [src]="coverUrl()" [alt]="book().title" class="h-44 w-full object-cover" />
          } @else {
            <div class="flex h-44 w-full items-center justify-center bg-gradient-to-br from-shelf to-brand/25 px-4">
              <span class="font-display text-center text-lg italic leading-snug text-brand-deep">
                {{ book().title }}
              </span>
            </div>
          }
        </a>
        <div class="flex flex-1 flex-col gap-1.5 p-4">
          <div class="flex items-start justify-between gap-2">
            <a [routerLink]="['/books', book().id]"
               class="font-display text-base font-semibold leading-snug hover:text-brand-deep">
              {{ book().title }}
            </a>
            @if (book().borrowed) {
              <span class="shrink-0 rounded-full bg-warn/10 px-2 py-0.5 text-xs font-medium text-warn">
                {{ t('status.borrowed') }}
              </span>
            } @else if (book().shareable && !book().archived) {
              <span class="shrink-0 rounded-full bg-ok/10 px-2 py-0.5 text-xs font-medium text-ok">
                {{ t('status.available') }}
              </span>
            }
            @if (book().archived) {
              <span class="shrink-0 rounded-full bg-shelf px-2 py-0.5 text-xs font-medium text-ink-soft">
                {{ t('status.archived') }}
              </span>
            }
          </div>
          <p class="text-sm text-ink-soft">{{ book().authorName }}</p>
          <div class="flex items-center gap-2 text-sm">
            <bn-star-rating [value]="book().rating ?? 0" />
            @if (book().rating) {
              <span class="text-xs text-ink-soft">{{ book().rating }}</span>
            }
            <span class="rounded-full bg-shelf px-2 py-0.5 text-xs text-ink-soft">
              {{ t('genres.' + book().genre) }}
            </span>
          </div>
          <p class="text-xs text-ink-soft">
            @if (!book().mine) {
              <a [routerLink]="['/members', book().ownerId]" class="hover:text-brand-deep hover:underline">
                {{ t('book.sharedBy', { name: book().ownerName }) }}
              </a>
            }
            @if (book().queueLength) {
              <span class="ml-1 text-brand-deep">· {{ t('book.queue', { count: book().queueLength }) }}</span>
            }
          </p>
          <div class="mt-auto pt-2">
            <ng-content />
          </div>
        </div>
      </article>
    </ng-container>
  `,
})
export class BookCardComponent {
  private readonly api = inject(Api);

  readonly book = input.required<BookResponse>();
  readonly wishlistToggle = output<void>();

  protected readonly coverUrl = computed(() => this.api.coverUrl(this.book().id ?? 0));
}
