import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { PostsService, Post } from '../../services/posts.service';
import { MonitoringService, MonitoredProfile } from '../../services/monitoring.service';
import { InsightsService } from '../../services/insights.service';
import { Insight } from '../../models/insight.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  private postsService = inject(PostsService);
  private monitoringService = inject(MonitoringService);
  private insightsService = inject(InsightsService);

  // Signals
  posts = signal<Post[]>([]);
  monitoredProfiles = signal<MonitoredProfile[]>([]);
  insights = signal<Insight[]>([]);
  loading = signal<boolean>(true);

  // Computed Stats
  stats = computed(() => {
    const posts = this.posts();
    const insights = this.insights();
    const profiles = this.monitoredProfiles();

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const publishedToday = posts.filter(p => {
      const dateStr = p.scheduledFor || p.createdAt;
      const pDate = new Date(dateStr);
      const pTime = new Date(pDate.getFullYear(), pDate.getMonth(), pDate.getDate()).getTime();
      return p.status === 'PUBLISHED' && pTime === today;
    }).length;

    return {
      totalPosts: posts.length,
      publishedToday: publishedToday,
      scheduledPosts: posts.filter(p => p.status === 'SCHEDULED').length,
      totalInsights: insights.length,
      unreadInsights: insights.filter(i => !i.isRead).length,
      monitoredProfiles: profiles.length,
      connectedAccounts: 0 // Placeholder
    };
  });

  recentPosts = computed(() => this.posts().slice(0, 5));
  recentInsights = computed(() => this.insights().slice(0, 5));

  quickActions = [
    {
      title: 'Create New Post',
      description: 'Compose and publish to multiple platforms',
      icon: '✍️',
      route: '/composer',
      color: 'bg-blue-500'
    },
    {
      title: 'View Insights',
      description: 'AI-powered content suggestions',
      icon: '💡',
      route: '/insights',
      color: 'bg-yellow-500'
    },
    {
      title: 'Add Monitor',
      description: 'Track new profiles for trends',
      icon: '👀',
      route: '/monitoring',
      color: 'bg-green-500'
    },
    {
      title: 'View Analytics',
      description: 'Check your performance',
      icon: '📊',
      route: '/analytics',
      color: 'bg-purple-500'
    }
  ];

  async ngOnInit() {
    await this.loadDashboardData();
  }

  async loadDashboardData() {
    this.loading.set(true);
    try {
      const [posts, profiles, insights] = await Promise.all([
        firstValueFrom(this.postsService.watchPosts(100)),
        firstValueFrom(this.monitoringService.watchMonitoredProfiles()),
        firstValueFrom(this.insightsService.watchInsights(20))
      ]);

      this.posts.set(posts);
      this.monitoredProfiles.set(profiles);
      this.insights.set(insights);

    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      this.loading.set(false);
    }
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      PUBLISHED: 'bg-green-100 text-green-800',
      SCHEDULED: 'bg-blue-100 text-blue-800',
      DRAFT: 'bg-gray-100 text-gray-800',
      FAILED: 'bg-red-100 text-red-800',
      // Fallback for lowercase
      published: 'bg-green-100 text-green-800',
      scheduled: 'bg-blue-100 text-blue-800',
      draft: 'bg-gray-100 text-gray-800',
      failed: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }
}