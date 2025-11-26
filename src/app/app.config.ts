import { ApplicationConfig, inject, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';

import { provideApollo } from 'apollo-angular';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApolloLink, InMemoryCache } from '@apollo/client/core';
import { HttpLink } from 'apollo-angular/http';
import { setContext } from '@apollo/client/link/context';
import { authInterceptor } from './core/interceptors/auth.interceptors';
import { tenantInterceptor } from './core/interceptors/tenant.interceptor';
import { environment } from '../environments/environment.development';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withViewTransitions()),
    provideClientHydration(withEventReplay()),
    provideAnimations(),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, tenantInterceptor])),
    provideApollo(() => {
      const httpLink = inject(HttpLink);
      // api_url is like http://localhost:3000/api, we need http://localhost:3000/graphql
      // So we replace /api with /graphql or just construct it.
      const apiUrl = environment.api_url;
      const graphqlUrl = apiUrl.endsWith('/api') ? apiUrl.replace('/api', '/graphql') : `${apiUrl}/graphql`;

      const http = httpLink.create({ uri: graphqlUrl });

      // 🔐 Add Authorization header if token exists
      const auth = setContext((_, { headers }) => {
        const token = localStorage.getItem('auth_token');
        // We can't easily inject TenantService here because setContext is a callback.
        // But we can parse the hostname directly here or use a global/local storage if we set it earlier.
        // Or better, since we are in provideApollo factory, we can inject TenantService!
        // But wait, provideApollo factory is run once. setContext is run per request.
        // We need to access the current tenant.

        // Let's parse hostname directly here to be safe and simple, 
        // or rely on the fact that TenantService runs on init.

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

      return {
        cache: new InMemoryCache(),
        link: ApolloLink.from([auth, http]),
      };
    }),
  ]
};
