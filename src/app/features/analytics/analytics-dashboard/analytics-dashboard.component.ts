import { Component, OnInit, signal, computed, ChangeDetectionStrategy, inject, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import {
  AnalyticsService,
  OverviewStat,
  PlatformStat,
  TopPost,
  EngagementDataPoint,
  PostAnalyticsData,
  PublishedPostData,
  FollowerData,
} from '../../../services/analytics.service';

// ── Intermediate data structures ──────────────────────────────────

export interface EngagementBreakdown {
  day: string;
  likes: number;
  comments: number;
  shares: number;
}

export interface PlatformComparison {
  platform: string;
  icon: string;
  color: string;
  avgLikes: number;
  avgComments: number;
  avgShares: number;
  avgViews: number;
  engagementRate: number;
}

export interface FunnelStage {
  label: string;
  value: number;
  percentage: number;
  barColor: string;
}

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './analytics-dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnalyticsDashboardComponent implements OnInit {
  Math = Math;

  private analyticsService = inject(AnalyticsService);

  selectedPeriod = signal('7days');
  loading = signal(true);
  refreshing = signal(false);
  error = signal<string | null>(null);

  // Raw data
  private rawAnalytics = signal<PostAnalyticsData[]>([]);
  private rawPublishedPosts = signal<PublishedPostData[]>([]);

  overviewStats = signal<OverviewStat[]>([]);
  platformStats = signal<PlatformStat[]>([]);
  topPosts = signal<TopPost[]>([]);
  engagementData = signal<EngagementDataPoint[]>([]);
  lastUpdated = signal<Date | null>(null);
  refreshIntervalHours = signal(6);
  selectedPlatforms = signal<Set<string>>(new Set());
  followerData = signal<FollowerData[]>([]);
  loadingFollowers = signal(false);

  refreshIntervalOptions = [1, 6, 12, 24];

  // ── Chart viewer refs (for manual update triggers if needed) ────
  protected trendChart = viewChild<BaseChartDirective>('trendChart');
  protected breakdownChart = viewChild<BaseChartDirective>('breakdownChart');
  protected funnelChart = viewChild<BaseChartDirective>('funnelChart');
  protected radarChart = viewChild<BaseChartDirective>('radarChart');

  // ── Derived data ────────────────────────────────────────────────

  availablePlatforms = computed(() => {
    const p = new Set<string>();
    this.rawAnalytics().forEach(a => p.add(a.platform.toUpperCase()));
    this.rawPublishedPosts().forEach(pp => p.add(pp.platform.toUpperCase()));
    return Array.from(p);
  });

  filteredAnalytics = computed(() => {
    const sel = this.selectedPlatforms();
    const all = this.rawAnalytics();
    if (sel.size === 0) return all;
    return all.filter(a => sel.has(a.platform.toUpperCase()));
  });

  filteredPosts = computed(() => {
    const sel = this.selectedPlatforms();
    const all = this.rawPublishedPosts();
    if (sel.size === 0) return all;
    return all.filter(p => sel.has(p.platform.toUpperCase()));
  });

  /** Engagement breakdown split by likes / comments / shares per day */
  engagementBreakdown = computed<EngagementBreakdown[]>(() => {
    const analytics = this.filteredAnalytics();
    const posts = this.filteredPosts();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const map = new Map<string, { likes: number; comments: number; shares: number }>();
    for (let i = 0; i < 7; i++) map.set(days[i], { likes: 0, comments: 0, shares: 0 });
    for (const a of analytics) {
      const post = posts.find(p => p.id === a.publishedPostId);
      if (post) {
        const day = days[new Date(post.publishedAt).getDay()];
        const cur = map.get(day)!;
        cur.likes += a.likes;
        cur.comments += a.comments;
        cur.shares += a.shares;
      }
    }
    return days.map(day => ({ day, ...map.get(day)! }));
  });

  /** Platform averages */
  platformComparison = computed<PlatformComparison[]>(() => {
    const analytics = this.filteredAnalytics();
    const map = new Map<string, { likes: number; comments: number; shares: number; views: number; count: number }>();
    for (const a of analytics) {
      const key = a.platform.toUpperCase();
      if (!map.has(key)) map.set(key, { likes: 0, comments: 0, shares: 0, views: 0, count: 0 });
      const cur = map.get(key)!;
      cur.likes += a.likes; cur.comments += a.comments; cur.shares += a.shares; cur.views += a.views; cur.count++;
    }
    return Array.from(map.entries()).map(([platform, d]) => {
      const cfg = this.platformConfig[platform] ?? { icon: '📱', displayName: platform, color: 'bg-gray-500' };
      const avg = (n: number) => d.count > 0 ? Math.round(n / d.count) : 0;
      const totalEngagements = d.likes + d.comments + d.shares;
      const er = d.views > 0 ? (totalEngagements / d.views) * 100 : 0;
      return {
        platform: cfg.displayName, icon: cfg.icon, color: cfg.color,
        avgLikes: avg(d.likes), avgComments: avg(d.comments),
        avgShares: avg(d.shares), avgViews: avg(d.views),
        engagementRate: Math.round(er * 10) / 10,
      };
    });
  });

  /** Conversion funnel */
  conversionFunnel = computed<FunnelStage[]>(() => {
    const analytics = this.filteredAnalytics();
    const tv = analytics.reduce((s, a) => s + a.views, 0);
    const tl = analytics.reduce((s, a) => s + a.likes, 0);
    const tc = analytics.reduce((s, a) => s + a.comments, 0);
    const ts = analytics.reduce((s, a) => s + a.shares, 0);
    return [
      { label: 'Views', value: tv, percentage: 100, barColor: '#3B82F6' },
      { label: 'Likes', value: tl, percentage: tv > 0 ? (tl / tv) * 100 : 0, barColor: '#22C55E' },
      { label: 'Comments', value: tc, percentage: tv > 0 ? (tc / tv) * 100 : 0, barColor: '#F59E0B' },
      { label: 'Shares', value: ts, percentage: tv > 0 ? (ts / tv) * 100 : 0, barColor: '#A855F7' },
    ];
  });

  platformConfig: Record<string, { icon: string; displayName: string; color: string }> = {
    'X': { icon: 'assets/icons/Twitter.png', displayName: 'X', color: 'bg-black' },
    'INSTAGRAM': { icon: 'assets/icons/Instagram.png', displayName: 'Instagram', color: 'bg-pink-500' },
    'TIKTOK': { icon: 'assets/icons/tiktok.png', displayName: 'TikTok', color: 'bg-black' },
    'YOUTUBE': { icon: 'assets/icons/youtube_v2.png', displayName: 'YouTube', color: 'bg-red-600' },
    'FACEBOOK': { icon: 'assets/icons/facebook.png', displayName: 'Facebook', color: 'bg-blue-600' },
  };

  // ── Chart.js data configs (computed from signals) ───────────────

  /** 1. Engagement Trend – vertical bar */
  protected trendData = computed<ChartData<'bar'>>(() => {
    const d = this.engagementData();
    return {
      labels: d.map(x => x.day),
      datasets: [{
        label: 'Engagements',
        data: d.map(x => x.value),
        backgroundColor: 'rgba(99, 102, 241, 0.75)',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 1,
        borderRadius: 4,
      }],
    };
  });

  protected readonly trendOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
      x: { grid: { display: false } },
    },
  };

  /** 2. Engagement Breakdown – stacked bar */
  protected breakdownData = computed<ChartData<'bar'>>(() => {
    const d = this.engagementBreakdown();
    return {
      labels: d.map(x => x.day),
      datasets: [
        {
          label: 'Likes',
          data: d.map(x => x.likes),
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
          borderRadius: 0,
        },
        {
          label: 'Comments',
          data: d.map(x => x.comments),
          backgroundColor: 'rgba(245, 158, 11, 0.8)',
          borderRadius: 0,
        },
        {
          label: 'Shares',
          data: d.map(x => x.shares),
          backgroundColor: 'rgba(168, 85, 247, 0.8)',
          borderRadius: 0,
        },
      ],
    };
  });

  protected readonly breakdownOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { stacked: true, grid: { display: false } },
      y: { stacked: true, beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
    },
  };

  /** 3. Conversion Funnel – horizontal bar */
  protected funnelData = computed<ChartData<'bar'>>(() => {
    const s = this.conversionFunnel();
    return {
      labels: s.map(x => x.label),
      datasets: [{
        label: 'Count',
        data: s.map(x => x.value),
        backgroundColor: s.map(x => x.barColor),
        borderRadius: 4,
      }],
    };
  });

  protected readonly funnelOptions: ChartOptions<'bar'> = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
      y: { grid: { display: false } },
    },
  };

  /** 4. Platform Radar – radar chart (normalised 0–100) */
  protected radarData = computed<ChartData<'radar'>>(() => {
    const platforms = this.platformComparison();
    if (platforms.length === 0) return { labels: [], datasets: [] };

    const labels = ['Avg Views', 'Avg Likes', 'Avg Comments', 'Avg Shares', 'Eng. Rate'];
    const maxPerMetric = [
      Math.max(...platforms.map(p => p.avgViews), 1),
      Math.max(...platforms.map(p => p.avgLikes), 1),
      Math.max(...platforms.map(p => p.avgComments), 1),
      Math.max(...platforms.map(p => p.avgShares), 1),
      Math.max(...platforms.map(p => p.engagementRate), 1),
    ];

    const palette = [
      'rgba(99, 102, 241, 0.7)',
      'rgba(236, 72, 153, 0.7)',
      'rgba(34, 197, 94, 0.7)',
      'rgba(239, 68, 68, 0.7)',
      'rgba(245, 158, 11, 0.7)',
    ];

    return {
      labels,
      datasets: platforms.map((p, i) => ({
        label: p.platform,
        data: [
          (p.avgViews / maxPerMetric[0]) * 100,
          (p.avgLikes / maxPerMetric[1]) * 100,
          (p.avgComments / maxPerMetric[2]) * 100,
          (p.avgShares / maxPerMetric[3]) * 100,
          (p.engagementRate / maxPerMetric[4]) * 100,
        ],
        backgroundColor: palette[i % palette.length].replace('0.7', '0.15'),
        borderColor: palette[i % palette.length].replace('0.7', '1'),
        borderWidth: 2,
        pointBackgroundColor: palette[i % palette.length].replace('0.7', '1'),
      })),
    };
  });

  protected readonly radarOptions: ChartOptions<'radar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 12, padding: 12 } },
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: { stepSize: 25, display: false },
        grid: { color: 'rgba(0,0,0,0.07)' },
        pointLabels: { font: { size: 10 } },
      },
    },
  };

  // ── Lifecycle ───────────────────────────────────────────────────

  ngOnInit() {
    this.loadAnalytics();
    this.loadFollowerCounts();
  }

  // ── Data loading ────────────────────────────────────────────────

  async loadFollowerCounts() {
    this.loadingFollowers.set(true);
    try {
      this.followerData.set(await this.analyticsService.getFollowerCounts());
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
      this.rawAnalytics.set(data.rawAnalytics);
      this.rawPublishedPosts.set(data.rawPosts);
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
    this.overviewStats.set(this.analyticsService.calculateOverviewStats(analytics, posts.length));
    this.platformStats.set(this.analyticsService.calculatePlatformStats(analytics, posts));
    this.topPosts.set(this.analyticsService.getTopPosts(analytics, posts));
    this.engagementData.set(this.analyticsService.calculateEngagementByDay(analytics, posts));
  }

  // ── User actions ────────────────────────────────────────────────

  togglePlatform(platform: string) {
    const s = new Set(this.selectedPlatforms());
    s.has(platform) ? s.delete(platform) : s.add(platform);
    this.selectedPlatforms.set(s);
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

  formatTimeAgo(date: Date | null): string {
    if (!date) return 'Never';
    const diffMs = Date.now() - date.getTime();
    const diffH = Math.floor(diffMs / 3600000);
    const diffM = Math.floor(diffMs / 60000);
    if (diffM < 1) return 'Just now';
    if (diffM < 60) return `${diffM}m ago`;
    if (diffH < 24) return `${diffH}h ago`;
    return `${Math.floor(diffH / 24)}d ago`;
  }

  hasNoData(): boolean {
    return !this.loading() && this.overviewStats().length === 0 && this.topPosts().length === 0;
  }
}
