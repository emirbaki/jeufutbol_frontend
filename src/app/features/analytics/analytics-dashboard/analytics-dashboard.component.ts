import { Component, OnInit, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AnalyticsService,
  AnalyticsSummary,
  OverviewStat,
  PlatformStat,
  TopPost,
  EngagementDataPoint,
} from '../../../services/analytics.service';

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './analytics-dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnalyticsDashboardComponent implements OnInit {
  private analyticsService = inject(AnalyticsService);

  selectedPeriod = signal('7days');
  loading = signal(true);
  refreshing = signal(false);
  error = signal<string | null>(null);

  overviewStats = signal<OverviewStat[]>([]);
  platformStats = signal<PlatformStat[]>([]);
  topPosts = signal<TopPost[]>([]);
  engagementData = signal<EngagementDataPoint[]>([]);
  lastUpdated = signal<Date | null>(null);
  refreshIntervalHours = signal(6);

  refreshIntervalOptions = [1, 6, 12, 24];

  ngOnInit() {
    this.loadAnalytics();
  }

  async loadAnalytics() {
    this.loading.set(true);
    this.error.set(null);

    try {
      const data = await this.analyticsService.getAnalyticsSummary(this.selectedPeriod());
      this.overviewStats.set(data.overviewStats);
      this.platformStats.set(data.platformStats);
      this.topPosts.set(data.topPosts);
      this.engagementData.set(data.engagementData);
      this.lastUpdated.set(data.lastUpdated ? new Date(data.lastUpdated) : null);
      this.refreshIntervalHours.set(data.refreshIntervalHours);
    } catch (e: any) {
      console.error('Failed to load analytics:', e);
      this.error.set('Failed to load analytics data. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  async selectPeriod(period: string) {
    this.selectedPeriod.set(period);
    await this.loadAnalytics();
  }

  async manualRefresh() {
    this.refreshing.set(true);
    this.error.set(null);

    try {
      await this.analyticsService.refreshAnalytics();
      await this.loadAnalytics();
    } catch (e: any) {
      console.error('Failed to refresh analytics:', e);
      this.error.set('Failed to refresh analytics. Please try again.');
    } finally {
      this.refreshing.set(false);
    }
  }

  async updateRefreshInterval(hours: number) {
    try {
      await this.analyticsService.updateRefreshInterval(hours);
      this.refreshIntervalHours.set(hours);
    } catch (e: any) {
      console.error('Failed to update refresh interval:', e);
    }
  }

  getPlatformIcon(platform: string): string {
    const icons: Record<string, string> = {
      'X (Twitter)': '𝕏',
      'Instagram': '📷',
      'Facebook': '👤',
      'TikTok': '🎵',
      'YouTube': '▶️'
    };
    return icons[platform] || '📱';
  }

  getMaxEngagement(): number {
    const data = this.engagementData();
    if (data.length === 0) return 1;
    return Math.max(...data.map(d => d.value), 1);
  }

  formatTimeAgo(date: Date | null): string {
    if (!date) return 'Never';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  }

  hasNoData(): boolean {
    return !this.loading() && this.overviewStats().length === 0 && this.topPosts().length === 0;
  }
}