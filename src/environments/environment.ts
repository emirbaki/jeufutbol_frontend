export interface Environment {
  production: boolean;
  environment: 'development' | 'production' | string;
  api_url: string;
  port?: number;
}

export const environment : Environment = {
    environment: 'development',
    production: false,
    api_url: 'https://jeufutbol.com.tr/api',
    port: 4200,
};