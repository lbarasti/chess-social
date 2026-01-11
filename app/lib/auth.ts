'use client';

import { OAuth2AuthCodePKCE, type HttpClient } from '@bity/oauth2-auth-code-pkce';
import { LichessUser } from './types';

export const LICHESS_HOST = 'https://lichess.org';
export const LICHESS_SCOPES: string[] = []; // Empty = read-only access to public data

// Get client URL dynamically (works in browser only)
const getClientUrl = () => {
  if (typeof window === 'undefined') return '';
  return `${window.location.protocol}//${window.location.host}/`;
};

export type AuthenticatedUser = LichessUser & {
  httpClient: HttpClient;
};

export class LichessAuth {
  private oauth: OAuth2AuthCodePKCE | null = null;
  user: AuthenticatedUser | null = null;

  private getOAuth(): OAuth2AuthCodePKCE {
    if (!this.oauth) {
      this.oauth = new OAuth2AuthCodePKCE({
        authorizationUrl: `${LICHESS_HOST}/oauth`,
        tokenUrl: `${LICHESS_HOST}/api/token`,
        clientId: 'chess-tournament-manager-2026',
        scopes: LICHESS_SCOPES,
        redirectUrl: getClientUrl(),
        onAccessTokenExpiry: (refreshAccessToken) => refreshAccessToken(),
        onInvalidGrant: console.warn,
      });
    }
    return this.oauth;
  }

  async init(): Promise<AuthenticatedUser | null> {
    if (typeof window === 'undefined') return null;

    const oauth = this.getOAuth();

    try {
      // Check if we already have an access token
      const accessContext = await oauth.getAccessToken();
      if (accessContext?.token?.value) {
        await this.authenticate();
      }
    } catch {
      // ErrorNoAuthCode is expected when user hasn't logged in yet - ignore it
    }

    // Check if we're returning from the OAuth flow
    if (!this.user) {
      try {
        const hasAuthCode = await oauth.isReturningFromAuthServer();
        if (hasAuthCode) {
          await this.authenticate();
        }
      } catch (err) {
        console.error('Error handling auth callback:', err);
      }
    }

    return this.user;
  }

  async login(): Promise<void> {
    const oauth = this.getOAuth();
    await oauth.fetchAuthorizationCode();
  }

  async logout(): Promise<void> {
    if (this.user) {
      try {
        // Revoke token on Lichess side
        await this.user.httpClient(`${LICHESS_HOST}/api/token`, { method: 'DELETE' });
      } catch (err) {
        console.error('Error revoking token:', err);
      }
    }
    localStorage.clear();
    this.user = null;
    this.oauth = null;
  }

  private async authenticate(): Promise<void> {
    const oauth = this.getOAuth();
    const httpClient = oauth.decorateFetchHTTPClient(window.fetch);

    const res = await httpClient(`${LICHESS_HOST}/api/account`);
    const data = await res.json();

    if (data.error) {
      throw new Error(data.error);
    }

    this.user = {
      id: data.id,
      username: data.username,
      perfs: data.perfs,
      httpClient,
    };
  }
}

// Singleton instance
let authInstance: LichessAuth | null = null;

export function getAuth(): LichessAuth {
  if (!authInstance) {
    authInstance = new LichessAuth();
  }
  return authInstance;
}
