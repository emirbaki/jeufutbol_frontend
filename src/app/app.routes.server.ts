import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: '',
    renderMode: RenderMode.Server, // Landing page
  },
  {
    path: 'auth/**',
    renderMode: RenderMode.Server, // Auth pages (login, register, etc.)
  },
  {
    path: '**',
    renderMode: RenderMode.Client, // All other routes use CSR (authenticated pages)
  },
];
