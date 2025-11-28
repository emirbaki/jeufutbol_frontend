import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { firstValueFrom } from 'rxjs';

const GET_CONNECTED_ACCOUNTS = gql`
  query GetConnectedAccounts {
    getConnectedAccounts {
      id
      platform
      accountId
      accountName
      accountImage
      isActive
      createdAt
    }
  }
`;

const DISCONNECT_ACCOUNT = gql`
  mutation DisconnectAccount($accountId: String!) {
    deleteCredential(credentialId: $accountId)
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
        // fetchPolicy: 'network-only' // Removed for SSR
      })
    );
    return result.data.getConnectedAccounts.map(account => ({
      ...account,
      platformUserId: account.accountId,
      platformUsername: account.accountName,
      profileImageUrl: account.accountImage
    }));
  }

  async disconnectAccount(accountId: string): Promise<boolean> {
    const result = await firstValueFrom(
      this.apollo.mutate<{ deleteCredential: boolean }>({
        mutation: DISCONNECT_ACCOUNT,
        variables: { accountId }
      })
    );
    return result.data?.deleteCredential || false;
  }
}