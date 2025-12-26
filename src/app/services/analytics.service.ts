import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { firstValueFrom } from 'rxjs';

// GraphQL Queries
const GET_ANALYTICS_DATA = gql`
  query GetAnalyticsData($period: String!) {
    getAnalyticsData(period: $period) {
      analytics {
        id
        publishedPostId
        platform
        views
        likes
        comments
        shares
        reach
        saves
        engagementRate
        fetchedAt
      }
      publishedPosts {
        id
        postId
        platform
        platformPostId
        platformPostUrl
        publishedAt
        content
      }
      settings {
        id
        tenantId
        refreshIntervalHours
        lastRefreshAt
      }
    }
  }
`;

const REFRESH_ANALYTICS = gql`
  mutation RefreshAnalytics {
    refreshAnalytics
  }
`;

const UPDATE_REFRESH_INTERVAL = gql`
  mutation UpdateAnalyticsRefreshInterval($hours: Float!) {
    updateAnalyticsRefreshInterval(hours: $hours) {
      refreshIntervalHours
    }
  }
`;

// Raw data interfaces (from backend)
export interface PostAnalyticsData {
  id: string;
  publishedPostId: string;
  platform: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  reach?: number;
  saves?: number;
  engagementRate?: number;
  fetchedAt: Date;
}

export interface PublishedPostData {
  id: string;
  postId: string;
  platform: string;
  platformPostId: string;
  platformPostUrl: string;
  publishedAt: Date;
  content?: string;
}

export interface AnalyticsSettingsData {
  id: string;
  tenantId: string;
  refreshIntervalHours: number;
  lastRefreshAt?: Date;
}

export interface RawAnalyticsData {
  analytics: PostAnalyticsData[];
  publishedPosts: PublishedPostData[];
  settings: AnalyticsSettingsData;
}

// Presentation interfaces (calculated by frontend)
export interface OverviewStat {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
}

export interface PlatformStat {
  platform: string;
  icon: string;
  posts: number;
  reach: string;
  engagement: string;
  color: string;
}

export interface TopPost {
  id: string;
  content: string;
  platform: string;
  likes: number;
  comments: number;
  shares: number;
  reach: number;
  date: Date;
  platformUrl: string;
}

export interface EngagementDataPoint {
  day: string;
  value: number;
}

export interface AnalyticsSummary {
  overviewStats: OverviewStat[];
  platformStats: PlatformStat[];
  topPosts: TopPost[];
  engagementData: EngagementDataPoint[];
  lastUpdated?: Date;
  refreshIntervalHours: number;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  constructor(private apollo: Apollo) { }

  /**
   * Fetch raw analytics data and transform it for presentation
   */
  async getAnalyticsSummary(period: string): Promise<AnalyticsSummary> {
    const result = await firstValueFrom(
      this.apollo.query<{ getAnalyticsData: RawAnalyticsData }>({
        query: GET_ANALYTICS_DATA,
        variables: { period },
        fetchPolicy: 'network-only',
      })
    );

    const rawData = result.data.getAnalyticsData;
    return this.transformToSummary(rawData);
  }

  async refreshAnalytics(): Promise<void> {
    await firstValueFrom(
      this.apollo.mutate({ mutation: REFRESH_ANALYTICS })
    );
  }

  async updateRefreshInterval(hours: number): Promise<void> {
    await firstValueFrom(
      this.apollo.mutate({
        mutation: UPDATE_REFRESH_INTERVAL,
        variables: { hours },
      })
    );
  }

  // ============================================
  // PRESENTATION LOGIC (moved from backend)
  // ============================================

  private transformToSummary(rawData: RawAnalyticsData): AnalyticsSummary {
    const { analytics, publishedPosts, settings } = rawData;

    // Get latest analytics per post (deduplicate by publishedPostId)
    const latestAnalytics = this.getLatestAnalyticsPerPost(analytics);

    return {
      overviewStats: this.calculateOverviewStats(latestAnalytics, publishedPosts.length),
      platformStats: this.calculatePlatformStats(latestAnalytics, publishedPosts),
      topPosts: this.getTopPosts(latestAnalytics, publishedPosts),
      engagementData: this.calculateEngagementByDay(latestAnalytics, publishedPosts),
      lastUpdated: settings.lastRefreshAt ? new Date(settings.lastRefreshAt) : undefined,
      refreshIntervalHours: settings.refreshIntervalHours,
    };
  }

  private getLatestAnalyticsPerPost(analytics: PostAnalyticsData[]): PostAnalyticsData[] {
    const map = new Map<string, PostAnalyticsData>();
    for (const a of analytics) {
      if (!map.has(a.publishedPostId)) {
        map.set(a.publishedPostId, a);
      }
    }
    return Array.from(map.values());
  }

