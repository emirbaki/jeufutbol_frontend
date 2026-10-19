import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { firstValueFrom, map, Observable } from 'rxjs';

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  isActive: boolean;
  lastUsedAt?: string;
  expiresAt?: string;
  createdAt: string;
  apiKey?: string; // Only present on creation
  /** The branches the key can reach. Empty means all branches. */
  workspaceIds?: string[];
  defaultWorkspaceId?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class ApiKeyService {
  constructor(private apollo: Apollo) { }

  listApiKeys(): Observable<ApiKey[]> {
    const LIST_KEYS = gql`
      query ListApiKeys {
        listApiKeys {
          id
          name
          keyPrefix
          scopes
          isActive
          lastUsedAt
          expiresAt
          createdAt
          workspaceIds
          defaultWorkspaceId
        }
      }
    `;

    return this.apollo
      .query<{ listApiKeys: ApiKey[] }>({
        query: LIST_KEYS,
        fetchPolicy: 'network-only',
      })
      .pipe(map((result) => result.data.listApiKeys));
  }

  createApiKey(
    name: string,
    scopes: string[],
    expiresAt?: string,
    workspaceIds?: string[],
    defaultWorkspaceId?: string,
  ): Promise<ApiKey> {
    const input: any = { name, scopes };
    if (expiresAt) {
      input.expiresAt = expiresAt;
    }
    if (workspaceIds?.length) {
      input.workspaceIds = workspaceIds;
    }
    if (defaultWorkspaceId) {
      input.defaultWorkspaceId = defaultWorkspaceId;
    }

    const CREATE_KEY = gql`
      mutation CreateApiKey($input: CreateApiKeyInput!) {
        createApiKey(input: $input) {
          id
          name
          apiKey
          keyPrefix
          scopes
          expiresAt
        }
      }
    `;

    return firstValueFrom(
      this.apollo
        .mutate<{ createApiKey: ApiKey }>({
          mutation: CREATE_KEY,
          variables: {
            input,
          },
        })
        .pipe(map((result) => result.data!.createApiKey))
    );
  }

  revokeApiKey(apiKeyId: string): Promise<boolean> {
    const REVOKE_KEY = gql`
      mutation RevokeApiKey($apiKeyId: ID!) {
        revokeApiKey(apiKeyId: $apiKeyId)
      }
    `;

    return firstValueFrom(
      this.apollo
        .mutate<{ revokeApiKey: boolean }>({
          mutation: REVOKE_KEY,
          variables: {
            apiKeyId,
          },
        })
        .pipe(map((result) => result.data!.revokeApiKey))
    );
  }

  updateApiKeyScopes(apiKeyId: string, scopes: string[]): Promise<ApiKey> {
    const UPDATE_SCOPES = gql`
      mutation UpdateApiKeyScopes($apiKeyId: ID!, $scopes: [String!]!) {
        updateApiKeyScopes(apiKeyId: $apiKeyId, scopes: $scopes) {
          id
          name
          scopes
        }
      }
    `;

    return firstValueFrom(
      this.apollo
        .mutate<{ updateApiKeyScopes: ApiKey }>({
          mutation: UPDATE_SCOPES,
          variables: {
            apiKeyId,
            scopes,
          },
        })
        .pipe(map((result) => result.data!.updateApiKeyScopes))
    );
  }

  /** An empty list lets the key reach all branches. */
  updateWorkspaces(apiKeyId: string, workspaceIds: string[], defaultWorkspaceId?: string | null): Promise<ApiKey> {
    const UPDATE_WORKSPACES = gql`
      mutation UpdateApiKeyWorkspaces($apiKeyId: ID!, $workspaceIds: [ID!]!, $defaultWorkspaceId: ID) {
        updateApiKeyWorkspaces(apiKeyId: $apiKeyId, workspaceIds: $workspaceIds, defaultWorkspaceId: $defaultWorkspaceId) {
          id
          workspaceIds
          defaultWorkspaceId
        }
      }
    `;

    return firstValueFrom(
      this.apollo
        .mutate<{ updateApiKeyWorkspaces: ApiKey }>({
          mutation: UPDATE_WORKSPACES,
          variables: { apiKeyId, workspaceIds, defaultWorkspaceId: defaultWorkspaceId ?? null },
        })
        .pipe(map((result) => result.data!.updateApiKeyWorkspaces))
    );
  }

  getTenantCredentials() {
    return this.apollo.watchQuery<any>({
      query: gql`
        query GetTenantCredentials {
          currentTenant {
            clientId
          }
        }
      `,
      fetchPolicy: 'network-only',
    }).valueChanges.pipe(
      map(result => result.data.currentTenant)
    );
  }

  regenerateClientSecret() {
    return this.apollo.mutate<any>({
      mutation: gql`
        mutation RegenerateClientSecret {
          regenerateClientSecret
        }
      `
    }).pipe(
      map(result => ({ clientSecret: result.data.regenerateClientSecret }))
    );
  }
}
