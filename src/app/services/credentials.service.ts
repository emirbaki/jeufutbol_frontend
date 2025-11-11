import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment as env } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CredentialsService {
  
  // private apiUrl = 'https://localhost:3000/credentials';
  private apiUrl = (env as any).api_url + '/credentials';

  constructor(private http: HttpClient) {}

  async getCredentials(): Promise<any[]> {
    return firstValueFrom(
      this.http.get<any[]>(this.apiUrl)
    );
  }

  async connectPlatform(platform: string, credentialName: string): Promise<void> {
    // Get OAuth URL
    const { authUrl } = await firstValueFrom(
      this.http.post<{ authUrl: string; state: string }>(
        `${this.apiUrl}/oauth/authorize-url`,
        { platform, credentialName }
      )
    );

    window.location.href = authUrl;
    // // Open OAuth window
    // const width = 600;
    // const height = 700;
    // const left = window.screen.width / 2 - width / 2;
    // const top = window.screen.height / 2 - height / 2;
    
    // window.open(
    //   authUrl,
    //   'OAuth Authorization',
    //   `width=${width},height=${height},left=${left},top=${top}`
    // );
  }

  async testCredential(credentialId: string): Promise<boolean> {
    const result = await firstValueFrom(
      this.http.post<{ valid: boolean }>(
        `${this.apiUrl}/${credentialId}/test`,
        {}
      )
    );
    return result.valid;
  }

  async deleteCredential(credentialId: string): Promise<void> {
    await firstValueFrom(
      this.http.delete(`${this.apiUrl}/${credentialId}`)
    );
  }

  async refreshCredential(credentialId: string): Promise<void> {
    await firstValueFrom(
      this.http.post(`${this.apiUrl}/${credentialId}/refresh`, {})
    );
  }
}