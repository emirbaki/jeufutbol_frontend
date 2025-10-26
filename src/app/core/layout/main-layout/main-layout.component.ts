import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../auth/auth.service';


@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive,],
  templateUrl: './main-layout.component.html',
})
export class MainLayoutComponent implements OnInit {
  user: any = null;
  sidebarOpen = true;
  mobileMenuOpen = false;

  navigationItems = [
    { path: '/dashboard', icon: '📊', label: 'Dashboard', iconPath: 'assets/icons/DASHBOARD.png' },
    { path: '/composer', icon: '✍️', label: 'Create Post', iconPath: 'assets/icons/Create Post.png'  },
    { path: '/posts', icon: '📝', label: 'My Posts', iconPath: 'assets/icons/MYPOSTS.png'  },
    { path: '/insights', icon: '💡', label: 'Insights', iconPath: 'assets/icons/INSIGHTS.png'  },
    { path: '/monitoring', icon: '👀', label: 'Monitoring', iconPath: 'assets/icons/MONITORING.png'  },
    { path: '/analytics', icon: '📈', label: 'Analytics', iconPath: 'assets/icons/ANALYTICS.png'  },
    { path: '/calendar', icon: '📅', label: 'Calendar', iconPath: 'assets/icons/CALENDAR.png'  },
    { path: '/settings', icon: '⚙️', label: 'Settings', iconPath: 'assets/icons/Settings.png'  }
  ];

  constructor(private authService: AuthService) {}

  async ngOnInit() {
    this.user = await this.authService.getCurrentUser();
    console.log('Current User:', this.user);
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  logout() {
    this.authService.logout();
  }
}