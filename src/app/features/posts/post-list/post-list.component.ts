import { Component, OnInit, OnDestroy, effect, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PostsService, Post } from '../../../services/posts.service';
import { Subscription } from 'rxjs';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  matEditRound, matPersonRound, matDateRangeRound,
  matDeleteRound, matSendRound, matScheduleRound,
  matSettingsRound, matPageviewRound, matHourglassTopRound,
  matRestartAltRound
} from '@ng-icons/material-icons/round';
@Component({
  selector: 'app-posts-list',
  standalone: true,
  imports: [CommonModule, RouterLink, NgIcon],
  templateUrl: './post-list.component.html',
  providers: [provideIcons({ matEditRound, matPersonRound, matDateRangeRound, matDeleteRound, matSendRound, matScheduleRound, matSettingsRound, matPageviewRound, matHourglassTopRound, matRestartAltRound })],
})
export class PostsListComponent implements OnInit, OnDestroy {
  // Signals
  posts = signal<Post[]>([]);
  objectKeys = Object.keys;
  selectedFilter = signal<'ALL' | 'PUBLISHED' | 'SCHEDULED' | 'DRAFT' | 'FAILED'>('ALL');
  loading = signal(true);

  // Computed signals
  filteredPosts = computed<Post[]>(() => {
    const filter = this.selectedFilter();
    const posts = this.posts();
    return filter === 'ALL' ? posts : posts.filter(p => p.status === filter);
  });

  filters = computed<{ value: string, label: string, count: number }[]>(() => {
    const posts = this.posts();
    return [
      { value: 'ALL', label: 'All Posts', count: posts.length },
      { value: 'PUBLISHED', label: 'Published', count: posts.filter(p => p.status === 'PUBLISHED').length },
      { value: 'SCHEDULED', label: 'Scheduled', count: posts.filter(p => p.status === 'SCHEDULED').length },
      { value: 'DRAFT', label: 'Drafts', count: posts.filter(p => p.status === 'DRAFT').length },
      { value: 'FAILED', label: 'Failed', count: posts.filter(p => p.status === 'FAILED').length }
    ];
  });

  private postsSubscription: Subscription | null = null;
  private updatesSubscription: Subscription | null = null;

  constructor(private postsService: PostsService) {
    effect(() => {
      console.log(`The count is: ${this.filters().map(f => `${f.label}: ${f.count}`).join(', ')}`);
    });
  }

  ngOnInit(): void {
    this.postsSubscription = this.postsService.watchPosts(100).subscribe({
      next: posts => {
        this.posts.set(posts);
        this.loading.set(false);
      },
      error: err => {
        console.error('Error loading posts:', err);
        this.loading.set(false);
      }
    });

    // Subscribe to real-time updates
    this.updatesSubscription = this.postsService.subscribeToPostUpdates().subscribe({
      next: (updatedPost) => {
        // Update the post in the local list
        const currentPosts = this.posts();
        const index = currentPosts.findIndex(p => p.id === updatedPost.id);
        if (index !== -1) {
          // Replace the post at the found index
          const newPosts = [...currentPosts];
          newPosts[index] = updatedPost;
          this.posts.set(newPosts);
        }
      },
      error: (err) => console.error('Subscription error:', err)
    });
  }

  ngOnDestroy(): void {
    if (this.postsSubscription) {
      this.postsSubscription.unsubscribe();
    }
    if (this.updatesSubscription) {
      this.updatesSubscription.unsubscribe();
    }
  }

  applyFilter(filter: string): void {
    this.selectedFilter.set(filter as any);
  }

  async deletePost(post: Post, event: Event): Promise<void> {
    event.stopPropagation();
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      await this.postsService.deletePost(post.id);
      // Apollo cache handles updates
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post');
    }
  }

  async publishPost(post: Post, event: Event): Promise<void> {
    event.stopPropagation();
    if (!confirm('Publish this post now?')) return;

    try {
      await this.postsService.publishPost(post.id);
      // Apollo refetches automatically
    } catch (error) {
      console.error('Error publishing post:', error);
      alert('Failed to publish post');
    }
  }

  getStatusColor(status: string): string {
    const normalizedStatus = status?.toLowerCase();
    const colors: Record<string, string> = {
      published: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-800',
      scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700',
      failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800'
    };
    return colors[normalizedStatus] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700';
  }

  getPlatformIcon(platform: string): string {
    const icons: Record<string, string> = {
      x: 'assets/icons/Twitter.png',
      instagram: 'assets/icons/Instagram.png',
      facebook: 'assets/icons/facebook.png',
      tiktok: 'assets/icons/tiktok.png',
      youtube: 'assets/icons/youtube.png'
    };
    return icons[platform] || '📱';
  }

  trackByPostId(post: Post): string {
    return post.id;
  }
  async retryPost(post: Post, event: Event): Promise<void> {
    event.stopPropagation();
    if (!confirm('Retry publishing this post?')) return;

    try {
      await this.postsService.retryPublishPost(post.id);
      // Apollo refetches automatically
    } catch (error) {
      console.error('Error retrying post:', error);
      alert('Failed to retry post');
    }
  }

  /**
   * Check if a URL points to a video file
   */
  isVideo(url: string): boolean {
    const videoExtensions = ['.mp4', '.mov', '.webm', '.avi', '.m4v'];
    return videoExtensions.some(ext => url.toLowerCase().endsWith(ext));
  }

  /**
   * Get human-readable status text for publish status
   */
  getStatusText(status: string | undefined): string {
    if (!status) return 'Pending';
    const statusMap: Record<string, string> = {
      'PROCESSING_UPLOAD': 'Processing...',
      'IN_PROGRESS': 'Processing...',
      'PUBLISH_COMPLETE': 'Published',
      'FINISHED': 'Published',
      'FAILED': 'Failed',
    };
    return statusMap[status] || status;
  }
}
