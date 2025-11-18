import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

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
      message
    }
  }
`;

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
      createdAt
    }
  }
`;

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private apollo: Apollo) {}

  register(
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ): Observable<{ message: string }> {
    return this.apollo
      .mutate({
        mutation: REGISTER_MUTATION,
        variables: { email, password, firstName, lastName },
      })
      .pipe(map((result: any) => result.data.register));
  }

  login(email: string, password: string): Observable<any> {
    return this.apollo
      .mutate({
        mutation: LOGIN_MUTATION,
        variables: { email, password },
      })
      .pipe(
        map((result: any) => {
          const { user, accessToken } = result.data.login;
          // Store token in localStorage
          localStorage.setItem('accessToken', accessToken);
          return { user, accessToken };
        })
      );
  }

  verifyEmail(token: string): Observable<{ message: string }> {
    return this.apollo
      .query({
        query: VERIFY_EMAIL_QUERY,
        variables: { token },
      })
      .pipe(map((result: any) => result.data.verifyEmail));
  }

  requestPasswordReset(email: string): Observable<{ message: string }> {
    return this.apollo
      .mutate({
        mutation: REQUEST_PASSWORD_RESET_MUTATION,
        variables: { email },
      })
      .pipe(map((result: any) => result.data.requestPasswordReset));
  }

  resetPassword(token: string, newPassword: string): Observable<{ message: string }> {
    return this.apollo
      .mutate({
        mutation: RESET_PASSWORD_MUTATION,
        variables: { token, newPassword },
      })
      .pipe(map((result: any) => result.data.resetPassword));
  }

  resendVerificationEmail(): Observable<{ message: string }> {
    return this.apollo
      .mutate({
        mutation: RESEND_VERIFICATION_MUTATION,
      })
      .pipe(map((result: any) => result.data.resendVerificationEmail));
  }

  getCurrentUser(): Observable<any> {
    return this.apollo
      .query({
        query: ME_QUERY,
      })
      .pipe(map((result: any) => result.data.me));
  }

  logout(): void {
    localStorage.removeItem('accessToken');
    this.apollo.client.clearStore();
  }

  getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}