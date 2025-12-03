import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiKeyService } from '../../../../services/api-key.service';
import { Clipboard } from '@angular/cdk/clipboard';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { matRepeatRound } from '@ng-icons/material-icons/round';
import { matVisibilityOff, matVisibility } from '@ng-icons/material-icons/baseline';
@Component({
    selector: 'app-developer-settings',
    standalone: true,
    imports: [CommonModule, NgIcon],
    providers: [provideIcons({ matRepeatRound, matVisibilityOff, matVisibility })],
    templateUrl: './developer-settings.component.html',
})
export class DeveloperSettingsComponent implements OnInit {
    clientId = signal<string | null>(null);
    clientSecret = signal<string | null>(null); // Only shown after regeneration
    loading = signal(false);
    error = signal('');
    successMessage = signal('');
    showClientId = signal(false);

    constructor(
        private apiKeyService: ApiKeyService,
        private clipboard: Clipboard
    ) { }

    ngOnInit() {
        this.loadCredentials();
    }

    loadCredentials() {
        this.loading.set(true);
        this.apiKeyService.getTenantCredentials().subscribe({
            next: (data) => {
                this.clientId.set(data.clientId);
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Failed to load credentials', err);
                this.loading.set(false);
            }
        });
    }

    regenerateSecret() {
        if (!confirm('Are you sure? This will invalidate the old secret immediately.')) {
            return;
        }

        this.loading.set(true);
        this.apiKeyService.regenerateClientSecret().subscribe({
            next: (data) => {
                this.clientSecret.set(data.clientSecret); // Show the new secret
                this.successMessage.set('Secret regenerated! Copy it now, you won\'t see it again.');
                this.loading.set(false);
            },
            error: (err) => {
                this.error.set('Failed to regenerate secret');
                this.loading.set(false);
            }
        });
    }

    copyToClipboard(text: string) {
        this.clipboard.copy(text);
        // Optional: Show toast
    }
}