  private calculateOverviewStats(analytics: PostAnalyticsData[], postCount: number): OverviewStat[] {
    const totalViews = analytics.reduce((sum, a) => sum + a.views, 0);
    const totalLikes = analytics.reduce((sum, a) => sum + a.likes, 0);
    const totalComments = analytics.reduce((sum, a) => sum + a.comments, 0);
    const totalShares = analytics.reduce((sum, a) => sum + a.shares, 0);
    const avgEngagementRate = analytics.length > 0
      ? analytics.reduce((sum, a) => sum + (a.engagementRate || 0), 0) / analytics.length
      : 0;

    return [
      {
        label: 'Total Reach',
        value: this.formatNumber(totalViews),
        change: '--',
        trend: 'neutral',
      },
      {
        label: 'Engagement Rate',
        value: `${avgEngagementRate.toFixed(1)}%`,
        change: '--',
        trend: 'neutral',
      },
      {
        label: 'Total Posts',
        value: postCount.toString(),
        change: '--',
        trend: 'neutral',
      },
      {
        label: 'Avg. Likes',
        value: this.formatNumber(postCount > 0 ? Math.round(totalLikes / postCount) : 0),
        change: '--',
        trend: 'neutral',
      },
    ];
  }

  private calculatePlatformStats(analytics: PostAnalyticsData[], posts: PublishedPostData[]): PlatformStat[] {
    const platformMap = new Map<string, { posts: number; views: number; engagements: number }>();

    // Count posts per platform
    for (const post of posts) {
      const current = platformMap.get(post.platform) || { posts: 0, views: 0, engagements: 0 };
      current.posts++;
      platformMap.set(post.platform, current);
    }

    // Add analytics data
    for (const a of analytics) {
      const current = platformMap.get(a.platform);
      if (current) {
        current.views += a.views;
        current.engagements += a.likes + a.comments + a.shares;
      }
    }

    const platformConfig: Record<string, { icon: string; color: string; displayName: string }> = {
      'X': { icon: '𝕏', color: 'bg-black', displayName: 'X (Twitter)' },
      'INSTAGRAM': { icon: '📷', color: 'bg-pink-500', displayName: 'Instagram' },
      'TIKTOK': { icon: '🎵', color: 'bg-black', displayName: 'TikTok' },
      'YOUTUBE': { icon: '▶️', color: 'bg-red-600', displayName: 'YouTube' },
      'FACEBOOK': { icon: '👤', color: 'bg-blue-600', displayName: 'Facebook' },
    };

    const stats: PlatformStat[] = [];
    for (const [platform, data] of platformMap) {
      const config = platformConfig[platform] || { icon: '📱', color: 'bg-gray-500', displayName: platform };
      const engagementRate = data.views > 0 ? (data.engagements / data.views) * 100 : 0;
      stats.push({
        platform: config.displayName,
        icon: config.icon,
        posts: data.posts,
        reach: this.formatNumber(data.views),
        engagement: `${engagementRate.toFixed(1)}%`,
        color: config.color,
      });
    }

    return stats;
  }

  private getTopPosts(analytics: PostAnalyticsData[], posts: PublishedPostData[]): TopPost[] {
    // Sort by total engagement
    const sorted = [...analytics].sort((a, b) => {
      const engA = a.likes + a.comments + a.shares;
      const engB = b.likes + b.comments + b.shares;
      return engB - engA;
    });

    const topPosts: TopPost[] = [];
    for (const a of sorted.slice(0, 5)) {
      const publishedPost = posts.find(p => p.id === a.publishedPostId);
      if (!publishedPost) continue;

      topPosts.push({
        id: a.publishedPostId,
        content: publishedPost.content?.substring(0, 100) || 'No content',
        platform: this.getPlatformDisplayName(a.platform),
        likes: a.likes,
        comments: a.comments,
        shares: a.shares,
        reach: a.views,
        date: new Date(publishedPost.publishedAt),
        platformUrl: publishedPost.platformPostUrl,
      });
    }

    return topPosts;
  }

  private calculateEngagementByDay(analytics: PostAnalyticsData[], posts: PublishedPostData[]): EngagementDataPoint[] {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayEngagements = new Map<number, number>();

    // Initialize all days to 0
    for (let i = 0; i < 7; i++) {
      dayEngagements.set(i, 0);
    }

    // Sum engagements by day of week
    for (const a of analytics) {
      const post = posts.find(p => p.id === a.publishedPostId);
      if (post) {
        const dayOfWeek = new Date(post.publishedAt).getDay();
        const current = dayEngagements.get(dayOfWeek) || 0;
        dayEngagements.set(dayOfWeek, current + a.likes + a.comments + a.shares);
      }
    }

    return days.map((day, index) => ({
      day,
      value: dayEngagements.get(index) || 0,
    }));
  }

  private formatNumber(num: number): string {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  }

  private getPlatformDisplayName(platform: string): string {
    const names: Record<string, string> = {
      'X': 'X (Twitter)',
      'INSTAGRAM': 'Instagram',
      'TIKTOK': 'TikTok',
      'YOUTUBE': 'YouTube',
      'FACEBOOK': 'Facebook',
    };
    return names[platform] || platform;
  }
}
