import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { ApiConfiguration } from '../api/api-configuration';
import { StrictHttpResponse } from '../api/strict-http-response';

type ApiFn<P, R> = (
  http: HttpClient,
  rootUrl: string,
  params: P,
  context?: HttpContext
) => Observable<StrictHttpResponse<R>>;

/**
 * Bridges the generated OpenAPI functions to plain observables of their body.
 * Usage: `api.invoke(browse, { page: 0, size: 12 })`.
 */
@Injectable({ providedIn: 'root' })
export class Api {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ApiConfiguration);

  invoke<P, R>(fn: ApiFn<P, R>, params: P): Observable<R> {
    return fn(this.http, this.config.rootUrl, params).pipe(map((r) => r.body as R));
  }

  coverUrl(bookId: number): string {
    return `${this.config.rootUrl}/books/${bookId}/cover`;
  }
}
