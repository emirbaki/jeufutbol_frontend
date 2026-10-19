import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { Apollo } from 'apollo-angular';
import { WorkspaceService } from '../../services/workspace.service';
import { Workspace } from '../../models/workspace.model';

/**
 * The active workspace (branch) of this browser tab. Every request to the
 * backend sends its ID in the X-Workspace-Id header, so each page shows only
 * the data of this workspace.
 */
@Injectable({ providedIn: 'root' })
export class WorkspaceContextService {
  static readonly storageKey = 'jeu_active_workspace';

  private workspaceService = inject(WorkspaceService);
  private apollo = inject(Apollo);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  workspaces = signal<Workspace[]>([]);
  private activeId = signal<string | null>(WorkspaceContextService.currentId());
  active = computed<Workspace | null>(() => this.workspaces().find((w) => w.id === this.activeId()) ?? null);

  /** The active workspace ID of this tab, or null. Safe on the server. */
  static currentId(): string | null {
    try {
      return typeof sessionStorage === 'undefined' ? null : sessionStorage.getItem(WorkspaceContextService.storageKey);
    } catch {
      return null;
    }
  }

  /** Loads the workspaces and picks this tab's one, the user's stored one, or the default. */
  async init(user: { activeWorkspace?: { id: string } | null } | null): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    const list = await this.workspaceService.list();
    this.workspaces.set(list);
    const known = (id?: string | null) => !!id && list.some((w) => w.id === id);
    const tabId = WorkspaceContextService.currentId();
    const id = known(tabId)
      ? tabId
      : known(user?.activeWorkspace?.id)
        ? user!.activeWorkspace!.id
        : (list.find((w) => w.isDefault)?.id ?? list[0]?.id ?? null);
    this.store(id);
  }

  /** Switches the branch for this tab, saves it for the next login, and reloads the page data. */
  async setActive(id: string): Promise<void> {
    if (id === this.activeId()) return;
    this.store(id);
    await this.workspaceService.setActive(id);
    await this.apollo.client.resetStore();
    const url = this.router.url;
    await this.router.navigateByUrl('/', { skipLocationChange: true });
    await this.router.navigateByUrl(url);
  }

  private store(id: string | null): void {
    this.activeId.set(id);
    try {
      if (id) sessionStorage.setItem(WorkspaceContextService.storageKey, id);
      else sessionStorage.removeItem(WorkspaceContextService.storageKey);
    } catch {
      // Storage can be blocked. The header then falls back to the stored user value.
    }
  }
}
