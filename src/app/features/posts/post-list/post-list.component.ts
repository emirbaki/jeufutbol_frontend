import { Component, OnInit, OnDestroy, effect, signal, computed } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PostsService, Post } from '../../../services/posts.service';
import { Subscription } from 'rxjs';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  matEditRound, matPersonRound, matDateRangeRound,
  matDeleteRound, matSendRound, matScheduleRound,
  matSettingsRound, matPageviewRound, matHourglassTopRound,
  matRestartAltRound
} from '@ng-icons/material-icons/round';

type SortOption = 'newest' | 'oldest';
type TimeFilter = 'all' | 'today' | 'week' | 'month';

@Component({
  selector: 'app-posts-list',
  standalone: true,
  imports: [CommonModule, RouterLink, NgIcon, NgOptimizedImage, FormsModule],
  templateUrl: './post-list.component.html',
  providers: [provideIcons({ matEditRound, matPersonRound, matDateRangeRound, matDeleteRound, matSendRound, matScheduleRound, matSettingsRound, matPageviewRound, matHourglassTopRound, matRestartAltRound })],
})
export class PostsListComponent implements OnInit, OnDestroy {
  // Signals
  posts = signal<Post[]>([]);
  objectKeys = Object.keys;
  selectedFilter = signal<'ALL' | 'PUBLISHED' | 'SCHEDULED' | 'DRAFT' | 'FAILED'>('ALL');
  selectedPlatform = signal<string>('ALL');
  selectedSort = signal<SortOption>('newest');
  selectedTimeFilter = signal<TimeFilter>('all');
  loading = signal(true);
  publishingPostIds = signal<Set<string>>(new Set());

  // Available platforms from posts
  availablePlatforms = computed(() => {
    const platforms = new Set<string>();
    this.posts().forEach(post => {
      post.targetPlatforms?.forEach(p => platforms.add(p.toLowerCase()));
    });
    return ['ALL', ...Array.from(platforms)];
  });

  // Enhanced filtered and sorted posts
  filteredPosts = computed<Post[]>(() => {
    const statusFilter = this.selectedFilter();
    const platformFilter = this.selectedPlatform();
    const timeFilter = this.selectedTimeFilter();
    const sortOption = this.selectedSort();

    let result = [...this.posts()];

    // Status filter
    if (statusFilter !== 'ALL') {
      result = result.filter(p => p.status === statusFilter);
    }

    // Platform filter
    if (platformFilter !== 'ALL') {
      result = result.filter(p =>
        p.targetPlatforms?.some(tp => tp.toLowerCase() === platformFilter)
      );
    }

    // Time filter
    const now = new Date();
    if (timeFilter !== 'all') {
      result = result.filter(p => {
        const postDate = new Date(p.createdAt);
        switch (timeFilter) {
          case 'today':
            return postDate.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return postDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return postDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    // Sorting
    result.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOption === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return result;
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

  applyPlatformFilter(platform: string): void {
    this.selectedPlatform.set(platform);
  }

  applySort(sort: SortOption): void {
    this.selectedSort.set(sort);
  }

  applyTimeFilter(time: TimeFilter): void {
    this.selectedTimeFilter.set(time);
  }

  clearAllFilters(): void {
    this.selectedFilter.set('ALL');
    this.selectedPlatform.set('ALL');
    this.selectedSort.set('newest');
    this.selectedTimeFilter.set('all');
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

    // Prevent double-clicks
    if (this.isPublishing(post.id)) return;

    if (!confirm('Publish this post now?')) return;

    // Mark as publishing
    this.setPublishing(post.id, true);

    try {
      await this.postsService.publishPost(post.id);
      // Apollo refetches automatically
    } catch (error) {
      console.error('Error publishing post:', error);
      alert('Failed to publish post');
    } finally {
      this.setPublishing(post.id, false);
    }
  }

  /**
   * Check if a post is currently being published
   */
  isPublishing(postId: string): boolean {
    return this.publishingPostIds().has(postId);
  }

  /**
   * Set publishing state for a post
   */
  private setPublishing(postId: string, isPublishing: boolean): void {
    const current = new Set(this.publishingPostIds());
    if (isPublishing) {
      current.add(postId);
    } else {
      current.delete(postId);
    }
    this.publishingPostIds.set(current);
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
      youtube: 'assets/icons/youtube_v2.png'
    };
    return icons[platform] || '📱';
  }

  trackByPostId(post: Post): string {
    return post.id;
  }
  async retryPost(post: Post, event: Event): Promise<void> {
    event.stopPropagation();

    // Prevent double-clicks
    if (this.isPublishing(post.id)) return;

    if (!confirm('Retry publishing this post?')) return;

    // Mark as publishing
    this.setPublishing(post.id, true);

    try {
      await this.postsService.retryPublishPost(post.id);
      // Apollo refetches automatically
    } catch (error) {
      console.error('Error retrying post:', error);
      alert('Failed to retry post');
    } finally {
      this.setPublishing(post.id, false);
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

  getDisplayContent(post: Post): string {
    if (post.content && post.content.trim()) {
      return post.content;
    }

    if (post.platformSpecificContent) {
      // Return the first available platform content
      const values = Object.values(post.platformSpecificContent);
      if (values.length > 0) {
        return values[0];
      }
    }

    return '';
  }
}
