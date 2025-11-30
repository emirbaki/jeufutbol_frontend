import { ChangeDetectorRef, Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PostsService } from '../../services/posts.service';
import { ComponentStateService } from '../../services/component-state.service';

enum PlatformType {
  X = 'X',
  INSTAGRAM = 'INSTAGRAM',
  FACEBOOK = 'FACEBOOK',
  TIKTOK = 'TIKTOK'
}

export interface PlatformConfig {
  type: PlatformType;
  name: string;
  icon: string;
  iconPath: string;
  enabled: boolean;
  maxChars: number;
  maxImages: number;
  supportsVideo: boolean;
  aspectRatios: string[];
}

type MediaType = 'image' | 'video' | 'both';

@Component({
  selector: 'app-post-composer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './post-composer.component.html',
})
export class PostComposerComponent implements OnInit, OnDestroy {
  // Content signals
  content = signal('');
  mediaFiles = signal<File[]>([]);
  mediaUrls = signal<string[]>([]);
  selectedMediaType = signal<MediaType>('both');

  // Edit Mode Signals
  postId = signal<string | null>(null);
  isEditing = computed(() => !!this.postId());

  // Scheduling signals
  isScheduled = signal(false);
  scheduledDate = signal('');
  scheduledTime = signal('');
  minDateTime = signal('');

  // Platform configuration signal
  platforms = signal<PlatformConfig[]>([
    {
      type: PlatformType.X,
      name: 'X (Twitter)',
      icon: '𝕏',
      iconPath: 'assets/icons/Twitter.png',
      enabled: true,
      maxChars: 280,
      maxImages: 4,
      supportsVideo: true,
      aspectRatios: ['16:9', '1:1']
    },
    {
      type: PlatformType.INSTAGRAM,
      name: 'Instagram',
      icon: '📷',
      iconPath: 'assets/icons/Instagram.png',
      enabled: true,
      maxChars: 2200,
      maxImages: 10,
      supportsVideo: true,
      aspectRatios: ['1:1', '4:5', '16:9']
    },
    {
      type: PlatformType.FACEBOOK,
      name: 'Facebook',
      icon: '👤',
      iconPath: 'assets/icons/facebook.png',
      enabled: false,
      maxChars: 63206,
      maxImages: 50,
      supportsVideo: true,
      aspectRatios: ['16:9', '1:1', '4:5']
    },
    {
      type: PlatformType.TIKTOK,
      name: 'TikTok',
      icon: '🎵',
      iconPath: 'assets/icons/tiktok.png',
      enabled: false,
      maxChars: 2200,
      maxImages: 35,
      supportsVideo: true,
      aspectRatios: ['9:16']
    },
  ]);

  // UI state signals
  selectedPreview = signal<PlatformType>(PlatformType.X);
  isPublishing = signal(false);
  publishSuccess = signal(false);
  isDragging = signal(false);

  // Computed signals
  enabledPlatforms = computed(() =>
    this.platforms().filter(p => p.enabled)
  );

  minMaxChars = computed(() => {
    const enabled = this.enabledPlatforms();
    if (enabled.length === 0) return { min: 0, max: 0 };
    const maxChars = Math.min(...enabled.map(p => p.maxChars));
    return { min: 0, max: maxChars };
  });

  characterCount = computed(() => this.content().length);

  characterPercentage = computed(() => {
    const { max } = this.minMaxChars();
    if (max === 0) return 0;
    return (this.characterCount() / max) * 100;
  });

  characterColor = computed(() => {
    const percentage = this.characterPercentage();
    if (percentage > 90) return 'text-red-600';
    if (percentage > 75) return 'text-yellow-600';
    return 'text-gray-600';
  });

  isOverLimit = computed(() => {
    const { max } = this.minMaxChars();
    return this.content().length > max;
  });

