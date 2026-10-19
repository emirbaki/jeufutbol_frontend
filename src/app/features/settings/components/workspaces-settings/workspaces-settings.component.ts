import { Component, OnInit, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkspaceService } from '../../../../services/workspace.service';
import { Workspace } from '../../../../models/workspace.model';
import { ToastService } from '../../../../core/services/toast.service';
import { WorkspaceContextService } from '../../../../core/services/workspace-context.service';
import { WorkspaceAvatarComponent } from '../../../../shared/workspace-avatar/workspace-avatar.component';
import { imageFileError } from '../../../../services/profile-image.service';

@Component({
  selector: 'app-workspaces-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, WorkspaceAvatarComponent],
  templateUrl: './workspaces-settings.component.html',
})
export class WorkspacesSettingsComponent implements OnInit {
  private workspaceService = inject(WorkspaceService);
  private toast = inject(ToastService);
  private workspaceContext = inject(WorkspaceContextService);

  isAdmin = input(false);

  workspaces = signal<Workspace[]>([]);
  loading = signal(false);
  saving = signal(false);

  // Add form
  newName = signal('');
  newSlug = signal('');

  // Rename state: the row in edit mode
  editingId = signal<string | null>(null);
  editName = signal('');
  editSlug = signal('');

  ngOnInit() {
    this.load();
  }

  async load() {
    this.loading.set(true);
    try {
      this.workspaces.set(await this.workspaceService.list());
    } catch (error) {
      this.toast.error(WorkspaceService.errorMessage(error, 'Could not load the workspaces.'));
    } finally {
      this.loading.set(false);
    }
  }

  async add() {
    const name = this.newName().trim();
    if (!name) return;
    this.saving.set(true);
    try {
      await this.workspaceService.create(name, this.newSlug().trim() || undefined);
      this.newName.set('');
      this.newSlug.set('');
      this.toast.success(`Workspace "${name}" added.`);
      await this.load();
      await this.workspaceContext.init(null);
    } catch (error) {
      this.toast.error(WorkspaceService.errorMessage(error, 'Could not add the workspace.'));
    } finally {
      this.saving.set(false);
    }
  }

  startEdit(workspace: Workspace) {
    this.editingId.set(workspace.id);
    this.editName.set(workspace.name);
    this.editSlug.set(workspace.slug);
  }

  cancelEdit() {
    this.editingId.set(null);
  }

  async saveEdit(workspace: Workspace) {
    this.saving.set(true);
    try {
      await this.workspaceService.update(workspace.id, {
        name: this.editName().trim(),
        slug: this.editSlug().trim(),
      });
      this.editingId.set(null);
      await this.load();
    } catch (error) {
      this.toast.error(WorkspaceService.errorMessage(error, 'Could not rename the workspace.'));
    } finally {
      this.saving.set(false);
    }
  }

  async changeImage(workspace: Workspace, event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    const error = imageFileError(file);
    if (error) {
      this.toast.error(error);
      return;
    }
    await this.runImageChange(() => this.workspaceService.uploadImage(workspace.id, file));
  }

  async removeImage(workspace: Workspace) {
    await this.runImageChange(() => this.workspaceService.removeImage(workspace.id));
  }

  private async runImageChange(change: () => Promise<Workspace>) {
    this.saving.set(true);
    try {
      await change();
      await this.load();
      // The sidebar switcher shows the new image too
      await this.workspaceContext.init(null);
    } catch (error) {
      this.toast.error(WorkspaceService.errorMessage(error, 'Could not change the image.'));
    } finally {
      this.saving.set(false);
    }
  }

  async remove(workspace: Workspace) {
    if (!confirm(`Delete the workspace "${workspace.name}"?`)) return;
    this.saving.set(true);
    try {
      await this.workspaceService.remove(workspace.id);
      this.toast.success(`Workspace "${workspace.name}" deleted.`);
      await this.load();
      await this.workspaceContext.init(null);
    } catch (error) {
      this.toast.error(WorkspaceService.errorMessage(error, 'Could not delete the workspace.'));
    } finally {
      this.saving.set(false);
    }
  }
}
