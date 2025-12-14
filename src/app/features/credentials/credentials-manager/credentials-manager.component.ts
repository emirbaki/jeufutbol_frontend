import { Component, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CredentialsService } from '../../../services/credentials.service';

interface Credential {
  id: string;
  name: string;
  platform: string;
  accountName: string;
  accountImage?: string;
  isActive: boolean;
  tokenExpiresAt?: Date;
  createdAt: Date;
}

@Component({
  selector: 'app-credential-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-8">

      <!-- Add New Credential -->
      <div class="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-gray-200 dark:border-neutral-800 p-8">
        <h3 class="text-xl font-bold mb-6 text-gray-900 dark:text-white">Connect New Account</h3>
        
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          @for(platform of availablePlatforms; track platform){
            <button
              (click)="connectPlatform(platform)"
              [disabled]="connecting"
              class="group relative p-4 border border-gray-200 dark:border-neutral-700 rounded-xl hover:border-amber-500 dark:hover:border-amber-500 transition-all duration-200 disabled:opacity-50 bg-gray-50 dark:bg-neutral-800/50 hover:bg-white dark:hover:bg-neutral-800 hover:shadow-md"
            >
              <div class="flex flex-col items-center gap-3">
                <div class="w-12 h-12 rounded-full bg-white dark:bg-neutral-700 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-200">
                  <img [src]="platform.icon" [alt]="platform.name" class="w-8 h-8 object-contain">
                </div>
                <span class="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">{{ platform.name }}</span>
              </div>
            </button>
          }
        </div>
      </div>

      <!-- Connected Credentials List -->
      <div class="space-y-4">
        @if (credentials().length === 0) {
          <div class="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-gray-200 dark:border-neutral-800 p-12 text-center">
            <div class="text-6xl mb-4 opacity-50">🔗</div>
            <h3 class="text-xl font-semibold mb-2 text-gray-900 dark:text-white">No Connected Accounts</h3>
            <p class="text-gray-500 dark:text-gray-400">Connect your social media accounts to start posting.</p>
          </div>
        }

        @for(credential of credentials(); track credential.id){
          <div class="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-gray-200 dark:border-neutral-800 p-6 transition-all hover:border-amber-200 dark:hover:border-amber-900/50">
            <div class="flex items-center justify-between flex-wrap gap-4">
              <div class="flex items-center gap-4">
                <div class="relative">
                  @if(credential.accountImage){
                    <img
                      [src]="credential.accountImage"
                      [alt]="credential.accountName"
                      class="w-14 h-14 rounded-full border-2 border-white dark:border-neutral-800 shadow-sm">
                  }
                  <div class="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white dark:border-neutral-900" title="Active"></div>
                </div>
                <div>
                  <h4 class="font-bold text-lg text-gray-900 dark:text-white">{{ credential.name }}</h4>
                  <p class="text-sm text-gray-500 dark:text-gray-400 font-medium">@{{ credential.accountName }}</p>
                  <div class="flex flex-wrap gap-2 mt-2">
                    <span class="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-neutral-800 text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-neutral-700 uppercase tracking-wide">{{ credential.platform }}</span>
                    @if(credential.tokenExpiresAt){
                      <span class="px-2 py-0.5 rounded-md bg-yellow-50 dark:bg-yellow-900/20 text-xs font-medium text-yellow-700 dark:text-yellow-400 border border-yellow-100 dark:border-yellow-900/30">
                        Expires: {{ credential.tokenExpiresAt | date:'medium' }}
                      </span>
                    }
                  </div>
                </div>
              </div>
              
              <div class="flex items-center gap-3">
                <button
                  (click)="refreshCredential(credential)"
                  [disabled]="isRefreshing(credential.id)"
                  class="px-4 py-2 text-sm font-medium bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded-xl transition-colors border border-amber-200 dark:border-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Manually refresh OAuth token">
                  @if(isRefreshing(credential.id)) {
                    <span class="flex items-center gap-1">⏳ Refreshing...</span>
                  } @else {
                    🔄 Refresh Token
                  }
                </button>
                <button
                  (click)="testConnection(credential)"
                  class="px-4 py-2 text-sm font-medium bg-gray-50 dark:bg-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-700 dark:text-gray-200 rounded-xl transition-colors border border-gray-200 dark:border-neutral-700">
                  Test Connection
                </button>
                <button
                  (click)="deleteCredential(credential)"
                  class="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors border border-transparent hover:border-red-100 dark:hover:border-red-900/30">
                  Disconnect
                </button>
              </div>
            </div>

            <!-- Expiry Warning -->
            @if(isExpiringSoon(credential)){
              <div class="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-xl flex items-start gap-3">
                <span class="text-xl">⚠️</span>
                <div>
                  <h5 class="text-sm font-bold text-yellow-800 dark:text-yellow-200">Token Expiring Soon</h5>
                  <p class="text-sm text-yellow-700 dark:text-yellow-300 mt-0.5">Please reconnect this account to ensure uninterrupted service.</p>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CredentialManagerComponent implements OnInit {
  credentials = signal<Credential[]>([]);
  connecting = false;
  refreshingIds = signal<Set<string>>(new Set()); // Track which credentials are being refreshed

  availablePlatforms = [
    { name: 'Twitter/X', value: 'x', icon: 'assets/icons/Twitter.png' },
    { name: 'Instagram', value: 'instagram', icon: 'assets/icons/Instagram.png' },
    { name: 'Facebook', value: 'facebook', icon: 'assets/icons/facebook.png' },
    { name: 'TikTok', value: 'tiktok', icon: 'assets/icons/tiktok.png' },
    { name: 'YouTube', value: 'youtube', icon: 'assets/icons/youtube_v2.png' },
  ];

  constructor(private credentialsService: CredentialsService) { }

  async ngOnInit() {
    await this.loadCredentials();

    // Listen to OAuth completion via BroadcastChannel
    const channel = new BroadcastChannel('oauth_channel');
    channel.onmessage = async (event) => {
      if (event.data?.type === 'OAUTH_SUCCESS') {
        console.log('CredentialManagerComponent: OAuth success detected, refreshing credentials...');
        await this.loadCredentials();
      }
    };
  }

  async loadCredentials() {
    console.log('CredentialManagerComponent: Loading credentials...');
    let credentials = await this.credentialsService.getCredentials();
    console.log('CredentialManagerComponent: Loaded credentials:', credentials);
    this.credentials.set(credentials);
  }

  async connectPlatform(platform: any) {
    this.connecting = true;
    try {
      // Open OAuth popup - the BroadcastChannel will handle the refresh
      await this.credentialsService.connectPlatform(platform.value, platform.name);

      // The ngOnInit BroadcastChannel listener will automatically refresh credentials
      console.log('CredentialManagerComponent: connectPlatform completed');
    } catch (error) {
      console.error('Connection error:', error);
      alert('Failed to connect account');
    } finally {
      this.connecting = false;
    }
  }

  async testConnection(credential: Credential) {
    const isValid = await this.credentialsService.testCredential(credential.id);
    alert(isValid ? 'Connection is valid ✅' : 'Connection failed ❌');
  }

  async deleteCredential(credential: Credential) {
    if (!confirm(`Remove ${credential.name}?`)) return;

    await this.credentialsService.deleteCredential(credential.id);
    await this.loadCredentials();
  }

  isExpiringSoon(credential: Credential): boolean {
    if (!credential.tokenExpiresAt) return false;

    const daysUntilExpiry = (new Date(credential.tokenExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return daysUntilExpiry < 7;
  }

  /**
   * Check if a credential is currently being refreshed
   */
  isRefreshing(credentialId: string): boolean {
    return this.refreshingIds().has(credentialId);
  }

  /**
   * Manually refresh OAuth token for a credential
   */
  async refreshCredential(credential: Credential) {
    if (this.isRefreshing(credential.id)) return;

    // Mark as refreshing
    const current = new Set(this.refreshingIds());
    current.add(credential.id);
    this.refreshingIds.set(current);

    try {
      await this.credentialsService.refreshCredential(credential.id);
      await this.loadCredentials(); // Reload to get updated expiry
      alert('Token refreshed successfully! ✅');
    } catch (error: any) {
      console.error('Error refreshing token:', error);
      alert(`Failed to refresh token: ${error.message || 'Unknown error'}`);
    } finally {
      // Remove from refreshing
      const updated = new Set(this.refreshingIds());
      updated.delete(credential.id);
      this.refreshingIds.set(updated);
    }
  }
}