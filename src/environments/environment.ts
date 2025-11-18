export interface Environment {
  production: boolean;
  environment: 'development' | 'production' | string;
  api_url: string;
  port?: number;
}