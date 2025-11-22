import { Component, computed, signal, effect, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AIInsightsService } from '../../services/ai-insights.service';
import { FormsModule } from '@angular/forms';
import gsap from 'gsap';

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

  constructor(private aiInsightsService: AIInsightsService) {
    // Effect to animate insights when they are populated
    effect(() => {
      const items = this.insights();
      if (items.length > 0) {
        // Small delay to allow DOM to update
        setTimeout(() => {
          this.animateInsightsEntry();
        }, 100);
      }
    });
  }

  animateInsightsEntry() {
    gsap.from('.insight-card', {
      y: 20,
      opacity: 0,
      duration: 0.5,
      stagger: 0.1,
      ease: 'power2.out',
      clearProps: 'all'
    });
  }

  // --- Actions ---
  async generateInsights() {
    this.generatingInsights.set(true);
    this.insights.set([]); // Clear previous insights to trigger animation again later
    this.generatedPost.set(null); // Clear previous post

    try {
      const result = await this.aiInsightsService.generateInsights(
        this.topic() || undefined,
        this.llmProvider(),
      );
      this.insights.set(result);
      // Select all by default
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
    this.generatedPost.set(null);

    try {
      const post = await this.aiInsightsService.generatePostTemplate(
        selected,
        this.platform(),
        this.tone(),
        this.llmProvider(),
      );
      this.generatedPost.set(post);

      // Animate the post appearing
      setTimeout(() => {
        gsap.from('.generated-post-card', {
          y: 20,
          opacity: 0,
          duration: 0.6,
          ease: 'back.out(1.7)'
        });
      }, 50);

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
    console.log('Navigate to composer with:', this.generatedPost());
    alert('This would navigate to the composer with the generated content.');
  }
}
