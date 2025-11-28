import { ApplicationConfig, inject, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection, PLATFORM_ID, makeStateKey, TransferState } from '@angular/core';
import { provideMarkdown } from 'ngx-markdown';
import { provideRouter, withViewTransitions } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { isPlatformBrowser } from '@angular/common';
import { provideAnimations } from '@angular/platform-browser/animations';

import { provideApollo } from 'apollo-angular';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApolloLink, InMemoryCache } from '@apollo/client/core';
import { HttpLink } from 'apollo-angular/http';
import { setContext } from '@apollo/client/link/context';
import { authInterceptor } from './core/interceptors/auth.interceptors';
import { tenantInterceptor } from './core/interceptors/tenant.interceptor';
import { environment } from '../environments/environment.development';
import { REQUEST } from './tokens.server';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withViewTransitions()),
    provideClientHydration(withEventReplay()),
    provideAnimations(),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, tenantInterceptor])),
    provideMarkdown(),
    provideApollo(() => {
      const httpLink = inject(HttpLink);
      const platformId = inject(PLATFORM_ID);
      const transferState = inject(TransferState);
      // Server-side: Get token from cookies/headers and tenant from Host header
      // We use 'REQUEST' token provided in server.ts
      const request = inject(REQUEST, { optional: true }) as any;

      // api_url is like http://localhost:3000/api, we need http://localhost:3000/graphql
      const apiUrl = environment.api_url;
      const graphqlUrl = apiUrl.endsWith('/api') ? apiUrl.replace('/api', '/graphql') : `${apiUrl}/graphql`;

      const http = httpLink.create({ uri: graphqlUrl });

      // TransferState Key
      const STATE_KEY = makeStateKey<any>('apollo.state');

      // 🔐 Add Authorization header if token exists
      const auth = setContext((_, { headers }) => {
        let token: string | null = null;
        let tenantSubdomain: string | null = null;

        if (isPlatformBrowser(platformId)) {
          // Client-side: Get token from localStorage and tenant from window.location
          token = localStorage.getItem(environment.auth_token_key);

          const hostname = window.location.hostname;
          const parts = hostname.split('.');
          if (hostname.endsWith('localhost') && parts.length >= 2) tenantSubdomain = parts[0];
          else if (parts.length >= 3) tenantSubdomain = parts[0];

        } else {
          if (request) {
            // 1. Try to get token from Authorization header first
            const authHeader = request.headers['authorization'];
            if (authHeader && authHeader.startsWith('Bearer ')) {
              token = authHeader.substring(7);
            }

            // 2. If no header, try to get from 'token' cookie
            if (!token && request.headers.cookie) {
              const cookies = request.headers.cookie.split(';');
              const tokenCookie = cookies.find((c: string) => c.trim().startsWith('token='));
              if (tokenCookie) {
                token = tokenCookie.split('=')[1].trim();
              }
            }

            // 3. Get tenant from Host header
            const host = request.headers['host'];
            if (host) {
              const parts = host.split('.');
              // Check for localhost (e.g., tenant.localhost:4000)
              if (host.includes('localhost') && parts.length >= 2) {
                // If port is included in the last part, ignore it for count check but we need the first part
                tenantSubdomain = parts[0];
              } else if (parts.length >= 3) {
                // e.g. tenant.domain.com
                tenantSubdomain = parts[0];
              }
            }
          }
        }

        const tenantHeader = (tenantSubdomain && tenantSubdomain !== 'www') ? { 'X-Tenant-Subdomain': tenantSubdomain } : {};

        return {
          headers: {
            ...headers,
            ...tenantHeader,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        };
      });

      const cache = new InMemoryCache();

      if (isPlatformBrowser(platformId)) {
        // Client: Restore state
        const state = transferState.get(STATE_KEY, null);
        if (state) {
          cache.restore(state);
        }
      } else {
        // Server: Save state on serialization
        transferState.onSerialize(STATE_KEY, () => {
          return cache.extract();
        });
      }

      return {
        cache,
        link: ApolloLink.from([auth, http]),
        ssrMode: !isPlatformBrowser(platformId), // Enable SSR mode for Apollo
      };
    }),
  ]
};
