import { Component, signal, effect, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import gsap from 'gsap';
import { AIInsightsService } from '../../services/ai-insights.service';
import { ComponentStateService } from '../../services/component-state.service';

@Component({
  selector: 'app-ai-post-generator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-post-generator.component.html',
})
export class AIPostGeneratorComponent implements OnDestroy, OnInit {
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

  constructor(
    private aiInsightsService: AIInsightsService,
    private router: Router,
    private stateService: ComponentStateService
  ) {


    // Effect to animate insights when they are populated
    effect(() => {
      const items = this.insights();
      if (items.length > 0) {
        setTimeout(() => {
          this.animateInsightsEntry();
        }, 100);
      }
    });
  }
  ngOnInit(): void {
    // Restore state if available
    const savedState = this.stateService.getAIGeneratorState();
    if (savedState) {
      this.topic.set(savedState.topic);
      this.llmProvider.set(savedState.llmProvider);
      this.platform.set(savedState.platform);
      this.tone.set(savedState.tone);
      this.insights.set(savedState.insights);
      this.selectedInsights.set(savedState.selectedInsights);
      this.generatedPost.set(savedState.generatedPost);
    }
  }

  ngOnDestroy() {
    // Save state before component is destroyed
    this.stateService.saveAIGeneratorState({
      topic: this.topic(),
      llmProvider: this.llmProvider(),
      platform: this.platform(),
      tone: this.tone(),
      insights: this.insights(),
      selectedInsights: this.selectedInsights(),
      generatedPost: this.generatedPost()
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

  async generateInsights() {
    this.generatingInsights.set(true);
    this.insights.set([]);
    this.generatedPost.set(null);

    try {
      const result = await this.aiInsightsService.generateInsights(
        this.topic() || undefined,
        this.llmProvider()
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
    this.generatedPost.set(null);

    try {
      const post = await this.aiInsightsService.generatePostTemplate(
        selected,
        this.platform(),
        this.tone(),
        this.llmProvider()
      );
      this.generatedPost.set(post);

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
    const post = this.generatedPost();
    if (!post) return;

    this.router.navigate(['/composer'], {
      queryParams: {
        content: post.content,
        platform: this.platform()
      }
    });
  }
}
