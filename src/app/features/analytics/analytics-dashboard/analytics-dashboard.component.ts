import { Component, OnInit, signal, computed, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AnalyticsService,
  AnalyticsSummary,
  OverviewStat,
  PlatformStat,
  TopPost,
  EngagementDataPoint,
  PostAnalyticsData,
  PublishedPostData,
  FollowerData,
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

  // Raw data from backend
  private rawAnalytics = signal<PostAnalyticsData[]>([]);
  private rawPublishedPosts = signal<PublishedPostData[]>([]);

  overviewStats = signal<OverviewStat[]>([]);
  platformStats = signal<PlatformStat[]>([]);
  topPosts = signal<TopPost[]>([]);
  engagementData = signal<EngagementDataPoint[]>([]);
  lastUpdated = signal<Date | null>(null);
  refreshIntervalHours = signal(6);

  // Platform filter
  selectedPlatforms = signal<Set<string>>(new Set());

  // Follower counts
  followerData = signal<FollowerData[]>([]);
  loadingFollowers = signal(false);

  // Available platforms computed from data
  availablePlatforms = computed(() => {
    const platforms = new Set<string>();
    this.rawAnalytics().forEach(a => platforms.add(a.platform.toUpperCase()));
    this.rawPublishedPosts().forEach(p => platforms.add(p.platform.toUpperCase()));
    return Array.from(platforms);
  });

  // Filtered data based on selected platforms
  filteredAnalytics = computed(() => {
    const selected = this.selectedPlatforms();
    const analytics = this.rawAnalytics();
    if (selected.size === 0) return analytics;
    return analytics.filter(a => selected.has(a.platform));
  });

  filteredPosts = computed(() => {
    const selected = this.selectedPlatforms();
    const posts = this.rawPublishedPosts();
    if (selected.size === 0) return posts;
    return posts.filter(p => selected.has(p.platform));
  });

  refreshIntervalOptions = [1, 6, 12, 24];

  platformConfig: Record<string, { icon: string; displayName: string; color: string }> = {
    'X': { icon: 'assets/icons/Twitter.png', displayName: 'X', color: 'bg-black' },
    'INSTAGRAM': { icon: 'assets/icons/Instagram.png', displayName: 'Instagram', color: 'bg-pink-500' },
    'TIKTOK': { icon: 'assets/icons/tiktok.png', displayName: 'TikTok', color: 'bg-black' },
    'YOUTUBE': { icon: 'assets/icons/youtube_v2.png', displayName: 'YouTube', color: 'bg-red-600' },
    'FACEBOOK': { icon: 'assets/icons/facebook.png', displayName: 'Facebook', color: 'bg-blue-600' },
  };

  ngOnInit() {
    this.loadAnalytics();
    this.loadFollowerCounts();
  }

  async loadFollowerCounts() {
    this.loadingFollowers.set(true);
    try {
      const data = await this.analyticsService.getFollowerCounts();
      this.followerData.set(data);
    } catch (e: any) {
      console.error('Failed to load follower counts:', e);
    } finally {
      this.loadingFollowers.set(false);
    }
  }

  async loadAnalytics() {
    this.loading.set(true);
    this.error.set(null);

    try {
      const data = await this.analyticsService.getAnalyticsSummaryWithRaw(this.selectedPeriod());

      // Store raw data for filtering
      this.rawAnalytics.set(data.rawAnalytics);
      this.rawPublishedPosts.set(data.rawPosts);

      // Update computed display data
      this.updateDisplayData();

      this.lastUpdated.set(data.lastUpdated ? new Date(data.lastUpdated) : null);
      this.refreshIntervalHours.set(data.refreshIntervalHours);
    } catch (e: any) {
      console.error('Failed to load analytics:', e);
      this.error.set('Failed to load analytics data. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  private updateDisplayData() {
    const analytics = this.filteredAnalytics();
    const posts = this.filteredPosts();

    // Recalculate all stats with filtered data
    this.overviewStats.set(this.analyticsService.calculateOverviewStats(analytics, posts.length));
    this.platformStats.set(this.analyticsService.calculatePlatformStats(analytics, posts));
    this.topPosts.set(this.analyticsService.getTopPosts(analytics, posts));
    this.engagementData.set(this.analyticsService.calculateEngagementByDay(analytics, posts));
  }

  togglePlatform(platform: string) {
    const current = new Set(this.selectedPlatforms());
    if (current.has(platform)) {
      current.delete(platform);
    } else {
      current.add(platform);
    }
    this.selectedPlatforms.set(current);
    this.updateDisplayData();
  }

  clearPlatformFilter() {
    this.selectedPlatforms.set(new Set());
    this.updateDisplayData();
  }

  isPlatformSelected(platform: string): boolean {
    return this.selectedPlatforms().has(platform);
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
    return this.platformConfig[platform]?.icon || 'assets/icons/default.png';
  }

  getPlatformDisplayName(platform: string): string {
    return this.platformConfig[platform]?.displayName || platform;
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
