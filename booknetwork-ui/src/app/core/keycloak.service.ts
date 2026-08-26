import { Injectable, signal } from '@angular/core';
import Keycloak from 'keycloak-js';

import { environment } from '../../environments/environment';

/**
 * Owns the Keycloak session. `init()` runs before the app boots and forces a
 * login, so every component can assume an authenticated user. The display name
 * comes from the verified token — never from anywhere else.
 */
@Injectable({ providedIn: 'root' })
export class KeycloakService {
  private readonly keycloak = new Keycloak({
    url: environment.keycloak.url,
    realm: environment.keycloak.realm,
    clientId: environment.keycloak.clientId,
  });

  readonly firstName = signal('');
  readonly fullName = signal('');

  async init(): Promise<void> {
    await this.keycloak.init({
      onLoad: 'login-required',
      pkceMethod: 'S256',
      checkLoginIframe: false,
    });
    const claims = (this.keycloak.tokenParsed ?? {}) as Record<string, string>;
    this.firstName.set(claims['given_name'] ?? '');
    this.fullName.set([claims['given_name'], claims['family_name']].filter(Boolean).join(' '));
  }

  /** Fresh bearer token, transparently renewed when close to expiry. */
  async token(): Promise<string> {
    await this.keycloak.updateToken(30).catch(() => this.keycloak.login());
    return this.keycloak.token ?? '';
  }

  logout(): void {
    this.keycloak.logout({ redirectUri: window.location.origin });
  }
}
