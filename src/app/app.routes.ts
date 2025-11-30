import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/landing/landing-page.component').then(m => m.LandingPageComponent)
    // pathMatch: 'full'
  },
  {
    path: 'privacy-policy',
    loadComponent: () => import('./pages/privacy-policy/privacy-policy.component').then(m => m.PrivacyPolicyComponent)
  },
  {
    path: 'terms-of-service',
    loadComponent: () => import('./pages/terms-of-service/terms-of-service.component').then(m => m.TermsOfServiceComponent)
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: '',
    canActivate: [AuthGuard],
    loadComponent: () => import('./core/layout/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'composer',
        loadComponent: () => import('./features/post-composer/post-composer.component').then(m => m.PostComposerComponent)
      },
      {
        path: 'composer/:id',
        loadComponent: () => import('./features/post-composer/post-composer.component').then(m => m.PostComposerComponent)
      },
      {
        path: 'posts',
        loadComponent: () => import('./features/posts/post-list/post-list.component').then(m => m.PostsListComponent)
      },
      {
        path: 'insights',
        loadComponent: () => import('./features/insights/insights-dashboard/insights-dashboard').then(m => m.InsightsDashboardComponent)
      },
      {
        path: 'monitoring',
        loadComponent: () => import('./features/monitoring/monitoring-dashboard/monitoring-dashboard.component').then(m => m.MonitoringDashboardComponent)
      },
      {
        path: 'analytics',
        loadComponent: () => import('./features/analytics/analytics-dashboard/analytics-dashboard.component').then(m => m.AnalyticsDashboardComponent)
      },
      {
        path: 'calendar',
        loadComponent: () => import('./features/calendar/calendar-view/calendar-view.component').then(m => m.CalendarViewComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent)
      },
      {
        path: 'credentials',
        loadComponent: () => import('./features/credentials/credentials-manager/credentials-manager.component').then(m => m.CredentialManagerComponent)
      },
      {
        path: 'ai-post-insights',
        loadComponent: () => import('./features/ai-post-generator/ai-post-generator.component').then(m => m.AIPostGeneratorComponent)
      },
      {
        path: 'ai-chat',
        data: { mode: 'page' },
        loadComponent: () => import('./features/ai-chat/ai-chat.component').then(m => m.AiChatComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];