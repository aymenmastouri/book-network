import { Injectable, signal } from '@angular/core';

export interface Toast {
  kind: 'ok' | 'error';
  key: string;
  params?: Record<string, unknown>;
}

/** One toast at a time, translated at render time via its i18n key. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly current = signal<Toast | null>(null);
  private timer: ReturnType<typeof setTimeout> | null = null;

  show(kind: Toast['kind'], key: string, params?: Record<string, unknown>): void {
    this.current.set({ kind, key, params });
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => this.current.set(null), 3500);
  }

  /** Maps a backend business-rule code onto its translated message. */
  apiError(err: { error?: { code?: string } }): void {
    const code = err.error?.code ?? 'unknown';
    this.show('error', `errors.${code}`);
  }
}
