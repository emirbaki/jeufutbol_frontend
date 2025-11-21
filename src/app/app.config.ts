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

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withViewTransitions()),
    provideClientHydration(withEventReplay()),
    provideAnimations(),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideApollo(() => {
      const httpLink = inject(HttpLink);
      const http = httpLink.create({ uri: 'https://jeufutbol.com.tr/graphql' });

      // 🔐 Add Authorization header if token exists
      const auth = setContext((_, { headers }) => {
        const token = localStorage.getItem('auth_token');
        return {
          headers: {
            ...headers,
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
