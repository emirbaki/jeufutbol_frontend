import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
// Make sure the path is correct and the file exists
import { InsightsService } from '../../../services/insights.service';
import { Insight, InsightType } from '../../../models/insight.model';

@Component({
  selector: 'app-insights-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './insights-dashboard.html',
})
export class InsightsDashboardComponent implements OnInit {
  insights: Insight[] = [];
  loading = false;
  generatingInsights = false;
  selectedType: InsightType | 'all' = 'all';
  
  insightTypes = Object.values(InsightType);

  constructor(private insightsService: InsightsService) {}

  ngOnInit(): void {
    this.loadInsights();
  }

  async loadInsights(): Promise<void> {
    this.loading = true;
    try {
      this.insights = await this.insightsService.getInsights();
    } catch (error) {
      console.error('Error loading insights:', error);
    } finally {
      this.loading = false;
    }
  }

  async generateNewInsights(): Promise<void> {
    this.generatingInsights = true;
    try {
      const newInsights = await this.insightsService.generateInsights();
      this.insights = [...newInsights, ...this.insights];
    } catch (error) {
      console.error('Error generating insights:', error);
    } finally {
      this.generatingInsights = false;
    }
  }

  async markAsRead(insight: Insight): Promise<void> {
    try {
      await this.insightsService.markAsRead(insight.id);
      insight.isRead = true;
    } catch (error) {
      console.error('Error marking insight as read:', error);
    }
  }

  filterInsights(): Insight[] {
    if (this.selectedType === 'all') {
      return this.insights;
    }
    return this.insights.filter(i => i.type === this.selectedType);
  }

  getInsightIcon(type: InsightType): string {
    const icons = {
      [InsightType.TRENDING_TOPIC]: '🔥',
      [InsightType.CONTENT_SUGGESTION]: '💡',
      [InsightType.ENGAGEMENT_PATTERN]: '📊',
      [InsightType.OPTIMAL_POSTING_TIME]: '⏰',
      [InsightType.AUDIENCE_INTEREST]: '👥'
    };
    return icons[type] || '📌';
  }

  getInsightColor(type: InsightType): string {
    const colors = {
      [InsightType.TRENDING_TOPIC]: 'bg-red-100 text-red-800',
      [InsightType.CONTENT_SUGGESTION]: 'bg-yellow-100 text-yellow-800',
      [InsightType.ENGAGEMENT_PATTERN]: 'bg-blue-100 text-blue-800',
      [InsightType.OPTIMAL_POSTING_TIME]: 'bg-purple-100 text-purple-800',
      [InsightType.AUDIENCE_INTEREST]: 'bg-green-100 text-green-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  }

  getRelevanceBarWidth(score: number): string {
    return `${Math.round(score * 100)}%`;
  }
}