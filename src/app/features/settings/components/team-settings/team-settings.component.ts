import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TeamService, User, Invitation, BranchRole, Membership } from '../../../../services/team.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { WorkspaceContextService } from '../../../../core/services/workspace-context.service';
import { WorkspaceAvatarComponent } from '../../../../shared/workspace-avatar/workspace-avatar.component';
import { NgIcon, provideIcons } from "@ng-icons/core";
import { matGroup, matPersonAdd, matPersonRemove } from "@ng-icons/material-icons/baseline";

type InviteRole = 'ADMIN' | BranchRole;

@Component({
    selector: 'app-team-settings',
    standalone: true,
    imports: [CommonModule, FormsModule, NgIcon, WorkspaceAvatarComponent],
    templateUrl: './team-settings.component.html',
    providers: [provideIcons({ matGroup, matPersonAdd, matPersonRemove })],
})
export class TeamSettingsComponent implements OnInit {
    private toast = inject(ToastService);
    private authService = inject(AuthService);
    private workspaceContext = inject(WorkspaceContextService);

    users = signal<User[]>([]);
    invitations = signal<Invitation[]>([]);
    loading = signal(false);
    /** Set when the server says this person cannot see the team. */
    noTeamAccess = signal(false);
    me = signal<{ id: string; role: string } | null>(null);

    // Modal state
    showInviteModal = signal(false);
    inviteEmail = signal('');
    inviteRole = signal<InviteRole>('USER');
    inviteWorkspaceId = signal<string | null>(null);
    isInviting = signal(false);

    // "Add to branch" form, open for one person at a time
    addForUserId = signal<string | null>(null);
    addWorkspaceId = signal<string | null>(null);
    addRole = signal<BranchRole>('USER');

    isAdmin = computed(() => this.me()?.role === 'ADMIN');

    /** The branches where I can invite and manage people. */
    managedBranches = computed(() => {
        const all = this.workspaceContext.workspaces();
        if (this.isAdmin()) return all;
        const mine = this.users().find((u) => u.id === this.me()?.id)?.workspaceMemberships ?? [];
        const managed = new Set(mine.filter((m) => m.role === 'MANAGER').map((m) => m.workspace.id));
        return all.filter((w) => managed.has(w.id));
    });

    canInvite = computed(() => this.isAdmin() || this.managedBranches().length > 0);

    constructor(private teamService: TeamService) { }

    async ngOnInit() {
        const me = await this.authService.getCurrentUser();
        this.me.set(me ? { id: me.id, role: me.role } : null);
        this.loadData();
    }

    loadData() {
        this.loading.set(true);
        this.teamService.getOrganizationUsers().subscribe({
            next: (users) => {
                this.users.set(users);
                this.noTeamAccess.set(false);
                this.loading.set(false);
            },
            error: () => {
                // A USER without a managed branch cannot see the team.
                this.users.set([]);
                this.noTeamAccess.set(true);
                this.loading.set(false);
            },
        });
        this.teamService.getPendingInvitations().subscribe({
            next: (invitations) => this.invitations.set(invitations),
            error: () => this.invitations.set([]),
        });
    }

    canManage(workspaceId: string): boolean {
        return this.managedBranches().some((w) => w.id === workspaceId);
    }

    /** The branches where this person is not a member yet, and that I manage. */
    branchesToAdd(user: User) {
        const has = new Set((user.workspaceMemberships ?? []).map((m) => m.workspace.id));
        return this.managedBranches().filter((w) => !has.has(w.id));
    }

    openInviteModal() {
        this.inviteEmail.set('');
        this.inviteRole.set('USER');
        const branches = this.managedBranches();
        const active = this.workspaceContext.active();
        this.inviteWorkspaceId.set(
            active && branches.some((w) => w.id === active.id) ? active.id : (branches[0]?.id ?? null),
        );
        this.showInviteModal.set(true);
    }

    closeInviteModal() {
        this.showInviteModal.set(false);
    }

    async sendInvitation() {
        if (!this.inviteEmail()) return;
        const role = this.inviteRole();
        if (role !== 'ADMIN' && !this.inviteWorkspaceId()) {
            this.toast.error('Choose a branch.');
            return;
        }

        this.isInviting.set(true);
        try {
            await this.teamService.inviteUser(this.inviteEmail(), role, this.inviteWorkspaceId() ?? undefined);
            this.closeInviteModal();
            this.loadData();
            this.toast.success('Invitation sent.');
        } catch (error) {
            this.toast.error(TeamService.errorMessage(error, 'Could not send the invitation.'));
        } finally {
            this.isInviting.set(false);
        }
    }

    async revokeInvitation(id: string) {
        if (!confirm('Revoke this invitation?')) return;
        await this.run(() => this.teamService.revokeInvitation(id), 'Invitation revoked.');
    }

    openAdd(user: User) {
        const options = this.branchesToAdd(user);
        this.addForUserId.set(user.id);
        this.addWorkspaceId.set(options[0]?.id ?? null);
        this.addRole.set('USER');
    }

    async confirmAdd(user: User) {
        const workspaceId = this.addWorkspaceId();
        if (!workspaceId) return;
        await this.run(() => this.teamService.addMember(workspaceId, user.id, this.addRole()), 'Branch added.');
        this.addForUserId.set(null);
    }

    async changeRole(user: User, membership: Membership, role: BranchRole) {
        if (role === membership.role) return;
        await this.run(() => this.teamService.updateMember(membership.workspace.id, user.id, role), 'Role changed.');
    }

    async removeMembership(user: User, membership: Membership) {
        if (!confirm(`Remove ${user.firstName} from ${membership.workspace.name}?`)) return;
        await this.run(() => this.teamService.removeMember(membership.workspace.id, user.id), 'Removed from the branch.');
    }

    async toggleAdmin(user: User) {
        const makeAdmin = user.role !== 'ADMIN';
        const question = makeAdmin
            ? `Make ${user.firstName} an admin? An admin sees every branch.`
            : `Remove the admin role from ${user.firstName}?`;
        if (!confirm(question)) return;
        await this.run(() => this.teamService.setAdmin(user.id, makeAdmin), makeAdmin ? 'Admin role given.' : 'Admin role removed.');
    }

    roleLabel(role: string): string {
        return role === 'MANAGER' ? 'Manager' : role === 'ADMIN' ? 'Admin' : 'User';
    }

    /** Runs a change, shows the server text on an error, and loads the list again. */
    private async run(change: () => Promise<unknown>, success: string) {
        try {
            await change();
            this.toast.success(success);
        } catch (error) {
            this.toast.error(TeamService.errorMessage(error, 'The change failed.'));
        } finally {
            // Also on an error, so a role select shows the saved value again.
            this.loadData();
        }
    }
}
