import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { firstValueFrom } from 'rxjs';

const GET_CONNECTED_ACCOUNTS = gql`
  query GetConnectedAccounts {
    getCredentials {
      id
      platform
      platformUserId
      platformUsername
      profileImageUrl
      isActive
      createdAt
    }
  }
`;

const DISCONNECT_ACCOUNT = gql`
  mutation DisconnectAccount($accountId: String!) {
    disconnectAccount(accountId: $accountId)
  }
`;

@Injectable({
  providedIn: 'root'
})
export class SocialAccountsService {
  constructor(private apollo: Apollo) { }

  async getConnectedAccounts(): Promise<any[]> {
    const result = await firstValueFrom(
      this.apollo.query<{ getConnectedAccounts: any[] }>({
        query: GET_CONNECTED_ACCOUNTS,
        fetchPolicy: 'network-only'
      })
    );
    return result.data.getConnectedAccounts;
  }

  async disconnectAccount(accountId: string): Promise<boolean> {
    const result = await firstValueFrom(
      this.apollo.mutate<{ disconnectAccount: boolean }>({
        mutation: DISCONNECT_ACCOUNT,
        variables: { accountId }
      })
    );
    return result.data?.disconnectAccount || false;
  }
}