  maxMediaFiles = computed(() => {
    const enabled = this.enabledPlatforms();
    if (enabled.length === 0) return 50;

    const hasTikTok = enabled.some(p => p.type === PlatformType.TIKTOK);

    if (hasTikTok) {
      const hasVideo = this.mediaFiles().some(f => f.type.startsWith('video/'));
      return hasVideo ? 1 : 35;
    }

    const maxImages = Math.min(...enabled.map(p => p.maxImages));
    return maxImages;
  });

  acceptedFileTypes = computed(() => {
    switch (this.selectedMediaType()) {
      case 'image':
        return 'image/*';
      case 'video':
        return 'video/*';
      case 'both':
      default:
        return 'image/*,video/*';
    }
  });

  mediaTypeLabel = computed(() => {
    switch (this.selectedMediaType()) {
      case 'image':
        return 'Images Only';
      case 'video':
        return 'Videos Only';
      case 'both':
      default:
        return 'Images & Videos';
    }
  });

  totalSize = computed(() =>
    (this.mediaFiles().reduce((sum, f) => sum + f.size, 0) / 1024 / 1024).toFixed(2)
  );

  scheduledDateTime = computed(() => {
    if (!this.isScheduled() || !this.scheduledDate() || !this.scheduledTime()) {
      return undefined;
    }
    return new Date(`${this.scheduledDate()}T${this.scheduledTime()}`);
  });

  isValidScheduledTime = computed(() => {
    if (!this.isScheduled()) return true;

    const scheduled = this.scheduledDateTime();
    if (!scheduled) return false;

    const now = new Date();
    const minFutureTime = new Date(now.getTime() + 5 * 60 * 1000);

    return scheduled >= minFutureTime;
  });

