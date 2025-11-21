import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './main-layout.component.html'
})
export class MainLayoutComponent implements OnInit {
  user = signal<User | null>(null);
  sidebarOpen = signal(true);
  mobileMenuOpen = signal(false);

  navigationItems = [
    { path: '/dashboard', icon: '📊', label: 'Dashboard', iconPath: 'assets/icons/DASHBOARD.png' },
    { path: '/composer', icon: '✍️', label: 'Create Post', iconPath: 'assets/icons/Create Post.png' },
    { path: '/posts', icon: '📝', label: 'My Posts', iconPath: 'assets/icons/MYPOSTS.png' },
    { path: '/insights', icon: '💡', label: 'Insights', iconPath: 'assets/icons/INSIGHTS.png' },
    { path: '/ai-post-insights', icon: '✍️', label: 'AI Post & Insights', iconPath: 'assets/icons/Create Post.png' },
    { path: '/monitoring', icon: '👀', label: 'Monitoring', iconPath: 'assets/icons/MONITORING.png' },
    { path: '/analytics', icon: '📈', label: 'Analytics', iconPath: 'assets/icons/ANALYTICS.png' },
    { path: '/calendar', icon: '📅', label: 'Calendar', iconPath: 'assets/icons/CALENDAR.png' },
    { path: '/settings', icon: '⚙️', label: 'Settings', iconPath: 'assets/icons/Settings.png' }
  ];

  constructor(private authService: AuthService) { }

  async ngOnInit() {
    let _user = await this.authService.getCurrentUser();
    this.user.set(_user);
    console.log('Current User:', this.user());
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