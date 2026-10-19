import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PostsService, Post, PostListFilterInput, PostStatusCounts } from '../../../services/posts.service';
import { Subscription } from 'rxjs';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  matEditRound, matPersonRound, matDateRangeRound,
  matDeleteRound, matSendRound, matScheduleRound,
  matSettingsRound, matPageviewRound, matHourglassTopRound,
  matRestartAltRound, matErrorOutlineRound
} from '@ng-icons/material-icons/round';

type SortOption = 'newest' | 'oldest';
type TimeFilter = 'all' | 'today' | 'week' | 'month';

@Component({
  selector: 'app-posts-list',
  standalone: true,
  imports: [CommonModule, RouterLink, NgIcon, NgOptimizedImage, FormsModule],
  templateUrl: './post-list.component.html',
  providers: [provideIcons({ matEditRound, matPersonRound, matDateRangeRound, matDeleteRound, matSendRound, matScheduleRound, matSettingsRound, matPageviewRound, matHourglassTopRound, matRestartAltRound, matErrorOutlineRound })],
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
  loadingMore = signal(false);
  total = signal(0);
  counts = signal<PostStatusCounts>({ all: 0, published: 0, scheduled: 0, draft: 0, failed: 0 });
  hasMore = computed(() => this.posts().length < this.total());
  readonly pageSize = 20;
  publishingPostIds = signal<Set<string>>(new Set());

  availablePlatforms = computed(() => ['ALL', 'x', 'instagram', 'facebook', 'tiktok', 'youtube']);

  // The server filters and sorts. The list shows the loaded pages as they are.
  filteredPosts = computed<Post[]>(() => this.posts());

  filters = computed<{ value: string, label: string, count: number }[]>(() => {
    const c = this.counts();
    return [
      { value: 'ALL', label: 'All Posts', count: c.all },
      { value: 'PUBLISHED', label: 'Published', count: c.published },
      { value: 'SCHEDULED', label: 'Scheduled', count: c.scheduled },
      { value: 'DRAFT', label: 'Drafts', count: c.draft },
      { value: 'FAILED', label: 'Failed', count: c.failed }
    ];
  });

  private updatesSubscription: Subscription | null = null;
  // A newer load makes the answer of an older load obsolete.
  private loadSeq = 0;

  constructor(private postsService: PostsService) { }

  ngOnInit(): void {
    this.reload();

    // Subscribe to real-time updates
    this.updatesSubscription = this.postsService.subscribeToPostUpdates().subscribe({
      next: (updatedPost) => {
        // Update the post in the local list
        const currentPosts = this.posts();
        const index = currentPosts.findIndex(p => p.id === updatedPost.id);
        if (index !== -1) {
          const newPosts = [...currentPosts];
          newPosts[index] = updatedPost;
          this.posts.set(newPosts);
        }
      },
      error: (err) => console.error('Subscription error:', err)
    });
  }

  ngOnDestroy(): void {
    if (this.updatesSubscription) {
      this.updatesSubscription.unsubscribe();
    }
  }

  /** The UI filters as the server filter. */
  private buildFilter(offset: number): PostListFilterInput {
    const filter: PostListFilterInput = {
      sort: this.selectedSort() === 'oldest' ? 'OLDEST' : 'NEWEST',
      limit: this.pageSize,
      offset,
    };
    const status = this.selectedFilter();
    if (status !== 'ALL') filter.status = status;
    const platform = this.selectedPlatform();
    if (platform !== 'ALL') filter.platform = platform;
    const from = this.timeFilterStart(this.selectedTimeFilter());
    if (from) filter.from = from.toISOString();
    return filter;
  }

  private timeFilterStart(time: TimeFilter): Date | null {
    const now = new Date();
    switch (time) {
      case 'today':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      default:
        return null;
    }
  }

  /** Loads page 1 and the counts for the current filters. */
  async reload(): Promise<void> {
    const seq = ++this.loadSeq;
    this.loading.set(true);
    try {
      const filter = this.buildFilter(0);
      const [page, counts] = await Promise.all([
        this.postsService.listPosts(filter),
        this.postsService.statusCounts(filter),
      ]);
      if (seq !== this.loadSeq) return;
      this.posts.set(page.items);
      this.total.set(page.total);
      this.counts.set(counts);
    } catch (err) {
      console.error('Error loading posts:', err);
    } finally {
      if (seq === this.loadSeq) this.loading.set(false);
    }
  }

  applyFilter(filter: string): void {
    this.selectedFilter.set(filter as any);
    this.reload();
  }

  applyPlatformFilter(platform: string): void {
    this.selectedPlatform.set(platform);
    this.reload();
  }

  applySort(sort: SortOption): void {
    this.selectedSort.set(sort);
    this.reload();
  }

  applyTimeFilter(time: TimeFilter): void {
    this.selectedTimeFilter.set(time);
    this.reload();
  }

  clearAllFilters(): void {
    this.selectedFilter.set('ALL');
    this.selectedPlatform.set('ALL');
    this.selectedSort.set('newest');
    this.selectedTimeFilter.set('all');
    this.reload();
  }

  async deletePost(post: Post, event: Event): Promise<void> {
    event.stopPropagation();
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      await this.postsService.deletePost(post.id);
      await this.reload();
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
      await this.reload();
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
    // 1. First try general content
    if (post.content && post.content.trim()) {
      return post.content.trim();
    }

    // 2. If targeting specific platforms, look for platform-specific content for those platforms
    if (post.targetPlatforms && post.targetPlatforms.length > 0 && post.platformSpecificContent) {
      // Define platform priority (preferred order for display)
      const platformPriority: string[] = ['x', 'instagram', 'facebook', 'tiktok', 'youtube'];

      // First check targeted platforms in priority order
      for (const platform of platformPriority) {
        if (post.targetPlatforms.includes(platform) &&
            post.platformSpecificContent[platform] !== undefined &&
            post.platformSpecificContent[platform] !== null &&
            String(post.platformSpecificContent[platform]).trim() !== '') {
          return String(post.platformSpecificContent[platform]).trim();
        }
      }

      // If no priority match, check all targeted platforms in order
      for (const platform of post.targetPlatforms) {
        if (post.platformSpecificContent[platform] !== undefined &&
            post.platformSpecificContent[platform] !== null &&
            String(post.platformSpecificContent[platform]).trim() !== '') {
          return String(post.platformSpecificContent[platform]).trim();
        }
      }
    }

    // 3. Fallback: return any available platform-specific content
    if (post.platformSpecificContent) {
      const values = Object.values(post.platformSpecificContent);
      for (const value of values) {
        if (value !== undefined && value !== null && String(value).trim() !== '') {
          return String(value).trim();
        }
      }
    }

    return '';
  }

  async loadMore(): Promise<void> {
    if (this.loadingMore() || !this.hasMore()) return;

    this.loadingMore.set(true);
    const seq = this.loadSeq;
    try {
      const page = await this.postsService.listPosts(this.buildFilter(this.posts().length));
      if (seq !== this.loadSeq) return;
      this.posts.update(posts => [...posts, ...page.items]);
      this.total.set(page.total);
    } catch (error) {
      console.error('Error loading more posts:', error);
    } finally {
      this.loadingMore.set(false);
    }
  }
}