  scheduledTimeDisplay = computed(() => {
    const datetime = this.scheduledDateTime();
    if (!datetime) return '';

    const now = new Date();
    const diff = datetime.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours < 1) {
      return `in ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else if (hours < 24) {
      return `in ${hours} hour${hours !== 1 ? 's' : ''} ${minutes} min`;
    } else {
      const days = Math.floor(hours / 24);
      return `in ${days} day${days !== 1 ? 's' : ''}`;
    }
  });

  publishButtonText = computed(() => {
    if (this.isPublishing()) {
      return 'Processing...';
    }
    if (this.isEditing()) {
      return this.isScheduled() ? 'Update Schedule' : 'Update Post';
    }
    return this.isScheduled() ? 'Schedule Post' : 'Publish Now';
  });

  canPublish = computed(() =>
    !this.isPublishing() &&
    !this.isOverLimit() &&
    this.enabledPlatforms().length > 0 &&
    this.content().trim().length > 0 &&
    (!this.isScheduled() || this.isValidScheduledTime())
  );

  constructor(
    private postsService: PostsService,
    private cdr: ChangeDetectorRef,
    private componentStateService: ComponentStateService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnDestroy(): void {
    this.componentStateService.saveComposerState({
      content: this.content(),
      scheduledDate: this.scheduledDate(),
      scheduledTime: this.scheduledTime(),
      isScheduled: this.isScheduled(),
      selectedMediaType: this.selectedMediaType(),
      mediaFiles: this.mediaFiles(),
      mediaUrls: this.mediaUrls(),
      platforms: this.platforms()
    });
  }

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.postId.set(id);
      await this.loadPost(id);
    } else {
      const state = this.componentStateService.getComposerState();
      if (state) {
        this.content.set(state.content);
        this.scheduledDate.set(state.scheduledDate);
        this.scheduledTime.set(state.scheduledTime);
        this.isScheduled.set(state.isScheduled);
        this.selectedMediaType.set(state.selectedMediaType);
        this.mediaFiles.set(state.mediaFiles);
        this.mediaUrls.set(state.mediaUrls);
        this.platforms.set(state.platforms);
      }
      this.setMinDateTime();
    }
  }

  async loadPost(id: string): Promise<void> {
    try {
      const post = await this.postsService.getPost(id);
      this.content.set(post.content);
      this.mediaUrls.set(post.mediaUrls || []);

      if (post.targetPlatforms) {
        this.platforms.update(platforms =>
          platforms.map(p => ({
            ...p,
            enabled: post.targetPlatforms.includes(p.type)
          }))
        );
      }

      if (post.scheduledFor) {
        this.isScheduled.set(true);
        const date = new Date(post.scheduledFor);
        this.scheduledDate.set(date.toISOString().split('T')[0]);
        this.scheduledTime.set(date.toTimeString().substring(0, 5));
      }
    } catch (error) {
      console.error('Error loading post:', error);
      this.router.navigate(['/composer']);
    }
  }

  setMinDateTime(): void {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);

    this.minDateTime.set(now.toISOString()); // e.g. "2025-11-15T15:05:00.000Z"

    const scheduled = new Date(now);
    scheduled.setHours(scheduled.getHours() + 1);

    this.scheduledDate.set(scheduled.toISOString().split('T')[0]); // "2025-11-15"
    this.scheduledTime.set(scheduled.toISOString().split('T')[1].substring(0, 5)); // "16:05"
  }

  toggleScheduling(): void {
    this.isScheduled.update(val => !val);
    if (this.isScheduled()) {
      this.setMinDateTime();
    }
  }

  togglePlatform(platform: PlatformConfig): void {
    this.platforms.update(platforms =>
      platforms.map(p =>
        p.type === platform.type ? { ...p, enabled: !p.enabled } : p
      )
    );
    this.updateMediaTypeRestrictions();
  }

  updateMediaTypeRestrictions(): void {
    const enabled = this.enabledPlatforms();
    const onlyTikTok = enabled.length === 1 && enabled[0].type === PlatformType.TIKTOK;

    if (onlyTikTok) {
      this.selectedMediaType.set('both');
    }
  }

  setMediaType(type: MediaType): void {
    this.selectedMediaType.set(type);
  }

  async onFileSelect(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    await this.processFiles(Array.from(input.files));
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  async onDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    if (event.dataTransfer?.files) {
      await this.processFiles(Array.from(event.dataTransfer.files));
    }
  }

  async processFiles(files: File[]): Promise<void> {
    const newFiles: File[] = [];
    const newUrls: string[] = [];

    for (const file of files) {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');

      if (this.selectedMediaType() === 'image' && !isImage) {
        alert(`${file.name} is not an image. Please select images only.`);
        continue;
      }
      if (this.selectedMediaType() === 'video' && !isVideo) {
        alert(`${file.name} is not a video. Please select videos only.`);
        continue;
      }

      newFiles.push(file);
      newUrls.push(URL.createObjectURL(file));
    }

    this.mediaFiles.update(current => [...current, ...newFiles]);
    this.mediaUrls.update(current => [...current, ...newUrls]);

    const maxFiles = this.maxMediaFiles();
    if (this.mediaFiles().length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed for selected platforms`);

      while (this.mediaFiles().length > maxFiles) {
        const urls = this.mediaUrls();
        const removedUrl = urls[urls.length - 1];
        if (removedUrl) URL.revokeObjectURL(removedUrl);

        this.mediaFiles.update(files => files.slice(0, -1));
        this.mediaUrls.update(urls => urls.slice(0, -1));
      }
    }

