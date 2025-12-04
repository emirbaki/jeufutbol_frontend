import { Component, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LLMCredentials, LLMService } from '../../services/llm.service';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { matEdit, matDelete, matSaveAll, matAndroid, matThermostat } from '@ng-icons/material-icons/baseline';
@Component({
  selector: 'app-llm-credentials',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIcon],
  templateUrl: './llm-credentials.component.html',
  providers: [provideIcons({ matEdit, matDelete, matSaveAll, matAndroid, matThermostat })],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LlmCredentialsComponent implements OnInit {
  credentials = signal<LLMCredentials[]>([]);
  loading = signal(false);

  providers = [
    { value: 'openai', label: 'OpenAI' },
    { value: 'anthropic', label: 'Anthropic' },
    { value: 'gemini', label: 'Google Gemini' },
    { value: 'ollama', label: 'Ollama' },
    { value: 'custom', label: 'Custom (OpenAI Compatible)' },
  ];

  newCredential: Partial<LLMCredentials> = {
    provider: 'openai',
    apiKey: '',
    baseUrl: '',
    modelName: '',
    temperature: 0.7
  };

  constructor(private llmService: LLMService) { }

  async ngOnInit() {
    this.loadCredentials();
  }

  async loadCredentials() {
    try {
      const response = await this.llmService.getCredentials();
      const creds = Array.isArray(response) ? response : [];
      this.credentials.set(creds);
    } catch (error) {
      console.error('Error loading LLM credentials:', error);
    }
  }

  editingCredentialId = signal<number | null>(null);

  async saveCredential() {
    if (!this.newCredential.provider || !this.newCredential.apiKey) {
      alert('Provider and API Key are required.');
      return;
    }

    this.loading.set(true);
    try {
      const payload: any = {
        ...this.newCredential,
        temperature: Number(this.newCredential.temperature),
      };

      if (this.editingCredentialId()) {
        await this.llmService.updateCredential(this.editingCredentialId()!, payload);
        alert('Credential updated successfully!');
      } else {
        await this.llmService.registerCredentials(payload);
        alert('Credential saved successfully!');
      }

      this.resetForm();
      this.loadCredentials();
    } catch (error) {
      console.error('Error saving credential:', error);
      alert('Failed to save credential.');
    } finally {
      this.loading.set(false);
    }
  }

  editCredential(cred: LLMCredentials) {
    this.editingCredentialId.set(cred.id);
    this.newCredential = {
      ...cred,
      apiKey: '', // Don't show the encrypted key, user must enter new one if they want to change it
    };
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit() {
    this.resetForm();
  }

  private resetForm() {
    this.editingCredentialId.set(null);
    this.newCredential = {
      provider: 'openai',
      apiKey: '',
      baseUrl: '',
      modelName: '',
      temperature: 0.7,
      name: ''
    };
  }

  async deleteCredential(id: number) {
    if (!confirm('Are you sure you want to delete this credential?')) return;

    try {
      await this.llmService.deleteCredential(id);
      await this.loadCredentials();
      alert('Credential deleted successfully!');
    } catch (error) {
      console.error('Error deleting credential:', error);
      alert('Failed to delete credential.');
    }
  }
}
