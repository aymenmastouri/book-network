import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';

import { KeycloakService } from './core/keycloak.service';
import { ToastService } from './shared/toast.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslocoDirective],
  template: `
    <ng-container *transloco="let t">
      <header class="border-b border-shelf bg-card/80 backdrop-blur sticky top-0 z-10">
        <div class="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
          <a routerLink="/books" class="flex items-baseline gap-2">
            <span class="font-display text-2xl font-semibold tracking-tight text-brand-deep">BookNetwork</span>
            <span class="hidden text-xs text-ink-soft sm:inline">{{ t('app.tagline') }}</span>
          </a>

          <nav class="ml-auto flex items-center gap-1 text-sm">
            <a routerLink="/books" routerLinkActive="nav-active" [routerLinkActiveOptions]="{ exact: true }"
               class="nav-link">{{ t('nav.browse') }}</a>
            <a routerLink="/shelf" routerLinkActive="nav-active" class="nav-link">{{ t('nav.shelf') }}</a>
            <a routerLink="/borrowed" routerLinkActive="nav-active" class="nav-link">{{ t('nav.borrowed') }}</a>
            <a routerLink="/returns" routerLinkActive="nav-active" class="nav-link">{{ t('nav.returns') }}</a>
            <a routerLink="/wishlist" routerLinkActive="nav-active" class="nav-link">{{ t('nav.wishlist') }}</a>
          </nav>

          <div class="flex items-center gap-2 border-l border-shelf pl-4">
            <button (click)="toggleTheme()"
                    class="rounded px-2 py-1 text-sm text-ink-soft hover:bg-shelf"
                    [attr.aria-label]="t('app.theme')">
              {{ dark() ? '☀' : '☾' }}
            </button>
            <button (click)="switchLang()"
                    class="rounded px-2 py-1 text-xs font-semibold uppercase text-ink-soft hover:bg-shelf"
                    [attr.aria-label]="t('app.language')">
              {{ otherLang() }}
            </button>
            <span class="hidden text-sm text-ink-soft md:inline">
              {{ t('app.greeting', { name: keycloak.firstName() }) }}
            </span>
            <button (click)="keycloak.logout()"
                    class="rounded-md border border-shelf px-3 py-1.5 text-sm hover:bg-shelf">
              {{ t('app.logout') }}
            </button>
          </div>
        </div>
      </header>

      <main class="mx-auto max-w-6xl px-4 py-8">
        <router-outlet />
      </main>

      @if (toast.current(); as message) {
        <div class="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg px-4 py-2.5 text-sm text-white shadow-lg"
             [class.bg-ok]="message.kind === 'ok'"
             [class.bg-warn]="message.kind === 'error'"
             role="status">
          {{ t(message.key, message.params) }}
        </div>
      }
    </ng-container>
  `,
  styles: `
    .nav-link { padding: 0.375rem 0.75rem; border-radius: 0.375rem; color: var(--color-ink-soft); }
    .nav-link:hover { background: var(--color-shelf); color: var(--color-ink); }
    .nav-active { background: var(--color-shelf); color: var(--color-ink); font-weight: 600; }
  `,
})
export class AppComponent {
  protected readonly keycloak = inject(KeycloakService);
  protected readonly toast = inject(ToastService);
  private readonly transloco = inject(TranslocoService);

  protected readonly dark = signal(localStorage.getItem('booknetwork.theme') === 'dark');

  constructor() {
    document.documentElement.classList.toggle('dark', this.dark());
  }

  protected otherLang(): string {
    return this.transloco.getActiveLang() === 'en' ? 'de' : 'en';
  }

  protected switchLang(): void {
    const next = this.otherLang();
    this.transloco.setActiveLang(next);
    localStorage.setItem('booknetwork.lang', next);
  }

  protected toggleTheme(): void {
    this.dark.update((d) => !d);
    document.documentElement.classList.toggle('dark', this.dark());
    localStorage.setItem('booknetwork.theme', this.dark() ? 'dark' : 'light');
  }
}
