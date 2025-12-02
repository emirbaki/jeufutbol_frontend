import { Component, OnInit, computed, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { SocialAccountsService } from '../../services/social-accounts.service';
import { TenantService } from '../../core/services/tenant.service';
import { Apollo, gql } from 'apollo-angular';
import { firstValueFrom } from 'rxjs';
import { CredentialManagerComponent } from "../credentials/credentials-manager/credentials-manager.component";
import { LlmCredentialsComponent } from "../llm-credentials/llm-credentials.component";

import { CredentialsService } from '../../services/credentials.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, CredentialManagerComponent, LlmCredentialsComponent],
  templateUrl: './settings.component.html',
})
export class SettingsComponent implements OnInit {
  // 🔹 Signals
  activeTab = signal<'profile' | 'security' | 'notifications' | 'connected_accounts' | 'llm_accounts' | 'organization' | string>('profile');
  user = signal<any | null>(null);
  organization = signal<any | null>(null);
  connectedAccounts = signal<any[]>([]);
  loading = signal(false);
  organizationUsers = signal<any[]>([]);

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

  isAdmin = computed(() => {
    const u = this.user();
    return u?.role === 'ADMIN';
  });

  constructor(
    private authService: AuthService,
    private socialAccountsService: SocialAccountsService,
    private tenantService: TenantService,
    private apollo: Apollo,
    private credentialsService: CredentialsService,
    private cdr: ChangeDetectorRef
  ) { }

  async ngOnInit() {
    await this.loadUserData();
    await this.loadConnectedAccounts();
    await this.loadOrganization();
    await this.loadOrganizationUsers();
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
      console.log('SettingsComponent: Fetching connected accounts...');
      // Use CredentialsService (REST) instead of SocialAccountsService (GraphQL)
      const accounts = await this.credentialsService.getCredentials();
      console.log('SettingsComponent: Fetched accounts:', accounts);

      // Map REST response to match the expected format if necessary
      // The REST endpoint returns: { id, name, platform, type, accountId, accountName, accountImage, isActive, ... }
      // This seems compatible with what the UI expects
      this.connectedAccounts.set(accounts);
      this.cdr.markForCheck(); // Force change detection
    } catch (error) {
      console.error('Error loading accounts:', error);
    } finally {
      this.loading.set(false);
      this.cdr.markForCheck();
    }
  }

  async loadOrganization() {
    try {
      const org = await this.tenantService.getCurrentTenant();
      this.organization.set(org);
    } catch (error) {
      console.error('Error loading organization:', error);
    }
  }

  async updateOrganization() {
    if (!this.organization()) return;
    try {
      const updatedOrg = await this.tenantService.updateTenant(this.organization().name);
      this.organization.set(updatedOrg);
      alert('Organization updated successfully');
    } catch (error) {
      console.error('Error updating organization:', error);
      alert('Failed to update organization');
    }
  }

  async loadOrganizationUsers() {
    try {
      const GET_ORGANIZATION_USERS = gql`
        query GetOrganizationUsers {
          getOrganizationUsers {
            id
            email
            firstName
            lastName
            role
            createdAt
            isVerified
          }
        }
      `;

      const result = await firstValueFrom(
        this.apollo.query<any>({
          query: GET_ORGANIZATION_USERS,
          fetchPolicy: 'network-only',
        })
      );

      this.organizationUsers.set(result.data?.getOrganizationUsers || []);
    } catch (error) {
      console.error('Error loading organization users:', error);
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

    try {
      console.log('SettingsComponent: Starting connectPlatform...');
      await this.credentialsService.connectPlatform(platform, `${platform} - ${u.firstName}`);
      console.log('SettingsComponent: connectPlatform resolved. Reloading accounts...');
      await this.loadConnectedAccounts();
      console.log('SettingsComponent: Accounts reloaded.');
      alert('Account connected successfully!');
    } catch (error) {
      console.error('Error connecting platform:', error);
      alert('Failed to connect account.');
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
