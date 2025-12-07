import { Component, signal, effect, OnDestroy, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import gsap from 'gsap';
import { AIInsightsService } from '../../services/ai-insights.service';
import { InsightsService } from '../../services/insights.service';
import { Insight } from '../../models/insight.model';
import { ComponentStateService } from '../../services/component-state.service';
import { LLMService, LLMCredentials } from '../../services/llm.service';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { matAutoAwesomeRound, matAutoFixHighRound, matSyncRound, matEditRound, matUploadFileRound, matHistoryRound } from '@ng-icons/material-icons/round';
@Component({
  selector: 'app-ai-post-generator',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIcon],
  templateUrl: './ai-post-generator.component.html',
  providers: [provideIcons({ matAutoAwesomeRound, matAutoFixHighRound, matSyncRound, matEditRound, matUploadFileRound, matHistoryRound })],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AIPostGeneratorComponent implements OnDestroy, OnInit {
  // --- State signals ---
  topic = signal('');
  llmProvider = signal('openai'); // Keep for legacy/fallback, but mainly use credentialId
  selectedCredentialId = signal<number | null>(null);
  platform = signal('twitter');
  tone = signal('engaging');

  // Mode: 'generate' for AI generation, 'existing' for selecting from saved insights
  insightMode = signal<'generate' | 'existing'>('generate');
  existingInsights = signal<Insight[]>([]);
  loadingExistingInsights = signal(false);
  selectedExistingInsights = signal<boolean[]>([]);

  insights = signal<any[]>([]);
  selectedInsights = signal<boolean[]>([]);
  generatedPost = signal<any | null>(null);
  userCredentials = signal<LLMCredentials[]>([]);

  availableProviders = signal<{ id: string; name: string; credentialId?: number }[]>([]);

  updateAvailableProviders() {
    const creds = this.userCredentials();
    const providers = creds.map(c => ({
      id: c.provider,
      name: c.name ? `${c.name} (${c.provider})` : `${c.provider} (${c.modelName || 'Default'})`,
      credentialId: c.id
    }));
    this.availableProviders.set(providers);
  }

  generatingInsights = signal(false);
  generatingPost = signal(false);

  constructor(
    private aiInsightsService: AIInsightsService,
    private insightsService: InsightsService,
    private router: Router,
    private stateService: ComponentStateService,
    private llmService: LLMService
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
  async ngOnInit() {
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

    await this.loadCredentials();
  }

  async loadCredentials() {
    try {
      const creds = await this.llmService.getCredentials();
      this.userCredentials.set(Array.isArray(creds) ? creds : []);
      this.updateAvailableProviders();

      // Restore selected credential if saved state exists
      const savedState = this.stateService.getAIGeneratorState();
      if (savedState && savedState.credentialId) {
        this.selectedCredentialId.set(savedState.credentialId);
      } else if (this.availableProviders().length > 0) {
        this.selectedCredentialId.set(this.availableProviders()[0].credentialId || null);
      }
    } catch (error) {
      console.error('Error loading credentials:', error);
    }
  }

  isProviderAvailable(providerId: string): boolean {
    if (providerId === 'custom') return true;
    return this.userCredentials().some(c => c.provider === providerId);
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
      generatedPost: this.generatedPost(),
      credentialId: this.selectedCredentialId() || undefined
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
    if (!this.selectedCredentialId()) {
      alert(`Please select an AI model.`);
      return;
    }

    this.generatingInsights.set(true);
    this.insights.set([]);
    this.generatedPost.set(null);

    try {
      const result = await this.aiInsightsService.generateInsights(
        this.topic() || undefined,
        this.availableProviders().find(p => p.credentialId === Number(this.selectedCredentialId()))?.id || 'openai',
        this.selectedCredentialId() ? Number(this.selectedCredentialId()) : undefined
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

    if (!this.selectedCredentialId()) {
      alert(`Please select an AI model.`);
      return;
    }

    this.generatingPost.set(true);
    this.generatedPost.set(null);

    try {
      const post = await this.aiInsightsService.generatePostTemplate(
        selected,
        this.platform(),
        this.tone(),
        this.availableProviders().find(p => p.credentialId === Number(this.selectedCredentialId()))?.id || 'openai',
        this.selectedCredentialId() ? Number(this.selectedCredentialId()) : undefined
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

  toggleExistingInsightSelection(index: number) {
    const current = this.selectedExistingInsights().slice();
    current[index] = !current[index];
    this.selectedExistingInsights.set(current);
  }

  async loadExistingInsights() {
    this.loadingExistingInsights.set(true);
    try {
      const insights = await this.insightsService.getInsights(50);
      this.existingInsights.set(insights);
      this.selectedExistingInsights.set(new Array(insights.length).fill(false));
    } catch (err) {
      console.error('Failed to load existing insights:', err);
    } finally {
      this.loadingExistingInsights.set(false);
    }
  }

  setInsightMode(mode: 'generate' | 'existing') {
    this.insightMode.set(mode);
    if (mode === 'existing' && this.existingInsights().length === 0) {
      this.loadExistingInsights();
    }
  }

  useExistingInsightsForPost() {
    const selected = this.existingInsights()
      .filter((_, i) => this.selectedExistingInsights()[i]);

    // Convert existing insights to the format expected by the insights signal
    this.insights.set(selected);
    this.selectedInsights.set(new Array(selected.length).fill(true));

    // Animate the insights
    setTimeout(() => {
      this.animateInsightsEntry();
    }, 100);
  }

  hasSelectedInsights() {
    return this.selectedInsights().some((v) => v);
  }

  hasSelectedExistingInsights() {
    return this.selectedExistingInsights().some((v) => v);
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
