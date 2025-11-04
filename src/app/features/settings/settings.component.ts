import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { SocialAccountsService } from '../../services/social-accounts.service';
import { CredentialManagerComponent } from "../credentials/credentials-manager/credentials-manager.component";
import { LlmCredentialsComponent } from "../llm-credentials/llm-credentials.component";

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, CredentialManagerComponent, LlmCredentialsComponent],
  templateUrl: './settings.component.html',
})
export class SettingsComponent implements OnInit {
  // 🔹 Signals
  activeTab = signal<'profile' | 'security' | 'notifications' | 'connected_accounts' | string>('profile');
  user = signal<any | null>(null);
  connectedAccounts = signal<any[]>([]);
  loading = signal(false);

  // 🔹 Profile form
  firstName = signal('');
  lastName = signal('');
  email = signal('');
  currentPassword = signal('');
  newPassword = signal('');
  confirmPassword = signal('');

  // ✅ Lock states
  profileLocked = signal(true);
  passwordLocked = signal(true);

  // 🔹 Notification settings
  notifications = signal({
    emailOnPublish: true,
    emailOnFail: true,
    weeklyReport: true,
    newInsights: true,
  });

  // 🔹 Computed example: reactive access check
  hasPlatform = computed(() => {
    const accounts = this.connectedAccounts();
    return (platform: string) =>
      Array.isArray(accounts) && accounts.some(a => a.platform === platform);
  });

  constructor(
    private authService: AuthService,
    private socialAccountsService: SocialAccountsService
  ) {}

  async ngOnInit() {
    await this.loadUserData();
    await this.loadConnectedAccounts();
  }

  // 🔹 Load user info
  async loadUserData() {
    const userData = await this.authService.getCurrentUser();
    if (userData) {
      this.user.set(userData);
      this.firstName.set(userData.firstName);
      this.lastName.set(userData.lastName);
      this.email.set(userData.email);
    }
  }

  // 🔹 Load connected social accounts
  async loadConnectedAccounts() {
    this.loading.set(true);
    try {
      const accounts = await this.socialAccountsService.getConnectedAccounts();
      this.connectedAccounts.set(accounts);
    } catch (error) {
      console.error('Error loading accounts:', error);
    } finally {
      this.loading.set(false);
    }
  }

  selectTab(tab: string) {
    this.activeTab.set(tab);
  }
  
  toggleLock(type: 'profile' | 'password') {
    if (type === 'profile') {
      this.profileLocked.update((v) => !v);
    } else {
      this.passwordLocked.update((v) => !v);
    }
  }
  async updateProfile() {
    // Implement profile update
    alert('Profile update functionality to be implemented');
  }

  async changePassword() {
    if (this.newPassword() !== this.confirmPassword()) {
      alert('Passwords do not match');
      return;
    }
    // Implement password change
    alert('Password change functionality to be implemented');
  }

  async connectPlatform(platform: string) {
    const u = this.user();
    if (!u) return;

    const state = btoa(u.id);
    const authUrls: Record<string, string> = {
      x: `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${platform}_client_id&redirect_uri=${encodeURIComponent(window.location.origin + '/auth/social/twitter/callback')}&state=${state}&scope=tweet.read%20tweet.write%20users.read`,
      instagram: `https://api.instagram.com/oauth/authorize?client_id=${platform}_client_id&redirect_uri=${encodeURIComponent(window.location.origin + '/auth/social/instagram/callback')}&scope=user_profile,user_media&response_type=code&state=${state}`,
      facebook: `https://www.facebook.com/v18.0/dialog/oauth?client_id=${platform}_client_id&redirect_uri=${encodeURIComponent(window.location.origin + '/auth/social/facebook/callback')}&state=${state}&scope=pages_manage_posts,pages_read_engagement`,
    };

    if (authUrls[platform]) {
      window.location.href = authUrls[platform];
    }
  }

  async disconnectAccount(account: any) {
    if (!confirm(`Disconnect ${account.platformUsername} from ${account.platform}?`)) return;

    try {
      await this.socialAccountsService.disconnectAccount(account.id);
      await this.loadConnectedAccounts();
    } catch (error) {
      console.error('Error disconnecting account:', error);
      alert('Failed to disconnect account');
    }
  }

  getPlatformInfo(platform: string): { icon: string; name: string; color: string } {
    const info: Record<string, any> = {
      x: { icon: 'assets/icons/Twitter.png', name: 'X (Twitter)', color: 'bg-blue-500' },
      instagram: { icon: 'assets/icons/Instagram.png', name: 'Instagram', color: 'bg-pink-500' },
      facebook: { icon: 'assets/icons/facebook.png', name: 'Facebook', color: 'bg-blue-600' },
      tiktok: { icon: 'assets/icons/tiktok.png', name: 'TikTok', color: 'bg-black' },
    };
    return info[platform] || { icon: '📱', name: platform, color: 'bg-gray-500' };
  }

  saveNotificationSettings() {
    alert('Notification settings saved!');
  }
}
