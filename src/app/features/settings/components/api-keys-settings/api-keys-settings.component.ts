import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiKeyService, ApiKey } from '../../../../services/api-key.service';
import { ToastService } from '../../../../core/services/toast.service';
import { WorkspaceContextService } from '../../../../core/services/workspace-context.service';
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
    private toast = inject(ToastService);
    private workspaceContext = inject(WorkspaceContextService);
    workspaces = this.workspaceContext.workspaces;
    apiKeys = signal<ApiKey[]>([]);
    loading = signal(false);

    // Create Modal State
    showCreateModal = signal(false);
    newKeyName = signal('');
    newKeyScope = signal('READ_ONLY');
    creating = signal(false);

    // Branch picker, shared by the create form and the "Edit branches" form
    branchMode = signal<'all' | 'selected'>('all');
    selectedBranchIds = signal<string[]>([]);
    defaultBranchId = signal<string | null>(null);
    selectedBranches = computed(() => this.workspaces().filter((w) => this.selectedBranchIds().includes(w.id)));

    // Edit branches modal state
    editingKey = signal<ApiKey | null>(null);
    savingBranches = signal(false);

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
            const branches = this.branchChoice();
            if (!branches) return;
            const result = await this.apiKeyService.createApiKey(
                this.newKeyName(),
                [this.newKeyScope()], // Passing as array if service expects array, or just string if overloaded.
                // Checking service signature in next step if this fails, but assuming array of scopes.
                undefined,
                branches.workspaceIds,
                branches.defaultWorkspaceId ?? undefined,
            );

            this.createdKey.set(result.apiKey || null);
            this.showCreateModal.set(false);
            this.newKeyName.set('');
            this.loadKeys();
            this.toast.success('API key created successfully');
        } catch (error) {
            console.error('Error creating API key:', error);
            this.toast.error(this.errorText(error, 'Failed to create API key.'));
        } finally {
            this.creating.set(false);
        }
    }

    openCreateModal() {
        this.resetBranchPicker([], null);
        this.showCreateModal.set(true);
    }

    openEditBranches(key: ApiKey) {
        this.resetBranchPicker(key.workspaceIds ?? [], key.defaultWorkspaceId ?? null);
        this.editingKey.set(key);
    }

    async saveBranches() {
        const key = this.editingKey();
        const branches = this.branchChoice();
        if (!key || !branches) return;
        this.savingBranches.set(true);
        try {
            await this.apiKeyService.updateWorkspaces(key.id, branches.workspaceIds, branches.defaultWorkspaceId);
            this.editingKey.set(null);
            this.loadKeys();
            this.toast.success('Branches saved.');
        } catch (error) {
            this.toast.error(this.errorText(error, 'Could not save the branches.'));
        } finally {
            this.savingBranches.set(false);
        }
    }

    toggleBranch(id: string, checked: boolean) {
        const ids = this.selectedBranchIds().filter((x) => x !== id);
        this.selectedBranchIds.set(checked ? [...ids, id] : ids);
        if (!checked && this.defaultBranchId() === id) this.defaultBranchId.set(null);
        if (checked && !this.defaultBranchId()) this.defaultBranchId.set(id);
    }

    /** The branch names of a key, or "All branches". */
    branchNames(key: ApiKey): string {
        const ids = key.workspaceIds ?? [];
        if (!ids.length) return 'All branches';
        return this.workspaces().filter((w) => ids.includes(w.id)).map((w) => w.name).join(', ') || `${ids.length} branches`;
    }

    private resetBranchPicker(ids: string[], defaultId: string | null) {
        this.branchMode.set(ids.length ? 'selected' : 'all');
        this.selectedBranchIds.set([...ids]);
        this.defaultBranchId.set(defaultId);
    }

    /** The picker's value for the server, or null (with a toast) when it is not valid. */
    private branchChoice(): { workspaceIds: string[]; defaultWorkspaceId: string | null } | null {
        if (this.branchMode() === 'all') {
            return { workspaceIds: [], defaultWorkspaceId: this.defaultBranchId() };
        }
        const ids = this.selectedBranchIds();
        if (!ids.length) {
            this.toast.error('Select at least one branch.');
            return null;
        }
        const def = this.defaultBranchId();
        return { workspaceIds: ids, defaultWorkspaceId: def && ids.includes(def) ? def : ids[0] };
    }

    private errorText(error: any, fallback: string): string {
        return error?.graphQLErrors?.[0]?.message || error?.message || fallback;
    }

    closeCreatedModal() {
        this.createdKey.set(null);
    }

    copyKey() {
        const key = this.createdKey();
        if (key) {
            navigator.clipboard.writeText(key).then(() => {
                this.toast.success('Copied to clipboard!');
            });
        }
    }

    async revokeKey(key: ApiKey) {
        if (!confirm(`Are you sure you want to revoke ${key.name}?`)) return;

        try {
            await this.apiKeyService.revokeApiKey(key.id);
            this.loadKeys();
            this.toast.success('API key revoked');
        } catch (error) {
            console.error('Error revoking API key:', error);
            this.toast.error('Failed to revoke API key.');
        }
    }
}
