import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { Apollo, gql } from 'apollo-angular';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { isPlatformBrowser } from '@angular/common';

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
        tenant {
          subdomain
          subscription {
            status
            isGrandfathered
          }
        }
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
    $organizationName: String!
  ) {
    register(
      email: $email
      password: $password
      firstName: $firstName
      lastName: $lastName
      organizationName: $organizationName
    ) {
      message
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

const ACCEPT_INVITATION_MUTATION = gql`
  mutation AcceptInvitation(
    $token: String!
    $email: String!
    $firstName: String!
    $lastName: String!
    $password: String!
  ) {
    acceptInvitation(
      token: $token
      email: $email
      firstName: $firstName
      lastName: $lastName
      password: $password
    ) {
      user {
        id
        email
        tenant {
          subdomain
        }
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
      isVerified
      isActive
      role
      createdAt
      tenant {
        id
        name
        subdomain
      }
    }
  }
`;

// ---------------------------------------------------------

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private tokenKey = environment.auth_token_key;

  constructor(
    private apollo: Apollo,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  // Save token safely
  private saveToken(token: string) {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.tokenKey, token);
      // Set cookie for SSR
      document.cookie = `token=${token}; Path=/; SameSite=Lax; Secure; Max-Age=${60 * 60 * 24 * 7}`; // 7 days
    }
  }

  // ---------------------- LOGIN ----------------------

  async login(email: string, password: string): Promise<any> {
    const result = await firstValueFrom(
      this.apollo.mutate<any>({
        mutation: LOGIN_MUTATION,
        variables: { email, password },
      })
    );

    console.log('Login Mutation Result:', JSON.stringify(result, null, 2));

    const token = result.data?.login?.accessToken;
    const user = result.data?.login?.user;

    if (token) {
      this.saveToken(token);
      return user; // Return user object which includes tenant info
    } else {
      console.warn('Login successful but no token found in response');
    }
  }

  // ---------------------- REGISTER ----------------------

  async register(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    organizationName: string
  ): Promise<any> {
    const result = await firstValueFrom(
      this.apollo.mutate<any>({
        mutation: REGISTER_MUTATION,
        variables: { email, password, firstName, lastName, organizationName },
      })
    );

    const token = result.data?.register?.message;
    return token;
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

  async acceptInvitation(
    token: string,
    email: string,
    firstName: string,
    lastName: string,
    password: string
  ): Promise<any> {
    const result = await firstValueFrom(
      this.apollo.mutate<any>({
        mutation: ACCEPT_INVITATION_MUTATION,
        variables: { token, email, firstName, lastName, password },
      })
    );

    const accessToken = result.data?.acceptInvitation?.accessToken;
    const user = result.data?.acceptInvitation?.user;

    if (accessToken) {
      this.saveToken(accessToken);
      return user;
    }
  }

  // ---------------------- ME QUERY ----------------------

  async getCurrentUser(): Promise<any> {
    try {
      const result = await firstValueFrom(
        this.apollo.query<any>({
          query: ME_QUERY,
          // fetchPolicy: 'network-only', // Removed to allow SSR cache restoration
        })
      );
      return result.data?.me;
    } catch {
      return null;
    }
  }

  // ---------------------- TOKEN ----------------------

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(this.tokenKey);
    }
    return null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.tokenKey);
      // Remove cookie
      document.cookie = `token=; Path=/; Max-Age=0`;
    }

    const currentHost = window.location.hostname;
    const protocol = window.location.protocol;
    const port = window.location.port ? `:${window.location.port}` : '';

    // Determine main domain
    const isLocal = currentHost.includes('localhost');
    const mainDomain = isLocal ? 'localhost' : 'jeufutbol.com.tr';

    // If we are on a subdomain (not main domain and not www), redirect to main domain
    if (currentHost !== mainDomain && currentHost !== `www.${mainDomain}`) {
      window.location.href = `${protocol}//${mainDomain}${port}/auth/login`;
    } else {
      this.router.navigate(['/auth/login']);
    }
  }
}
