import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LLMCredentials, LLMService } from '../../services/llm.service';
import { LLMProvider } from '../../models/llm-provider.model';

@Component({
  selector: 'app-llm-credentials',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './llm-credentials.component.html',
})
export class LlmCredentialsComponent implements OnInit {
  providers: LLMProvider[] = ['openai', 'anthropic', 'ollama', 'custom'];
  selectedProvider = signal<LLMProvider>('openai');
  apiKey = signal('');
  baseUrl = signal('');
  modelName = signal('');
  temperature = signal<number | null>(null);
  isSaving = signal(false);
  message = signal('');
  credentials = signal<LLMCredentials[]>([]);

  constructor(private llmService: LLMService) {}

  async ngOnInit() {
    const response = await this.llmService.getCredentials();
    console.log(response);
    const creds = Array.isArray(response) ? response : [];
    this.credentials.set(creds);
  }

  deleteCredential(_t49: LLMCredentials) {
    throw new Error('Method not implemented.'); 
  }
  async saveCredentials() {
    this.isSaving.set(true);
    this.message.set('');

    const body = {
      id: this.credentials()![-1].id + 1,
      provider: this.selectedProvider(),
      apiKey: this.apiKey(),
      baseUrl: this.baseUrl() || undefined,
      modelName: this.modelName() || undefined,
      temperature: this.temperature() ?? undefined,
      created_at: Date(),
      updated_at: Date(),
    };

    try {
      await this.llmService.registerCredentials(body);
      this.message.set('✅ Credentials saved successfully!');
    } catch (err: any) {
      console.error(err);
      this.message.set('❌ Failed to save credentials.');
    } finally {
      this.isSaving.set(false);
    }
  }
}
