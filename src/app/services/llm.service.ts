import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';
import { LLMProvider } from '../models/llm-provider.model';
import { environment as env } from '../../environments/environment.development';

export interface LLMCredentials {
  id: number;
  provider: LLMProvider;
  name?: string;
  apiKey: string;
  baseUrl?: string;
  modelName?: string;
  temperature?: number;
  created_at?: string;
  updated_at?: string;
}

export interface GenerateRequest {
  prompt: string;
  provider: LLMProvider;
  credentialId?: number;
}

export interface GenerateResponse {
  result: string;
}

@Injectable({
  providedIn: 'root'
})
export class LLMService {
  private apiUrl = `${(env as any).api_url}/llm`;
  constructor(private http: HttpClient) { }

  async updateCredential(id: number, data: Partial<LLMCredentials>): Promise<void> {
    await firstValueFrom(
      this.http.post<{ success: boolean }>(`${this.apiUrl}/update/${id}`, data)
    );
  }

  async registerCredentials(credentials: LLMCredentials): Promise<void> {
    await firstValueFrom(
      this.http.post<{ success: boolean }>(`${this.apiUrl}/register`, credentials)
    );
  }

  async deleteCredential(id: number): Promise<void> {
    await firstValueFrom(
      this.http.delete<{ success: boolean }>(`${this.apiUrl}/${id}`)
    );
  }

  generateCompletion(request: GenerateRequest): Observable<GenerateResponse> {
    return this.http.post<GenerateResponse>(`${this.apiUrl}/generate`, request);
  }

  async getCredentials(): Promise<LLMCredentials[]> {
    const res = await firstValueFrom(this.http.get<{ result: LLMCredentials[] }>(`${this.apiUrl}/`));
    return res.result;
  }
}