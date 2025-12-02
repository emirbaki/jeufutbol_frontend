export interface Environment {
  production: boolean;
  environment: 'development' | 'production' | string;
  api_url: string;
  auth_token_key: string;
  port?: number;
}