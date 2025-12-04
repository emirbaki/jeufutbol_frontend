import { Component, OnInit, computed, signal, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { TenantService } from '../../core/services/tenant.service';
import { CredentialManagerComponent } from "../credentials/credentials-manager/credentials-manager.component";
import { LlmCredentialsComponent } from "../llm-credentials/llm-credentials.component";
import { TeamSettingsComponent } from "./components/team-settings/team-settings.component";
import { ApiKeysSettingsComponent } from "./components/api-keys-settings/api-keys-settings.component";
import { DeveloperSettingsComponent } from "./components/developer-settings/developer-settings.component";
import { NgIcon, provideIcons } from "@ng-icons/core";
import { matAdminPanelSettings, matApartment, matLink, matApi, matNotifications } from "@ng-icons/material-icons/baseline";

type SettingsTab = 'general' | 'organization' | 'integrations' | 'developer' | 'notifications';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, CredentialManagerComponent,
    LlmCredentialsComponent, TeamSettingsComponent,
    ApiKeysSettingsComponent, DeveloperSettingsComponent,
    NgIcon,],
  templateUrl: './settings.component.html',
  providers: [provideIcons({ matAdminPanelSettings, matApartment, matLink, matApi, matNotifications })],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent implements OnInit {
  // 🔹 Signals
  activeTab = signal<SettingsTab>('general');
  user = signal<any | null>(null);
  organization = signal<any | null>(null);
  loading = signal(false);

  // 🔹 Profile form
  firstName = signal('');
  lastName = signal('');
  email = signal('');

  // 🔹 Password form
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

  isAdmin = computed(() => {
    const u = this.user();
    return u?.role === 'ADMIN';
  });

  constructor(
    private authService: AuthService,
    private tenantService: TenantService,
    private cdr: ChangeDetectorRef
  ) { }

  async ngOnInit() {
    await this.loadUserData();
    await this.loadOrganization();
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

  selectTab(tab: SettingsTab) {
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

  saveNotificationSettings() {
    alert('Notification settings saved!');
  }
}
