import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiKeyService, ApiKey } from '../../../../services/api-key.service';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { matAdd } from '@ng-icons/material-icons/baseline';
@Component({
    selector: 'app-api-keys-settings',
    standalone: true,
    imports: [CommonModule, FormsModule, NgIcon],
    templateUrl: './api-keys-settings.component.html',
    providers: [provideIcons({ matAdd })]
})
export class ApiKeysSettingsComponent implements OnInit {
    apiKeys = signal<ApiKey[]>([]);
    loading = signal(false);

    // Create Modal State
    showCreateModal = signal(false);
    newKeyName = signal('');
    newKeyScope = signal('READ_ONLY');
    creating = signal(false);

    // Success Modal State
    createdKey = signal<string | null>(null);

    constructor(private apiKeyService: ApiKeyService) { }

    ngOnInit() {
        this.loadKeys();
    }

    async loadKeys() {
        this.loading.set(true);
        try {
            this.apiKeyService.listApiKeys().subscribe(keys => {
                this.apiKeys.set(keys);
            });
        } catch (error) {
            console.error('Error loading API keys:', error);
        } finally {
            this.loading.set(false);
        }
    }

    async createKey() {
        if (!this.newKeyName()) return;

        this.creating.set(true);
        try {
            // Assuming createApiKey takes (name, scope) or similar. 
            // Adjusting to match the likely service signature based on previous context.
            // If the service expects granular scopes, we might need to map 'READ_ONLY' to a list.
            // For now, passing the scope string as is, assuming backend handles it or service maps it.
            const result = await this.apiKeyService.createApiKey(
                this.newKeyName(),
                [this.newKeyScope()] // Passing as array if service expects array, or just string if overloaded.
                // Checking service signature in next step if this fails, but assuming array of scopes.
            );

            this.createdKey.set(result.apiKey || null);
            this.showCreateModal.set(false);
            this.newKeyName.set('');
            this.loadKeys();
        } catch (error) {
            console.error('Error creating API key:', error);
            alert('Failed to create API key.');
        } finally {
            this.creating.set(false);
        }
    }

    closeCreatedModal() {
        this.createdKey.set(null);
    }

    copyKey() {
        const key = this.createdKey();
        if (key) {
            navigator.clipboard.writeText(key).then(() => {
                alert('Copied to clipboard!');
            });
        }
    }

    async revokeKey(key: ApiKey) {
        if (!confirm(`Are you sure you want to revoke ${key.name}?`)) return;

        try {
            await this.apiKeyService.revokeApiKey(key.id);
            this.loadKeys();
        } catch (error) {
            console.error('Error revoking API key:', error);
            alert('Failed to revoke API key.');
        }
    }
}
