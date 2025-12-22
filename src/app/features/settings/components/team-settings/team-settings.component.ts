import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TeamService, User, Invitation } from '../../../../services/team.service';
import { ToastService } from '../../../../core/services/toast.service';
import { NgIcon, provideIcons } from "@ng-icons/core";
import { matGroup, matPersonAdd, matPersonRemove } from "@ng-icons/material-icons/baseline";

@Component({
    selector: 'app-team-settings',
    standalone: true,
    imports: [CommonModule, FormsModule, NgIcon,],
    templateUrl: './team-settings.component.html',
    providers: [provideIcons({ matGroup, matPersonAdd, matPersonRemove })],
})
export class TeamSettingsComponent implements OnInit {
    private toast = inject(ToastService);
    users = signal<User[]>([]);
    invitations = signal<Invitation[]>([]);
    loading = signal(false);

    // Modal state
    showInviteModal = signal(false);
    inviteEmail = signal('');
    inviteRole = signal('USER');
    isInviting = signal(false);

    constructor(private teamService: TeamService) { }

    ngOnInit() {
        this.loadData();
    }

    async loadData() {
        this.loading.set(true);
        try {
            this.teamService.getOrganizationUsers().subscribe(users => {
                this.users.set(users);
            });

            this.teamService.getPendingInvitations().subscribe(invitations => {
                this.invitations.set(invitations);
            });
        } catch (error) {
            console.error('Error loading team data:', error);
        } finally {
            this.loading.set(false);
        }
    }

    openInviteModal() {
        this.inviteEmail.set('');
        this.inviteRole.set('USER');
        this.showInviteModal.set(true);
    }

    closeInviteModal() {
        this.showInviteModal.set(false);
    }

    async sendInvitation() {
        if (!this.inviteEmail()) return;

        this.isInviting.set(true);
        try {
            await this.teamService.inviteUser(this.inviteEmail(), this.inviteRole());
            this.closeInviteModal();
            this.loadData();
            this.toast.success('Invitation sent successfully!');
        } catch (error) {
            console.error('Error sending invitation:', error);
            this.toast.error('Failed to send invitation. Please try again.');
        } finally {
            this.isInviting.set(false);
        }
    }

    async revokeInvitation(id: string) {
        if (!confirm('Are you sure you want to revoke this invitation?')) return;

        try {
            await this.teamService.revokeInvitation(id);
            this.loadData();
            this.toast.success('Invitation revoked');
        } catch (error) {
            console.error('Error revoking invitation:', error);
            this.toast.error('Failed to revoke invitation.');
        }
    }
}
