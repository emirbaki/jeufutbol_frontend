
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analytics-dashboard.component.html',
})
export class AnalyticsDashboardComponent implements OnInit {
  selectedPeriod = '7days';
  loading = false;

  overviewStats = [
    { label: 'Total Reach', value: '125.4K', change: '+12.5%', trend: 'up' },
    { label: 'Engagement Rate', value: '8.4%', change: '+2.1%', trend: 'up' },
    { label: 'Total Posts', value: '48', change: '+4', trend: 'up' },
    { label: 'Avg. Likes', value: '2.8K', change: '-5.2%', trend: 'down' }
  ];

  platformStats = [
    { platform: 'X (Twitter)', icon: '𝕏', posts: 24, reach: '45.2K', engagement: '9.2%', color: 'bg-blue-500' },
    { platform: 'Instagram', icon: '📷', posts: 18, reach: '52.8K', engagement: '11.5%', color: 'bg-pink-500' },
    { platform: 'Facebook', icon: '👤', posts: 6, reach: '27.4K', engagement: '5.1%', color: 'bg-blue-600' }
  ];

  topPosts = [
    {
      id: '1',
      content: 'Just launched our new feature! Check it out 🚀',
      platform: 'instagram',
      likes: 4520,
      comments: 234,
      shares: 89,
      reach: 28400,
      date: new Date('2024-10-15')
    },
    {
      id: '2',
      content: 'Behind the scenes of our latest project...',
      platform: 'x',
      likes: 3890,
      comments: 156,
      shares: 234,
      reach: 31200,
      date: new Date('2024-10-14')
    },
    {
      id: '3',
      content: 'Tips for social media success in 2024',
      platform: 'facebook',
      likes: 2340,
      comments: 98,
      shares: 187,
      reach: 19800,
      date: new Date('2024-10-13')
    }
  ];

  engagementData = [
    { day: 'Mon', value: 340 },
    { day: 'Tue', value: 420 },
    { day: 'Wed', value: 380 },
    { day: 'Thu', value: 560 },
    { day: 'Fri', value: 490 },
    { day: 'Sat', value: 380 },
    { day: 'Sun', value: 320 }
  ];

  ngOnInit() {}

  selectPeriod(period: string) {
    this.selectedPeriod = period;
    // Load data for selected period
  }

  getPlatformIcon(platform: string): string {
    const icons: Record<string, string> = {
      x: '𝕏',
      instagram: '📷',
      facebook: '👤',
      tiktok: '🎵',
      youtube: '▶️'
    };
    return icons[platform] || '📱';
  }

  getMaxEngagement(): number {
    return Math.max(...this.engagementData.map(d => d.value));
  }
}