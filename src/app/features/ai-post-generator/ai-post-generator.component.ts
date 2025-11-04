import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AIInsightsService } from '../../services/ai-insights.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-ai-post-generator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-4xl mx-auto p-6">
      <h2 class="text-3xl font-bold mb-6">🤖 AI Post Generator</h2>

      <!-- Step 1: Get Insights -->
      <div class="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 mb-6">
        <h3 class="text-xl font-semibold mb-4">1. Generate Insights</h3>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">Topic (optional)</label>
            <input
              [value]="topic()"
              (input)="topic.set($any($event.target).value)"
              type="text"
              placeholder="e.g., artificial intelligence, web3"
              class="w-full px-4 py-2 border rounded-lg" />
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">AI Provider</label>
            <select
              [value]="llmProvider()"
              (change)="llmProvider.set($any($event.target).value)"
              class="w-full px-4 py-2 border rounded-lg">
              <option value="openai">OpenAI (GPT-4)</option>
              <option value="gemini">Google Gemini</option>
              <option value="claude">Claude</option>
              <option value="ollama">Ollama (Local)</option>
            </select>
          </div>

          <button
            (click)="generateInsights()"
            [disabled]="generatingInsights()"
            class="btn-primary w-full">
            {{ generatingInsights() ? 'Generating...' : '✨ Generate Insights' }}
          </button>
        </div>

        <div *ngIf="insights().length > 0" class="mt-6 space-y-3">
          <h4 class="font-semibold">Generated Insights:</h4>
          <div
            *ngFor="let insight of insights(); let i = index"
            class="p-4 bg-neutral-50 rounded-lg">
            <div class="flex items-start gap-3">
              <input
                type="checkbox"
                [checked]="selectedInsights()[i]"
                (change)="toggleInsightSelection(i)"
                class="mt-1" />
              <div class="flex-1">
                <h5 class="font-semibold text-sm">{{ insight.title }}</h5>
                <p class="text-sm text-neutral-600 mt-1">{{ insight.description }}</p>
                <span class="text-xs text-neutral-500 mt-2 inline-block">
                  Relevance: {{ (insight.relevanceScore * 100).toFixed(0) }}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 2: Generate Post -->
      <div class="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
        <h3 class="text-xl font-semibold mb-4">2. Generate Post Template</h3>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">Platform</label>
            <select
              [value]="platform()"
              (change)="platform.set($any($event.target).value)"
              class="w-full px-4 py-2 border rounded-lg">
              <option value="twitter">Twitter/X</option>
              <option value="instagram">Instagram</option>
              <option value="facebook">Facebook</option>
              <option value="linkedin">LinkedIn</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">Tone</label>
            <select
              [value]="tone()"
              (change)="tone.set($any($event.target).value)"
              class="w-full px-4 py-2 border rounded-lg">
              <option value="professional">Professional</option>
              <option value="casual">Casual</option>
              <option value="humorous">Humorous</option>
              <option value="informative">Informative</option>
              <option value="engaging">Engaging</option>
            </select>
          </div>

          <button
            (click)="generatePost()"
            [disabled]="!hasSelectedInsights() || generatingPost()"
            class="btn-primary w-full">
            {{ generatingPost() ? 'Generating...' : '🚀 Generate Post' }}
          </button>
        </div>

        <div *ngIf="generatedPost()" class="mt-6 p-4 bg-neutral-50 rounded-lg">
          <div class="flex items-start justify-between mb-4">
            <h4 class="font-semibold">Generated Post:</h4>
            <button
              (click)="copyToClipboard()"
              class="text-sm text-primary-600 hover:text-primary-700">
              📋 Copy
            </button>
          </div>

          <div class="prose max-w-none">
            <p class="whitespace-pre-wrap">{{ generatedPost()?.content }}</p>

            <div *ngIf="generatedPost()?.hashtags?.length > 0" class="mt-4">
              <strong class="text-sm">Suggested Hashtags:</strong>
              <div class="flex flex-wrap gap-2 mt-2">
                <span
                  *ngFor="let tag of generatedPost()?.hashtags"
                  class="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                  #{{ tag }}
                </span>
              </div>
            </div>

            <div class="mt-4 text-sm text-neutral-600">
              <strong>Estimated Reach:</strong> {{ generatedPost()?.estimatedReach }}
            </div>
          </div>

          <button (click)="usePostInComposer()" class="btn-secondary w-full mt-4">
            Use in Post Composer
          </button>
        </div>
      </div>
    </div>
  `,
})
export class AIPostGeneratorComponent {
  // --- State signals ---
  topic = signal('');
  llmProvider = signal('openai');
  platform = signal('twitter');
  tone = signal('engaging');

  insights = signal<any[]>([]);
  selectedInsights = signal<boolean[]>([]);
  generatedPost = signal<any | null>(null);

  generatingInsights = signal(false);
  generatingPost = signal(false);

  constructor(private aiInsightsService: AIInsightsService) {}

  // --- Actions ---
  async generateInsights() {
    this.generatingInsights.set(true);
    try {
      const result = await this.aiInsightsService.generateInsights(
        this.topic() || undefined,
        this.llmProvider(),
      );
      this.insights.set(result);
      this.selectedInsights.set(new Array(result.length).fill(true));
    } catch (err) {
      console.error(err);
      alert('Failed to generate insights.');
    } finally {
      this.generatingInsights.set(false);
    }
  }

  async generatePost() {
    const selected = this.insights()
      .filter((_, i) => this.selectedInsights()[i])
      .map((x) => x.description);

    if (selected.length === 0) {
      alert('Please select at least one insight.');
      return;
    }

    this.generatingPost.set(true);
    try {
      const post = await this.aiInsightsService.generatePostTemplate(
        selected,
        this.platform(),
        this.tone(),
      );
      this.generatedPost.set(post);
    } catch (err) {
      console.error(err);
      alert('Failed to generate post.');
    } finally {
      this.generatingPost.set(false);
    }
  }

  toggleInsightSelection(index: number) {
    const current = this.selectedInsights().slice();
    current[index] = !current[index];
    this.selectedInsights.set(current);
  }

  hasSelectedInsights() {
    return this.selectedInsights().some((v) => v);
  }

  copyToClipboard() {
    const text = this.generatedPost()?.content ?? '';
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  }

  usePostInComposer() {
    // Navigate to composer with pre-filled content
  }
}
