import { ApplicationConfig, inject, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection, PLATFORM_ID, importProvidersFrom } from '@angular/core';
import { provideRouter, withViewTransitions, withInMemoryScrolling } from '@angular/router';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { isPlatformBrowser } from '@angular/common';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideMarkdown } from 'ngx-markdown';

// Apollo / GraphQL Imports
import { provideApollo } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';
import { ApolloLink, InMemoryCache, split } from '@apollo/client/core';
import { setContext } from '@apollo/client/link/context';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';
import { Kind, OperationTypeNode } from 'graphql';

// Project Imports
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptors';
import { tenantInterceptor } from './core/interceptors/tenant.interceptor';
import { environment } from '../environments/environment.development';
import { provideNgIconsConfig } from '@ng-icons/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withViewTransitions(), withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' })),
    provideClientHydration(withEventReplay()),
    provideNgIconsConfig({
      size: '1.25em',
    }),
    provideAnimations(),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, tenantInterceptor])),
    provideMarkdown(),
    // ✅ MERGED APOLLO CONFIGURATION
    provideApollo(() => {
      const httpLink = inject(HttpLink);
      const platformId = inject(PLATFORM_ID);

      // 1. Prepare URLs
      const apiUrl = environment.api_url;
      const httpUrl = apiUrl.endsWith('/api') ? apiUrl.replace('/api', '/graphql') : `${apiUrl}/graphql`;
      // Replace http/https with ws/wss for the websocket url
      const wsUrl = httpUrl.replace(/^http/, 'ws');

      // 2. HTTP Link (Base)
      const http = httpLink.create({ uri: httpUrl });

      // 3. Auth & Tenant Middleware (For HTTP)
      const authLink = setContext((_, { headers }) => {
        // If SSR, just return existing headers (or handle server-side auth if needed)
        if (!isPlatformBrowser(platformId)) {
          return { headers };
        }

        // Use the key from environment if available, fallback to 'auth_token'
        const tokenKey = environment.auth_token_key || 'auth_token';
        const token = localStorage.getItem(tokenKey);

        // Tenant Logic
        const hostname = window.location.hostname;
        const parts = hostname.split('.');
        let subdomain = '';
        if (hostname.endsWith('localhost') && parts.length >= 2) subdomain = parts[0];
        else if (parts.length >= 3) subdomain = parts[0];

        const tenantHeader = (subdomain && subdomain !== 'www') ? { 'X-Tenant-Subdomain': subdomain } : {};

        return {
          headers: {
            ...headers,
            ...tenantHeader,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        };
      });

      // 4. Combine Auth + HTTP
      const httpLinkWithAuth = ApolloLink.from([authLink, http]);

      // 5. WebSocket Link (Browser Only!)
      // We must not try to connect to WebSockets during SSR (Server Side Rendering)
      let ws: GraphQLWsLink | null = null;

      if (isPlatformBrowser(platformId)) {
        ws = new GraphQLWsLink(
          createClient({
            url: wsUrl,
            connectionParams: () => {
              // Pass auth token for WebSocket connection
              // Use the key from environment if available, fallback to 'auth_token'
              const tokenKey = environment.auth_token_key || 'auth_token';
              const token = localStorage.getItem(tokenKey);
              // Note: Headers usually aren't supported in standard WS, 
              // so we pass token in connectionParams which NestJS handles.
              return {
                Authorization: token ? `Bearer ${token}` : '',
              };
            },
          })
        );
      }

      // 6. Split Link (The Traffic Controller)
      // If we are in the browser and WS is enabled, split traffic.
      // If we are on the server (SSR), use only HTTP.
      const link = (isPlatformBrowser(platformId) && ws)
        ? split(
          ({ query }) => {
            const definition = getMainDefinition(query);
            return (
              definition.kind === Kind.OPERATION_DEFINITION &&
              definition.operation === OperationTypeNode.SUBSCRIPTION
            );
          },
          ws, // Route Subscriptions here
          httpLinkWithAuth // Route Queries/Mutations here
        )
        : httpLinkWithAuth;

      return {
        link,
        cache: new InMemoryCache(),
      };
    }),
  ]
};