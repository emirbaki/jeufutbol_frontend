import { Injectable, inject } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { firstValueFrom } from 'rxjs';
import { Workspace } from '../models/workspace.model';

const WORKSPACES = gql`
  query Workspaces {
    workspaces { id name slug isDefault }
  }
`;

const CREATE_WORKSPACE = gql`
  mutation CreateWorkspace($input: CreateWorkspaceInput!) {
    createWorkspace(input: $input) { id name slug isDefault }
  }
`;

const UPDATE_WORKSPACE = gql`
  mutation UpdateWorkspace($id: ID!, $input: UpdateWorkspaceInput!) {
    updateWorkspace(id: $id, input: $input) { id name slug isDefault }
  }
`;

const DELETE_WORKSPACE = gql`
  mutation DeleteWorkspace($id: ID!) {
    deleteWorkspace(id: $id)
  }
`;

const MOVE_CREDENTIAL = gql`
  mutation MoveCredential($credentialId: ID!, $workspaceId: ID!) {
    moveCredentialToWorkspace(credentialId: $credentialId, workspaceId: $workspaceId) { id workspaceId }
  }
`;

@Injectable({
  providedIn: 'root',
})
export class WorkspaceService {
  private apollo = inject(Apollo);

  async list(): Promise<Workspace[]> {
    const result = await firstValueFrom(
      this.apollo.query<{ workspaces: Workspace[] }>({ query: WORKSPACES, fetchPolicy: 'network-only' }),
    );
    return result.data?.workspaces ?? [];
  }

  async create(name: string, slug?: string): Promise<Workspace> {
    const input = slug ? { name, slug } : { name };
    const result = await firstValueFrom(
      this.apollo.mutate<{ createWorkspace: Workspace }>({ mutation: CREATE_WORKSPACE, variables: { input } }),
    );
    return result.data!.createWorkspace;
  }

  async update(id: string, input: { name?: string; slug?: string }): Promise<Workspace> {
    const result = await firstValueFrom(
      this.apollo.mutate<{ updateWorkspace: Workspace }>({ mutation: UPDATE_WORKSPACE, variables: { id, input } }),
    );
    return result.data!.updateWorkspace;
  }

  async remove(id: string): Promise<boolean> {
    const result = await firstValueFrom(
      this.apollo.mutate<{ deleteWorkspace: boolean }>({ mutation: DELETE_WORKSPACE, variables: { id } }),
    );
    return !!result.data?.deleteWorkspace;
  }

  async moveCredential(credentialId: string, workspaceId: string): Promise<void> {
    await firstValueFrom(
      this.apollo.mutate({ mutation: MOVE_CREDENTIAL, variables: { credentialId, workspaceId } }),
    );
  }

  /** The message of a GraphQL or network error, for a toast. */
  static errorMessage(error: any, fallback: string): string {
    return error?.graphQLErrors?.[0]?.message || error?.message || fallback;
  }
}
