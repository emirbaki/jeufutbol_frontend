import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { SocialAccountsService } from '../../services/social-accounts.service';
import { CredentialManagerComponent } from "../credentials/credentials-manager/credentials-manager.component";

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, CredentialManagerComponent],
  templateUrl: './settings.component.html',
})
export class SettingsComponent implements OnInit {
  activeTab = 'profile';
  user: any = null;
  connectedAccounts: any[] = [];
  loading = false;

  // Profile form
  firstName = '';
  lastName = '';
  email = '';
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  // Notification settings
  notifications = {
    emailOnPublish: true,
    emailOnFail: true,
    weeklyReport: true,
    newInsights: true
  };

  constructor(
    private authService: AuthService,
    private socialAccountsService: SocialAccountsService
  ) {}
  hasPlatform(platform: string): boolean {
  return Array.isArray(this.connectedAccounts)
    && this.connectedAccounts.some(a => a.platform === platform);
}
  async ngOnInit() {
    await this.loadUserData();
    await this.loadConnectedAccounts();
  }

  async loadUserData() {
    this.user = await this.authService.getCurrentUser();
    if (this.user) {
      this.firstName = this.user.firstName;
      this.lastName = this.user.lastName;
      this.email = this.user.email;
    }
  }

  async loadConnectedAccounts() {
    this.loading = true;
    try {
      this.connectedAccounts = await this.socialAccountsService.getConnectedAccounts();
    } catch (error) {
      console.error('Error loading accounts:', error);
    } finally {
      this.loading = false;
    }
  }

  selectTab(tab: string) {
    this.activeTab = tab;
  }

  async updateProfile() {
    // Implement profile update
    alert('Profile update functionality to be implemented');
  }

  async changePassword() {
    if (this.newPassword !== this.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    // Implement password change
    alert('Password change functionality to be implemented');
  }

  async connectPlatform(platform: string) {
    // Redirect to OAuth flow
    const state = btoa(this.user.id);
    const authUrls: Record<string, string> = {
      x: `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${platform}_client_id&redirect_uri=${encodeURIComponent(window.location.origin + '/auth/social/twitter/callback')}&state=${state}&scope=tweet.read%20tweet.write%20users.read`,
      instagram: `https://api.instagram.com/oauth/authorize?client_id=${platform}_client_id&redirect_uri=${encodeURIComponent(window.location.origin + '/auth/social/instagram/callback')}&scope=user_profile,user_media&response_type=code&state=${state}`,
      facebook: `https://www.facebook.com/v18.0/dialog/oauth?client_id=${platform}_client_id&redirect_uri=${encodeURIComponent(window.location.origin + '/auth/social/facebook/callback')}&state=${state}&scope=pages_manage_posts,pages_read_engagement`
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
      // youtube: { icon: '▶️', name: 'YouTube', color: 'bg-red-600' }
    };
    return info[platform] || { icon: '📱', name: platform, color: 'bg-gray-500' };
  }

  saveNotificationSettings() {
    // Implement notification settings save
    alert('Notification settings saved!');
  }
}