import { Injectable, inject } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { HttpClient } from '@angular/common/http';
import { environment as env } from '../../environments/environment.development';
import { firstValueFrom } from 'rxjs';
import { Workspace } from '../models/workspace.model';

const WORKSPACES = gql`
  query Workspaces {
    workspaces { id name slug isDefault imageUrl }
  }
`;

const CREATE_WORKSPACE = gql`
  mutation CreateWorkspace($input: CreateWorkspaceInput!) {
    createWorkspace(input: $input) { id name slug isDefault imageUrl }
  }
`;

const UPDATE_WORKSPACE = gql`
  mutation UpdateWorkspace($id: ID!, $input: UpdateWorkspaceInput!) {
    updateWorkspace(id: $id, input: $input) { id name slug isDefault imageUrl }
  }
`;

const DELETE_WORKSPACE = gql`
  mutation DeleteWorkspace($id: ID!) {
    deleteWorkspace(id: $id)
  }
`;

const SET_ACTIVE_WORKSPACE = gql`
  mutation SetActiveWorkspace($workspaceId: ID!) {
    setActiveWorkspace(workspaceId: $workspaceId) { id }
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
  private http = inject(HttpClient);
  private apiUrl = (env as any).api_url + '/workspaces';

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

  async uploadImage(id: string, file: File): Promise<Workspace> {
    const body = new FormData();
    body.append('image', file);
    return firstValueFrom(this.http.post<Workspace>(`${this.apiUrl}/${id}/image`, body));
  }

  async removeImage(id: string): Promise<Workspace> {
    return firstValueFrom(this.http.delete<Workspace>(`${this.apiUrl}/${id}/image`));
  }

  /** Saves the workspace that opens for this user after the next login. */
  async setActive(workspaceId: string): Promise<void> {
    await firstValueFrom(this.apollo.mutate({ mutation: SET_ACTIVE_WORKSPACE, variables: { workspaceId } }));
  }

  async moveCredential(credentialId: string, workspaceId: string): Promise<void> {
    await firstValueFrom(
      this.apollo.mutate({ mutation: MOVE_CREDENTIAL, variables: { credentialId, workspaceId } }),
    );
  }

  /** The message of a GraphQL or network error, for a toast. */
  static errorMessage(error: any, fallback: string): string {
    return error?.error?.message || error?.graphQLErrors?.[0]?.message || error?.message || fallback;
  }
}