    this.cdr.detectChanges();
  }

  removeMedia(index: number): void {
    const urls = this.mediaUrls();
    URL.revokeObjectURL(urls[index]);

    this.mediaFiles.update(files => files.filter((_, i) => i !== index));
    this.mediaUrls.update(urls => urls.filter((_, i) => i !== index));
  }

  isVideo(url: string): boolean {
    const index = this.mediaUrls().indexOf(url);
    if (index === -1) return false;
    return this.mediaFiles()[index]?.type.startsWith('video/') || false;
  }

  getPreviewContent(platform: PlatformType): string {
    const config = this.platforms().find(p => p.type === platform);
    if (!config) return this.content();

    const content = this.content();
    if (content.length > config.maxChars) {
      return content.substring(0, config.maxChars - 3) + '...';
    }
    return content;
  }

  async publish(): Promise<void> {
    if (!this.canPublish()) return;

    const hasTikTok = this.enabledPlatforms().some(p => p.type === PlatformType.TIKTOK);
    if (hasTikTok && this.mediaFiles().length === 0) {
      alert('TikTok requires at least one image or video');
      return;
    }

    this.isPublishing.set(true);

    try {
      const targetPlatforms = this.enabledPlatforms().map(p => p.type);

      let uploadedUrls: string[] = [];
      if (this.mediaFiles().length > 0) {
        uploadedUrls = await this.postsService.uploadMedia(this.mediaFiles());
        console.log('Uploaded media URLs:', uploadedUrls);
      }

      const scheduledFor = this.scheduledDateTime();
      const postData = {
        content: this.content(),
        mediaUrls: uploadedUrls.length > 0 ? uploadedUrls : this.mediaUrls(),
        targetPlatforms: this.enabledPlatforms().map(p => p.type),
        platformSpecificContent: {},
        scheduledFor: scheduledFor?.toISOString()
      };

      if (this.isEditing()) {
        await this.postsService.updatePost(this.postId()!, postData);
        alert('Post updated successfully!');
        this.router.navigate(['/posts']);
      } else {
        await this.postsService.createPost(postData);
        this.publishSuccess.set(true);
        this.cdr.detectChanges();
        this.resetForm();

        setTimeout(() => {
          this.publishSuccess.set(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Error publishing post:', error);
      alert('Failed to process post. Please try again.');
    } finally {
      this.isPublishing.set(false);
    }
  }

  resetForm(): void {
    this.content.set('');
    this.mediaUrls().forEach(url => URL.revokeObjectURL(url));
    this.mediaFiles.set([]);
    this.mediaUrls.set([]);
    this.selectedMediaType.set('both');
    this.isScheduled.set(false);
    this.setMinDateTime();
  }

  getProgressGradient(): string {
    const p = this.characterPercentage();

    // Normalize to 0–1
    const t = p / 100;

    // Interpolate in two phases:
    // 0–0.75 = Green → Yellow
    // 0.75–1 = Yellow → Red

    let r, g, b;

    if (t <= 0.75) {
      const k = t / 0.75;
      // green (#00D100) → yellow (#EAB308)
      r = Math.round(0 + (234 - 0) * k);
      g = Math.round(209 + (179 - 209) * k); // D1 → B3
      b = Math.round(0 + (8 - 0) * k);
    } else {
      const k = (t - 0.75) / 0.25;
      // yellow (#EAB308) → red (#EF4444)
      r = Math.round(234 + (239 - 234) * k);
      g = Math.round(179 + (68 - 179) * k);
      b = Math.round(8 + (68 - 8) * k);
    }

    const color = `rgb(${r}, ${g}, ${b})`;
    return `linear-gradient(to right, ${color}, ${color})`;
  }
  getGreenOpacity() {
    const p = this.characterPercentage();
    if (p <= 75) return 1;
    if (p >= 90) return 0;

    const t = (p - 75) / 15;
    return 1 - this.smoothstep(t);
  }



  getYellowOpacity() {
    const p = this.characterPercentage();

    // Before 75: doesn't exist
    if (p <= 75) return 0;

    // 75 → 90 (fade in)
    if (p <= 90) {
      const t = (p - 75) / 15;
      return this.smoothstep(t);
    }

    // 90 → 100 (fade out into red)
    const t = (p - 90) / 10;
    return 1 - this.smoothstep(t);
  }

  getRedOpacity() {
    const p = this.characterPercentage();
    if (p <= 90) return 0;

    const t = (p - 90) / 10;
    return this.smoothstep(t);
  }


  smoothstep(t: number) {
    t = Math.min(1, Math.max(0, t));
    return t * t * (3 - 2 * t);
  }


}