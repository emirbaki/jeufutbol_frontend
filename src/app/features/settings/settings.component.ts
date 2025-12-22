import { Component, OnInit, computed, signal, ChangeDetectorRef, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { TenantService } from '../../core/services/tenant.service';
import { ToastService } from '../../core/services/toast.service';
import { CredentialManagerComponent } from "../credentials/credentials-manager/credentials-manager.component";
import { LlmCredentialsComponent } from "../llm-credentials/llm-credentials.component";
import { TeamSettingsComponent } from "./components/team-settings/team-settings.component";
import { ApiKeysSettingsComponent } from "./components/api-keys-settings/api-keys-settings.component";
import { DeveloperSettingsComponent } from "./components/developer-settings/developer-settings.component";
import { NgIcon, provideIcons } from "@ng-icons/core";
import { matAdminPanelSettings, matApartment, matLink, matApi, matNotifications } from "@ng-icons/material-icons/baseline";
import { Apollo, gql } from 'apollo-angular';
import { firstValueFrom } from 'rxjs';

const UPDATE_PROFILE = gql`
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      id
      firstName
      lastName
    }
  }
`;

const CHANGE_PASSWORD = gql`
  mutation ChangePassword($input: ChangePasswordInput!) {
    changePassword(input: $input)
  }
`;

const UPDATE_NOTIFICATION_SETTINGS = gql`
  mutation UpdateNotificationSettings($input: UpdateNotificationSettingsInput!) {
    updateNotificationSettings(input: $input) {
      id
      notifyOnPublish
      notifyOnFail
      notifyWeeklyReport
      notifyNewInsights
    }
  }
`;

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
  private apollo = inject(Apollo);
  private toast = inject(ToastService);
  private authService = inject(AuthService);
  private tenantService = inject(TenantService);
  private cdr = inject(ChangeDetectorRef);

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

  async ngOnInit() {
    await this.loadUserData();
    await this.loadOrganization();
  }

  async loadUserData() {
    const userData = await this.authService.getCurrentUser();
    if (userData) {
      this.user.set(userData);
      this.firstName.set(userData.firstName);
      this.lastName.set(userData.lastName);
      this.email.set(userData.email);
      // Load notification settings from user data
      this.notifications.set({
        emailOnPublish: userData.notifyOnPublish ?? true,
        emailOnFail: userData.notifyOnFail ?? true,
        weeklyReport: userData.notifyWeeklyReport ?? true,
        newInsights: userData.notifyNewInsights ?? true,
      });
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
      this.toast.success('Organization updated successfully');
    } catch (error) {
      console.error('Error updating organization:', error);
      this.toast.error('Failed to update organization');
    }
  }

  selectTab(tab: SettingsTab) {
    this.activeTab.set(tab);
  }

  toggleLock(type: 'profile' | 'password') {
    if (type === 'profile') {
      this.profileLocked.update((v: boolean) => !v);
    } else {
      this.passwordLocked.update((v: boolean) => !v);
    }
  }

  async updateProfile() {
    this.loading.set(true);
    try {
      const result = await firstValueFrom(
        this.apollo.mutate({
          mutation: UPDATE_PROFILE,
          variables: {
            input: {
              firstName: this.firstName(),
              lastName: this.lastName(),
            },
          },
        })
      );
      this.toast.success('Profile updated successfully!');
      this.profileLocked.set(true);
      this.cdr.markForCheck();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      this.toast.error(error.message || 'Failed to update profile');
    } finally {
      this.loading.set(false);
    }
  }

  async changePassword() {
    if (this.newPassword() !== this.confirmPassword()) {
      this.toast.error('Passwords do not match');
      return;
    }
    if (this.newPassword().length < 6) {
      this.toast.error('Password must be at least 6 characters');
      return;
    }

    this.loading.set(true);
    try {
      await firstValueFrom(
        this.apollo.mutate({
          mutation: CHANGE_PASSWORD,
          variables: {
            input: {
              currentPassword: this.currentPassword(),
              newPassword: this.newPassword(),
            },
          },
        })
      );
      this.toast.success('Password changed successfully!');
      this.currentPassword.set('');
      this.newPassword.set('');
      this.confirmPassword.set('');
      this.passwordLocked.set(true);
      this.cdr.markForCheck();
    } catch (error: any) {
      console.error('Error changing password:', error);
      this.toast.error(error.message || 'Failed to change password');
    } finally {
      this.loading.set(false);
    }
  }

  async saveNotificationSettings() {
    this.loading.set(true);
    try {
      const notifs = this.notifications();
      await firstValueFrom(
        this.apollo.mutate({
          mutation: UPDATE_NOTIFICATION_SETTINGS,
          variables: {
            input: {
              notifyOnPublish: notifs.emailOnPublish,
              notifyOnFail: notifs.emailOnFail,
              notifyWeeklyReport: notifs.weeklyReport,
              notifyNewInsights: notifs.newInsights,
            },
          },
        })
      );
      this.toast.success('Notification settings saved!');
      this.cdr.markForCheck();
    } catch (error: any) {
      console.error('Error saving notification settings:', error);
      this.toast.error(error.message || 'Failed to save notification settings');
    } finally {
      this.loading.set(false);
    }
  }
}

