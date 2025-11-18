import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Apollo, gql } from 'apollo-angular';
import { firstValueFrom } from 'rxjs';

// ----------------------
// GRAPHQL DOCUMENTS
// ----------------------

const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      user {
        id
        email
        firstName
        lastName
        isVerified
      }
      accessToken
    }
  }
`;

const REGISTER_MUTATION = gql`
  mutation Register(
    $email: String!
    $password: String!
    $firstName: String!
    $lastName: String!
  ) {
    register(
      email: $email
      password: $password
      firstName: $firstName
      lastName: $lastName
    ) {
      user {
        id
        email
        firstName
        lastName
        isVerified
      }
      accessToken
    }
  }
`;

const VERIFY_EMAIL_QUERY = gql`
  query VerifyEmail($token: String!) {
    verifyEmail(token: $token) {
      message
    }
  }
`;

const REQUEST_PASSWORD_RESET_MUTATION = gql`
  mutation RequestPasswordReset($email: String!) {
    requestPasswordReset(email: $email) {
      message
    }
  }
`;

const RESET_PASSWORD_MUTATION = gql`
  mutation ResetPassword($token: String!, $newPassword: String!) {
    resetPassword(token: $token, newPassword: $newPassword) {
      message
    }
  }
`;

const RESEND_VERIFICATION_MUTATION = gql`
  mutation ResendVerificationEmail {
    resendVerificationEmail {
      message
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
      isVerified
      isActive
      createdAt
    }
  }
`;

// ---------------------------------------------------------

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private tokenKey = 'cokgizli_bir_anahtar';

  constructor(private apollo: Apollo, private router: Router) {}

  // Save token safely
  private saveToken(token: string) {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(this.tokenKey, token);
    }
  }

  // ---------------------- LOGIN ----------------------

  async login(email: string, password: string): Promise<void> {
    const result = await firstValueFrom(
      this.apollo.mutate<any>({
        mutation: LOGIN_MUTATION,
        variables: { email, password },
      })
    );

    const token = result.data?.login?.accessToken;
    if (token) this.saveToken(token);
  }

  // ---------------------- REGISTER ----------------------

  async register(
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ): Promise<void> {
    const result = await firstValueFrom(
      this.apollo.mutate<any>({
        mutation: REGISTER_MUTATION,
        variables: { email, password, firstName, lastName },
      })
    );

    const token = result.data?.register?.accessToken;
    if (token) this.saveToken(token);
  }

  // ---------------------- VERIFY EMAIL ----------------------

  async verifyEmail(token: string): Promise<string> {
    const result = await firstValueFrom(
      this.apollo.query<any>({
        query: VERIFY_EMAIL_QUERY,
        variables: { token },
        fetchPolicy: 'network-only',
      })
    );

    return result.data?.verifyEmail?.message;
  }

  // ---------------------- PASSWORD RESET ----------------------

  async requestPasswordReset(email: string): Promise<string> {
    const result = await firstValueFrom(
      this.apollo.mutate<any>({
        mutation: REQUEST_PASSWORD_RESET_MUTATION,
        variables: { email },
      })
    );

    return result.data?.requestPasswordReset?.message;
  }

  async resetPassword(token: string, newPassword: string): Promise<string> {
    const result = await firstValueFrom(
      this.apollo.mutate<any>({
        mutation: RESET_PASSWORD_MUTATION,
        variables: { token, newPassword },
      })
    );

    return result.data?.resetPassword?.message;
  }

  async resendVerificationEmail(): Promise<string> {
    const result = await firstValueFrom(
      this.apollo.mutate<any>({
        mutation: RESEND_VERIFICATION_MUTATION,
      })
    );

    return result.data?.resendVerificationEmail?.message;
  }

  // ---------------------- ME QUERY ----------------------

  async getCurrentUser(): Promise<any> {
    try {
      const result = await firstValueFrom(
        this.apollo.query({
          query: ME_QUERY,
          fetchPolicy: 'network-only',
        })
      );
      return result.data?.me;
    } catch {
      return null;
    }
  }

  // ---------------------- TOKEN ----------------------

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
