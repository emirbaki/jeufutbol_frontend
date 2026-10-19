import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { firstValueFrom, map, Observable } from 'rxjs';

export type BranchRole = 'MANAGER' | 'USER';

/** A person's membership in one branch (workspace). */
export interface Membership {
    role: BranchRole;
    workspace: { id: string; name: string; slug: string; imageUrl?: string | null };
}

export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'ADMIN' | 'MANAGER' | 'USER';
    isVerified: boolean;
    createdAt: string;
    workspaceMemberships?: Membership[];
}

export interface Invitation {
    id: string;
    email: string;
    role: 'ADMIN' | 'MANAGER' | 'USER';
    status: 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED';
    expiresAt: string;
    createdAt: string;
    token: string;
    workspaceRole?: BranchRole | null;
    workspace?: { id: string; name: string } | null;
    invitedBy: {
        firstName: string;
        lastName: string;
        email: string;
    };
}

const MEMBERSHIP_FIELDS = `workspaceMemberships { role workspace { id name slug imageUrl } }`;

@Injectable({
    providedIn: 'root',
})
export class TeamService {
    constructor(private apollo: Apollo) { }

    getOrganizationUsers(): Observable<User[]> {
        const GET_USERS = gql`
      query GetOrganizationUsers {
        getOrganizationUsers {
          id
          email
          firstName
          lastName
          role
          isVerified
          createdAt
          ${MEMBERSHIP_FIELDS}
        }
      }
    `;

        return this.apollo
            .query<{ getOrganizationUsers: User[] }>({
                query: GET_USERS,
                fetchPolicy: 'network-only',
            })
            .pipe(map((result) => result.data.getOrganizationUsers));
    }

    getPendingInvitations(): Observable<Invitation[]> {
        const LIST_INVITATIONS = gql`
      query ListPendingInvitations {
        listPendingInvitations {
          id
          email
          role
          status
          expiresAt
          createdAt
          token
          workspaceRole
          workspace { id name }
          invitedBy {
            firstName
            lastName
            email
          }
        }
      }
    `;

        return this.apollo
            .query<{ listPendingInvitations: Invitation[] }>({
                query: LIST_INVITATIONS,
                fetchPolicy: 'network-only',
            })
            .pipe(map((result) => result.data.listPendingInvitations));
    }

    /** role 'ADMIN' invites an admin (no branch). MANAGER or USER needs a branch. */
    inviteUser(email: string, role: 'ADMIN' | BranchRole, workspaceId?: string): Promise<Invitation> {
        const INVITE_USER = gql`
      mutation InviteUser($input: InviteUserInput!) {
        inviteUser(input: $input) {
          id
          email
          role
          status
          expiresAt
          createdAt
        }
      }
    `;
        const input =
            role === 'ADMIN'
                ? { email, role }
                : { email, role, workspaceId, workspaceRole: role };

        return firstValueFrom(
            this.apollo
                .mutate<{ inviteUser: Invitation }>({ mutation: INVITE_USER, variables: { input } })
                .pipe(map((result) => result.data!.inviteUser))
        );
    }

    revokeInvitation(invitationId: string): Promise<boolean> {
        const REVOKE_INVITATION = gql`
      mutation RevokeInvitation($invitationId: ID!) {
        revokeInvitation(invitationId: $invitationId)
      }
    `;

        return firstValueFrom(
            this.apollo
                .mutate<{ revokeInvitation: boolean }>({
                    mutation: REVOKE_INVITATION,
                    variables: {
                        invitationId,
                    },
                })
                .pipe(map((result) => result.data!.revokeInvitation))
        );
    }

    async addMember(workspaceId: string, userId: string, role: BranchRole): Promise<void> {
        await firstValueFrom(this.apollo.mutate({
            mutation: gql`
              mutation AddWorkspaceMember($workspaceId: ID!, $userId: ID!, $role: WorkspaceRole!) {
                addWorkspaceMember(workspaceId: $workspaceId, userId: $userId, role: $role) { id }
              }
            `,
            variables: { workspaceId, userId, role },
        }));
    }

    async updateMember(workspaceId: string, userId: string, role: BranchRole): Promise<void> {
        await firstValueFrom(this.apollo.mutate({
            mutation: gql`
              mutation UpdateWorkspaceMember($workspaceId: ID!, $userId: ID!, $role: WorkspaceRole!) {
                updateWorkspaceMember(workspaceId: $workspaceId, userId: $userId, role: $role) { id }
              }
            `,
            variables: { workspaceId, userId, role },
        }));
    }

    async removeMember(workspaceId: string, userId: string): Promise<void> {
        await firstValueFrom(this.apollo.mutate({
            mutation: gql`
              mutation RemoveWorkspaceMember($workspaceId: ID!, $userId: ID!) {
                removeWorkspaceMember(workspaceId: $workspaceId, userId: $userId)
              }
            `,
            variables: { workspaceId, userId },
        }));
    }

    async setAdmin(userId: string, isAdmin: boolean): Promise<void> {
        await firstValueFrom(this.apollo.mutate({
            mutation: gql`
              mutation SetUserAdmin($userId: ID!, $isAdmin: Boolean!) {
                setUserAdmin(userId: $userId, isAdmin: $isAdmin) { id role }
              }
            `,
            variables: { userId, isAdmin },
        }));
    }

    /** The server text of a GraphQL error, for a toast. */
    static errorMessage(error: any, fallback: string): string {
        return error?.graphQLErrors?.[0]?.message || error?.error?.message || error?.message || fallback;
    }
}
