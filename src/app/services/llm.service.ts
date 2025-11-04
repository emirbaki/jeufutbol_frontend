import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';
import { LLMProvider } from '../models/llm-provider.model';
import { environment as env } from '../../environments/environment';

export interface LLMCredentials {
  provider: LLMProvider;
  apiKey: string;
  baseUrl?: string;
  modelName?: string;
  temperature?: number;
}

export interface GenerateRequest {
  prompt: string;
  provider: LLMProvider;
}

export interface GenerateResponse {
  result: string;
}

@Injectable({
  providedIn: 'root'
})
export class LLMService {
  private apiUrl = `${(env as any).api_url}/llm`;
  constructor(private http: HttpClient) {}

  async registerCredentials(credentials: LLMCredentials): Promise<void> {
    await firstValueFrom(

    this.http.post<{ success: boolean }>(`${this.apiUrl}/register`, credentials)
    
    );
  }

  generateCompletion(request: GenerateRequest): Observable<GenerateResponse> {
    return this.http.post<GenerateResponse>(`${this.apiUrl}/generate`, request);
  }
}