import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
// import { PostsService } from '../../shared/services/posts.service';
// import { InsightsService } from '../../shared/services/insights.service';
// import { MonitoringService } from '../../shared/services/monitoring.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  stats = {
    totalPosts: 0,
    publishedToday: 0,
    scheduledPosts: 0,
    totalInsights: 0,
    unreadInsights: 0,
    monitoredProfiles: 0,
    connectedAccounts: 0
  };

  recentPosts: any[] = [];
  recentInsights: any[] = [];
  loading = true;

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

  constructor(
    // private postsService: PostsService,
    // private insightsService: InsightsService,
    // private monitoringService: MonitoringService
  ) {}

  async ngOnInit() {
    await this.loadDashboardData();
  }

  async loadDashboardData() {
    this.loading = true;
    try {
      // const [posts, insights, profiles] = await Promise.all([
      //   this.postsService.getUserPosts(10),
      //   this.insightsService.getInsights(5),
      //   this.monitoringService.getMonitoredProfiles()
      // ]);

      // this.recentPosts = posts;
      // this.recentInsights = insights;

      // this.stats = {
      //   totalPosts: posts.length,
      //   publishedToday: posts.filter(p => this.isToday(p.createdAt)).length,
      //   scheduledPosts: posts.filter(p => p.status === 'scheduled').length,
      //   totalInsights: insights.length,
      //   unreadInsights: insights.filter(i => !i.isRead).length,
      //   monitoredProfiles: profiles.length,
      //   connectedAccounts: 0 // Will be updated from connected accounts service
      // };
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      this.loading = false;
    }
  }

  isToday(date: Date): boolean {
    const today = new Date();
    const checkDate = new Date(date);
    return checkDate.toDateString() === today.toDateString();
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      published: 'bg-green-100 text-green-800',
      scheduled: 'bg-blue-100 text-blue-800',
      draft: 'bg-gray-100 text-gray-800',
      failed: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }
}