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
      <div class="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 mb-6">
        <h3 class="font-semibold mb-4">Connect New Account</h3>
        
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
          @for(platform of availablePlatforms; track platform){
            <button
              (click)="connectPlatform(platform)"
              [disabled]="connecting"
              class="p-4 border-2 border-neutral-200 rounded-lg hover:border-primary-500 transition-colors disabled:opacity-50">
              <div class="flex flex-col items-center gap-2">
                <img [src]="platform.icon" [alt]="platform.name" class="w-12 h-12">
                <span class="text-sm font-medium">{{ platform.name }}</span>
              </div>
            </button>
          }
        </div>
      </div>

      <!-- Connected Credentials List -->
      <div class="space-y-4">
        @for(credential of credentials(); track credential.id){
          <div
            class ="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4">
                @if(credential.accountImage){
                  <img
                    [src]="credential.accountImage"
                    [alt]="credential.accountName"
                    class="w-12 h-12 rounded-full">
                }
                  <div>
                    <h4 class="font-semibold">{{ credential.name }}</h4>
                    <p class="text-sm text-neutral-600">@{{ credential.accountName }}</p>
                    <span class="text-xs text-neutral-500">{{ credential.platform }}</span>
                    <span class="text-xs text-neutral-500">{{ credential.id}}</span>
                    <span class="text-xs text-neutral-500">{{ credential.tokenExpiresAt}}</span>
                  </div>
                </div>
                
                <div class="flex items-center gap-3">
                  <button
                    (click)="testConnection(credential)"
                    class="px-4 py-2 text-sm bg-neutral-100 hover:bg-neutral-200 rounded-lg">
                    Test
                  </button>
                  <button
                    (click)="deleteCredential(credential)"
                    class="px-4 py-2 text-sm text-error-600 hover:bg-error-50 rounded-lg">
                    Remove
                  </button>
                </div>
              </div>

              <!-- Expiry Warning -->
              @if(isExpiringSoon(credential)){
                <div
                  class="mt-4 p-3 bg-warning-50 border border-warning-200 rounded-lg text-sm">
                  ⚠️ Token expires soon. Please reconnect.
                </div>
              }
            </div>
            <!-- Empty State -->
            @if (credentials().length === 0) {
              <div
                class="bg-white rounded-xl shadow-sm border border-neutral-200 p-12 text-center">
                <div class="text-6xl mb-4">🔗</div>
                <h3 class="text-xl font-semibold mb-2">No Connected Accounts</h3>
                <p class="text-neutral-600">Connect your social media accounts to start posting</p>
              </div>
            }
      <div>
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
    { name: 'Twitter/X', value: 'twitter', icon: 'assets/icons/Twitter.png' },
    { name: 'Instagram', value: 'instagram', icon: 'assets/icons/Instagram.png' },
    { name: 'Facebook', value: 'facebook', icon: 'assets/icons/facebook.png' },
    { name: 'TikTok', value: 'tiktok', icon: 'assets/icons/tiktok.png' },
  ];

  constructor(private credentialsService: CredentialsService) { }

  async ngOnInit() {
    await this.loadCredentials();
  }

  async loadCredentials() {
    let credentials = await this.credentialsService.getCredentials();
    this.credentials.set(credentials);
  }

  async connectPlatform(platform: any) {
    this.connecting = true;
    try {
      // Open OAuth popup
      await this.credentialsService.connectPlatform(platform.value, platform.name);

      // Wait for callback
      await this.waitForCallback();

      // Reload credentials
      await this.loadCredentials();
    } catch (error) {
      console.error('Connection error:', error);
      alert('Failed to connect account');
    } finally {
      this.connecting = false;
    }
  }

  private waitForCallback(): Promise<void> {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('credential') === 'connected') {
          clearInterval(interval);
          resolve();
        }
      }, 1000);

      setTimeout(() => {
        clearInterval(interval);
        resolve();
      }, 60000); // Timeout after 1 minute
    });
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