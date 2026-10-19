import { Component, OnInit, signal, ChangeDetectionStrategy, HostListener, inject } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { ThemeService } from '../../services/theme.service';
import { NgIcon, provideIcons } from "@ng-icons/core";
import { matLogout, matLightMode, matDarkMode } from "@ng-icons/material-icons/baseline";
import { ToastContainerComponent } from '../../../core/components/toast/toast-container.component';
import { WorkspaceContextService } from '../../services/workspace-context.service';
import { WorkspaceAvatarComponent } from '../../../shared/workspace-avatar/workspace-avatar.component';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: string;
  role?: string;
  avatarUrl?: string | null;
  activeWorkspace?: { id: string } | null;
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, NgIcon, NgOptimizedImage, ToastContainerComponent, WorkspaceAvatarComponent],
  templateUrl: './main-layout.component.html',
  providers: [provideIcons({ matLogout, matLightMode, matDarkMode })],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MainLayoutComponent implements OnInit {
  workspaceContext = inject(WorkspaceContextService);
  user = signal<User | null>(null);
  switcherOpen = signal(false);
  toggleOpen = (open: boolean) => !open;
  sidebarOpen = signal(true);
  mobileMenuOpen = signal(false);

  navigationItems = [
    { path: '/dashboard', icon: '📊', label: 'Dashboard', iconPath: 'assets/icons/DASHBOARD.png' },
    { path: '/composer', icon: '✍️', label: 'Create Post', iconPath: 'assets/icons/Create Post.png' },
    { path: '/posts', icon: '📝', label: 'My Posts', iconPath: 'assets/icons/MYPOSTS.png' },
    { path: '/insights', icon: '💡', label: 'Insights', iconPath: 'assets/icons/INSIGHTS.png' },
    { path: '/ai-chat', icon: '💬', label: 'AI Chat', iconPath: 'assets/icons/CHATCLOUD.png' },
    { path: '/ai-post-insights', icon: '✍️', label: 'AI Post & Insights', iconPath: 'assets/icons/aiposts.png' },
    { path: '/monitoring', icon: '👀', label: 'Monitoring', iconPath: 'assets/icons/MONITORING.png' },
    { path: '/analytics', icon: '📈', label: 'Analytics', iconPath: 'assets/icons/ANALYTICS.png' },
    { path: '/calendar', icon: '📅', label: 'Calendar', iconPath: 'assets/icons/CALENDAR.png' },
    { path: '/settings', icon: '⚙️', label: 'Settings', iconPath: 'assets/icons/Settings.png' }
  ];

  constructor(
    private authService: AuthService,
    public themeService: ThemeService
  ) { }

  async ngOnInit() {
    let _user = await this.authService.getCurrentUser();
    this.user.set(_user);
    await this.workspaceContext.init(_user);
  }

  async selectWorkspace(id: string) {
    this.switcherOpen.set(false);
    await this.workspaceContext.setActive(id);
  }

  @HostListener('document:click')
  @HostListener('document:keydown.escape')
  closeSwitcher() {
    this.switcherOpen.set(false);
  }

  toggleSidebar() {
    this.sidebarOpen.update(open => !open);
  }

  toggleMobileMenu() {
    this.mobileMenuOpen.update(open => !open);
  }

  logout() {
    this.authService.logout();
  }
}