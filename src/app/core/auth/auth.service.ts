import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Apollo, gql } from 'apollo-angular';
import { firstValueFrom } from 'rxjs';

const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      user {
        id
        email
        firstName
        lastName
      }
      accessToken
    }
  }
`;

const REGISTER_MUTATION = gql`
  mutation Register($email: String!, $password: String!, $firstName: String!, $lastName: String!) {
    register(email: $email, password: $password, firstName: $firstName, lastName: $lastName) {
      user {
        id
        email
        firstName
        lastName
      }
      accessToken
    }
  }
`;

const ME_QUERY = gql`
  query Me {
    me {
      id
      email
      firstName
      lastName
      isActive
      createdAt
    }
  }
`;

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private tokenKey = 'cokgizli_bir_anahtar';

  constructor(
    private apollo: Apollo,
    private router: Router
  ) { }

  async login(email: string, password: string): Promise<void> {
    interface LoginMutationResult {
      login: {
        accessToken: string;
        user: {
          id: string;
          email: string;
          firstName: string;
          lastName: string;
        };
      };
    }

    const result = await firstValueFrom(
      this.apollo.mutate<LoginMutationResult>({
        mutation: LOGIN_MUTATION,
        variables: { email, password }
      })
    );

    const token = result.data?.login?.accessToken;
    if (token && typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(this.tokenKey, token);
    }
  }

  async register(email: string, password: string, firstName: string, lastName: string): Promise<void> {
    interface RegisterMutationResult {
      register: {
        accessToken: string;
        user: {
          id: string;
          email: string;
          firstName: string;
          lastName: string;
        };
      };
    }

    const result = await firstValueFrom(
      this.apollo.mutate<RegisterMutationResult>({
        mutation: REGISTER_MUTATION,
        variables: { email, password, firstName, lastName }
      })
    );

    const token = result.data?.register?.accessToken;
    if (token && typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(this.tokenKey, token);
    }
  }

  async getCurrentUser(): Promise<any> {
    interface MeQueryResult {
      me: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        isActive: boolean;
        createdAt: string;
      };
    }

    try {
      const result = await firstValueFrom(
        this.apollo.query<MeQueryResult>({
          query: ME_QUERY,
          fetchPolicy: 'network-only'
        })
      );
      // console.log('ME_QUERY result:', result.data.me);
      return result.data?.me;
    } catch (error) {
      return null;
    }
  }

  getToken(): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(this.tokenKey);
    }
    return null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(this.tokenKey);
    }
    this.apollo.client.clearStore();
    this.router.navigate(['/auth/login']);
  }
}