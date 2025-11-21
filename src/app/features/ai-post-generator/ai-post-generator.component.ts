import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AIInsightsService } from '../../services/ai-insights.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-ai-post-generator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-post-generator.component.html',
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

  constructor(private aiInsightsService: AIInsightsService) { }

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
