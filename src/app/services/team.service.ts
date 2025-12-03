import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { firstValueFrom, map, Observable } from 'rxjs';

export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'ADMIN' | 'MANAGER' | 'USER';
    isVerified: boolean;
    createdAt: string;
}

export interface Invitation {
    id: string;
    email: string;
    role: 'ADMIN' | 'MANAGER' | 'USER';
    status: 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED';
    expiresAt: string;
    createdAt: string;
    token: string;
    invitedBy: {
        firstName: string;
        lastName: string;
        email: string;
    };
}

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

    inviteUser(email: string, role: string): Promise<Invitation> {
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

        return firstValueFrom(
            this.apollo
                .mutate<{ inviteUser: Invitation }>({
                    mutation: INVITE_USER,
                    variables: {
                        input: {
                            email,
                            role,
                        },
                    },
                })
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
}
