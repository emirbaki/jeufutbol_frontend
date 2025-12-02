import { Component, OnInit, signal } from '@angular/core';
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
    <div class="max-w-4xl mx-auto p-6">

      <!-- Add New Credential -->
      <div class="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-800 p-6 mb-6">
        <h3 class="font-semibold mb-4 text-gray-900 dark:text-white">Connect New Account</h3>
        
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
          @for(platform of availablePlatforms; track platform){
            <button
              (click)="connectPlatform(platform)"
              [disabled]="connecting"
              class="p-4 border-2 border-gray-200 dark:border-neutral-700 rounded-lg hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors disabled:opacity-50 dark:bg-neutral-800">
              <div class="flex flex-col items-center gap-2">
                <img [src]="platform.icon" [alt]="platform.name" class="w-12 h-12">
                <span class="text-sm font-medium text-gray-900 dark:text-white">{{ platform.name }}</span>
              </div>
            </button>
          }
        </div>
      </div>

      <!-- Connected Credentials List -->
      <div class="space-y-4">
        @if (credentials().length === 0) {
          <div class="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-800 p-12 text-center">
            <div class="text-6xl mb-4">🔗</div>
            <h3 class="text-xl font-semibold mb-2 text-gray-900 dark:text-white">No Connected Accounts</h3>
            <p class="text-gray-600 dark:text-gray-400">Connect your social media accounts to start posting</p>
          </div>
        }

        @for(credential of credentials(); track credential.id){
          <div class="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-800 p-6">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4">
                @if(credential.accountImage){
                  <img
                    [src]="credential.accountImage"
                    [alt]="credential.accountName"
                    class="w-12 h-12 rounded-full">
                }
                <div>
                  <h4 class="font-semibold text-gray-900 dark:text-white">{{ credential.name }}</h4>
                  <p class="text-sm text-gray-600 dark:text-gray-400">@{{ credential.accountName }}</p>
                  <div class="flex flex-col gap-1 mt-1">
                    <span class="text-xs text-gray-500 dark:text-gray-500">{{ credential.platform }}</span>
                    <span class="text-xs text-gray-500 dark:text-gray-500">ID: {{ credential.id}}</span>
                    @if(credential.tokenExpiresAt){
                      <span class="text-xs text-gray-500 dark:text-gray-500">Expires: {{ credential.tokenExpiresAt}}</span>
                    }
                  </div>
                </div>
              </div>
              
              <div class="flex items-center gap-3">
                <button
                  (click)="testConnection(credential)"
                  class="px-4 py-2 text-sm bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-900 dark:text-white rounded-lg transition-colors">
                  Test
                </button>
                <button
                  (click)="deleteCredential(credential)"
                  class="px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                  Remove
                </button>
              </div>
            </div>

            <!-- Expiry Warning -->
            @if(isExpiringSoon(credential)){
              <div class="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ Token expires soon. Please reconnect.
              </div>
            }
          </div>
        }
      </div>
    </div>
  `
})
export class CredentialManagerComponent implements OnInit {
  credentials = signal<Credential[]>([]);
  connecting = false;

  availablePlatforms = [
    { name: 'Twitter/X', value: 'x', icon: 'assets/icons/Twitter.png' },
    { name: 'Instagram', value: 'instagram', icon: 'assets/icons/Instagram.png' },
    { name: 'Facebook', value: 'facebook', icon: 'assets/icons/facebook.png' },
    { name: 'TikTok', value: 'tiktok', icon: 'assets/icons/tiktok.png' },
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
}