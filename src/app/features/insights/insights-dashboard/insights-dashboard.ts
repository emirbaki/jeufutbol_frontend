import { Component, effect, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InsightsService } from '../../../services/insights.service';
import { Insight, InsightType } from '../../../models/insight.model';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-insights-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './insights-dashboard.html',
})
export class InsightsDashboardComponent implements OnInit {
  // --- Signals ---
  insights = signal<Insight[]>([]);
  loading = signal(false);
  generatingInsights = signal(false);
  selectedType = signal<InsightType | 'all'>('all');
  insightTypes = Object.values(InsightType);

  // --- Derived Computed Signal ---
  filteredInsights = computed(() => {
    const selected = this.selectedType();
    if (selected === 'all') return this.insights();
    return this.insights().filter(i => i.type === selected);
  });

  constructor(private insightsService: InsightsService) {
    // load on init using effect()
    // effect(() => {
    //   this.loadInsights();
    // });
  }
  ngOnInit(): void {
    this.loadInsights()
  }

  async loadInsights(): Promise<void> {
    if (this.loading()) return;
    this.loading.set(true);
    try {
      const data = await firstValueFrom(this.insightsService.watchInsights());
      this.insights.set(data);
    } catch (error) {
      console.error('Error loading insights:', error);
    } finally {
      this.loading.set(false);
    }
  }

  async generateNewInsights(): Promise<void> {
    this.generatingInsights.set(true);
    try {
      const newInsights = await this.insightsService.generateInsights();
      this.insights.update(prev => [...newInsights, ...prev]);
    } catch (error) {
      console.error('Error generating insights:', error);
    } finally {
      this.generatingInsights.set(false);
    }
  }

  async markAsRead(insight: Insight): Promise<void> {
    try {
      await this.insightsService.markAsRead(insight.id);
      this.insights.update(list =>
        list.map(i => (i.id === insight.id ? { ...i, isRead: true } : i)),
      );
    } catch (error) {
      console.error('Error marking insight as read:', error);
    }
  }

  getInsightIcon(type: InsightType): string {
    const icons = {
      [InsightType.TRENDING_TOPIC]: '🔥',
      [InsightType.CONTENT_SUGGESTION]: '💡',
      [InsightType.ENGAGEMENT_PATTERN]: '📊',
      [InsightType.OPTIMAL_POSTING_TIME]: '⏰',
      [InsightType.AUDIENCE_INTEREST]: '👥',
    };
    return icons[type] || '📌';
  }

  getInsightColor(type: InsightType): string {
    const colors = {
      [InsightType.TRENDING_TOPIC]: 'bg-red-100 text-red-800',
      [InsightType.CONTENT_SUGGESTION]: 'bg-yellow-100 text-yellow-800',
      [InsightType.ENGAGEMENT_PATTERN]: 'bg-blue-100 text-blue-800',
      [InsightType.OPTIMAL_POSTING_TIME]: 'bg-purple-100 text-purple-800',
      [InsightType.AUDIENCE_INTEREST]: 'bg-green-100 text-green-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  }

  getRelevanceBarWidth(score: number): string {
    return `${Math.round(score * 100)}%`;
  }
}
