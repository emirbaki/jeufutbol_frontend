import { Component, OnInit, effect, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PostsService, Post } from '../../../services/posts.service';

@Component({
  selector: 'app-posts-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './post-list.component.html',
})
export class PostsListComponent implements OnInit {
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

  constructor(private postsService: PostsService) {

    effect(() => {
      console.log(`The count is: ${this.filters().map(f => `${f.label}: ${f.count}`).join(', ')}`);
    });
  }

  ngOnInit(): void {
    this.postsService.watchPosts(100).subscribe({
      next: posts => {
        this.posts.set(posts);
        this.loading.set(false);
      },
      error: err => {
        console.error('Error loading posts:', err);
        this.loading.set(false);
      }
    });
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
    const colors: Record<string, string> = {
      published: 'bg-success-100 text-success-800',
      scheduled: 'bg-info-100 text-info-800',
      draft: 'bg-neutral-100 text-neutral-800',
      failed: 'bg-error-100 text-error-800'
    };
    return colors[status] || 'bg-neutral-100 text-neutral-800';
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
