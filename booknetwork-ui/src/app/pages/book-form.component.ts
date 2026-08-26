import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { Observable } from 'rxjs';

import { create } from '../api/fn/books/create';
import { get } from '../api/fn/books/get';
import { update } from '../api/fn/books/update';
import { BookRequest } from '../api/models/book-request';
import { Api } from '../core/api';
import { ToastService } from '../shared/toast.service';

const GENRES = ['CLASSIC', 'CRIME', 'SCIFI', 'FANTASY', 'ROMANCE', 'HISTORY', 'NONFICTION', 'OTHER'] as const;

/** Add a book to the shelf, or edit one that is already there. */
@Component({
  selector: 'bn-book-form',
  imports: [TranslocoDirective, FormsModule],
  template: `
    <ng-container *transloco="let t">
      <h1 class="font-display mb-6 text-3xl font-semibold">
        {{ editing() ? t('form.editTitle') : t('form.newTitle') }}
      </h1>

      <form (ngSubmit)="save()" class="max-w-xl space-y-4">
        <label class="block">
          <span class="mb-1 block text-sm font-medium">{{ t('form.title') }}</span>
          <input [(ngModel)]="title" name="title" required maxlength="200" class="field" />
        </label>
        <label class="block">
          <span class="mb-1 block text-sm font-medium">{{ t('form.author') }}</span>
          <input [(ngModel)]="authorName" name="authorName" required maxlength="200" class="field" />
        </label>
        <div class="grid grid-cols-2 gap-4">
          <label class="block">
            <span class="mb-1 block text-sm font-medium">{{ t('form.isbn') }}</span>
            <input [(ngModel)]="isbn" name="isbn" maxlength="20" class="field" />
          </label>
          <label class="block">
            <span class="mb-1 block text-sm font-medium">{{ t('form.genre') }}</span>
            <select [(ngModel)]="genre" name="genre" class="field">
              @for (g of genres; track g) {
                <option [value]="g">{{ t('genres.' + g) }}</option>
              }
            </select>
          </label>
        </div>
        <label class="block">
          <span class="mb-1 block text-sm font-medium">{{ t('form.synopsis') }}</span>
          <textarea [(ngModel)]="synopsis" name="synopsis" rows="4" maxlength="2000" class="field"></textarea>
        </label>
        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" [(ngModel)]="shareable" name="shareable" class="accent-brand" />
          {{ t('form.shareable') }}
        </label>

        <div class="flex gap-3 pt-2">
          <button type="submit" [disabled]="!title().trim() || !authorName().trim()"
                  class="rounded-md bg-brand px-5 py-2 font-medium text-white hover:bg-brand-deep disabled:opacity-40">
            {{ t('form.save') }}
          </button>
          <button type="button" (click)="back()"
                  class="rounded-md border border-shelf px-5 py-2 hover:bg-shelf">
            {{ t('form.cancel') }}
          </button>
        </div>
      </form>
    </ng-container>
  `,
  styles: `
    .field {
      width: 100%; border: 1px solid var(--color-shelf); border-radius: 0.375rem;
      background: var(--color-card); padding: 0.5rem 0.75rem; font-size: 0.875rem;
      color: var(--color-ink);
    }
    .field:focus { outline: 2px solid var(--color-brand); outline-offset: 0; }
  `,
})
export class BookFormComponent implements OnInit {
  private readonly api = inject(Api);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly genres = GENRES;
  protected readonly editing = signal(false);
  protected readonly title = signal('');
  protected readonly authorName = signal('');
  protected readonly isbn = signal('');
  protected readonly synopsis = signal('');
  protected readonly genre = signal<BookRequest['genre']>('OTHER');
  protected readonly shareable = signal(true);

  private bookId: number | null = null;

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.bookId = Number(idParam);
      this.editing.set(true);
      this.api.invoke(get, { id: this.bookId }).subscribe((b) => {
        this.title.set(b.title ?? '');
        this.authorName.set(b.authorName ?? '');
        this.isbn.set(b.isbn ?? '');
        this.synopsis.set(b.synopsis ?? '');
        this.genre.set(b.genre ?? 'OTHER');
        this.shareable.set(b.shareable ?? true);
      });
    }
  }

  protected save(): void {
    const body: BookRequest = {
      title: this.title().trim(),
      authorName: this.authorName().trim(),
      isbn: this.isbn().trim(),
      synopsis: this.synopsis().trim(),
      genre: this.genre(),
      shareable: this.shareable(),
    };
    const request: Observable<unknown> = this.bookId
      ? this.api.invoke(update, { id: this.bookId, body })
      : this.api.invoke(create, { body });
    request.subscribe({
      next: () => {
        this.toast.show('ok', 'toasts.bookSaved');
        this.back();
      },
      error: (err) => this.toast.apiError(err),
    });
  }

  protected back(): void {
    this.router.navigate(['/shelf']);
  }
}
