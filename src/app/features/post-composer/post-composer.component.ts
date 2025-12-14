import { ChangeDetectorRef, Component, OnDestroy, OnInit, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PostsService, TikTokCreatorInfo, TikTokPostSettings, YouTubePostSettings } from '../../services/posts.service';
import { ComponentStateService } from '../../services/component-state.service';
import { PlatformType } from '../../models/platform.model';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  matCloudUploadRound, matRocketLaunchRound, matDateRangeRound,
  matAutoAwesomeRound, matMobileScreenShareRound, matDeleteRound,
  matArrowBackRound
} from '@ng-icons/material-icons/round';
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
  imports: [CommonModule, FormsModule, NgIcon, NgOptimizedImage],
  templateUrl: './post-composer.component.html',
  providers: [provideIcons({ matCloudUploadRound, matRocketLaunchRound, matDateRangeRound, matAutoAwesomeRound, matMobileScreenShareRound, matDeleteRound, matArrowBackRound })],
  changeDetection: ChangeDetectionStrategy.OnPush
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
    {
      type: PlatformType.YOUTUBE,
      name: 'YouTube',
      icon: '▶️',
      iconPath: 'assets/icons/youtube_v2.png',
      enabled: false,
      maxChars: 5000,  // Description max
      maxImages: 0,    // YouTube only supports video
      supportsVideo: true,
      aspectRatios: ['16:9', '9:16']  // Regular and Shorts
    },
  ]);

  // Platform specific content
  usePlatformSpecificCaptions = signal(false);
  platformContents = signal<Record<string, string>>({});

  // UI state signals
  selectedPreview = signal<PlatformType>(PlatformType.X);
  isPublishing = signal(false);
  publishSuccess = signal(false);
  isDragging = signal(false);
  uploadProgress = signal(0); // Upload progress 0-100

  // TikTok-specific signals (for Content Sharing Guidelines compliance)
  tiktokCreatorInfo = signal<TikTokCreatorInfo | null>(null);
  tiktokLoading = signal(false);
  tiktokSettings = signal<TikTokPostSettings>({
    title: '', // TikTok post title/caption
    privacy_level: '', // No default - user must select
    allow_comment: false, // Off by default per TikTok guidelines
    allow_duet: false,
    allow_stitch: false,
    is_brand_organic: false,
    is_branded_content: false,
    auto_add_music: true, // Default on for photo posts
  });

  musicConfirmationAccepted = signal(false);
  showCommercialDisclosure = signal(false);
  tiktokPublishMessage = signal(''); // Post-publish processing message
  tiktokError = signal<string | null>(null); // Error message when TikTok settings fail to load

  // YouTube-specific signals
  youtubeSettings = signal<YouTubePostSettings>({
    title: '',
    privacy_status: 'public',  // Default to public per user preference
    category_id: '22',         // People & Blogs
    tags: [],
    is_short: false,
    made_for_kids: false,
    notify_subscribers: true,
  });
  youtubeLoading = signal(false);

  // Check if current media selection is photo-only (no videos)
  isPhotoOnlyPost = computed(() => {
    const files = this.mediaFiles();
    if (files.length === 0) return false;
    return files.every(f => f.type.startsWith('image/'));
  });


  // Computed signals
  enabledPlatforms = computed(() =>
    this.platforms().filter(p => p.enabled)
  );

  isTikTokEnabled = computed(() =>
    this.enabledPlatforms().some(p => p.type === PlatformType.TIKTOK)
  );

  isYouTubeEnabled = computed(() =>
    this.enabledPlatforms().some(p => p.type === PlatformType.YOUTUBE)
  );


  minMaxChars = computed(() => {
    const enabled = this.enabledPlatforms();
    if (enabled.length === 0) return { min: 0, max: 0 };

    // If using platform specific captions, we validate each platform individually
    // But for the global indicator, we perhaps show the most restrictive? 
    // Or we handle validation per input field in the template.
    // For now, let's keep the global logic for the main input.
    const maxChars = Math.min(...enabled.map(p => p.maxChars));
    return { min: 0, max: maxChars };
  });

  characterCount = computed(() => this.content().length); // Global content count

  // Helper to get content for a specific platform (or global if not specific)
  // Helper to get content for a specific platform (or global if not specific)
  getPlatformContent(platformType: PlatformType): string {
    if (this.usePlatformSpecificCaptions()) {
      return this.platformContents()[platformType] || '';
    }
    return this.content();
  }

  getPlatformCharacterCount(platformType: PlatformType): number {
    const content = this.getPlatformContent(platformType);
    return content.length;
  }

  isPlatformOverLimit(platformType: PlatformType): boolean {
    const config = this.platforms().find(p => p.type === platformType);
    if (!config) return false;
    const count = this.getPlatformCharacterCount(platformType);
    return count > config.maxChars;
  }

  getPlatformCharacterPercentage(platformType: PlatformType): number {
    const config = this.platforms().find(p => p.type === platformType);
    if (!config || config.maxChars === 0) return 0;
    const count = this.getPlatformCharacterCount(platformType);
    return (count / config.maxChars) * 100;
  }

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
    const hasYouTube = enabled.some(p => p.type === PlatformType.YOUTUBE);

    // YouTube only supports 1 video
    if (hasYouTube) {
      return 1;
    }

    if (hasTikTok) {
      const hasVideo = this.mediaFiles().some(f => f.type.startsWith('video/'));
      return hasVideo ? 1 : 35;
    }

    // Filter out platforms with maxImages = 0 (video-only platforms)
    const imageCapablePlatforms = enabled.filter(p => p.maxImages > 0);
    if (imageCapablePlatforms.length === 0) return 1; // Default to 1 for video-only platforms

    const maxImages = Math.min(...imageCapablePlatforms.map(p => p.maxImages));
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

  canPublish = computed(() => {
    if (this.isPublishing()) return false;
    if (this.enabledPlatforms().length === 0) return false;

    if (this.isScheduled() && !this.isValidScheduledTime()) return false;

    if (this.usePlatformSpecificCaptions()) {
      // Check each enabled platform has valid content length
      return this.enabledPlatforms().every(p => {
        const content = this.platformContents()[p.type] || '';
        return content.trim().length > 0 && content.length <= p.maxChars;
      });
    } else {
      return !this.isOverLimit() && this.content().trim().length > 0;
    }
  });

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
      platforms: this.platforms(),
      usePlatformSpecificCaptions: this.usePlatformSpecificCaptions(),
      platformContents: this.platformContents(),
      editingPostId: this.postId()
    });
  }

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.postId.set(id);
      await this.loadPost(id);
    } else {
      // Check if coming from AI generator
      const fromAI = this.route.snapshot.queryParamMap.get('fromAI');
      const platform = this.route.snapshot.queryParamMap.get('platform');

      const state = this.componentStateService.getComposerState();
      if (state) {
        this.content.set(state.content);
        this.scheduledDate.set(state.scheduledDate);
        this.scheduledTime.set(state.scheduledTime);
        this.isScheduled.set(state.isScheduled);
        this.selectedMediaType.set(state.selectedMediaType);
        this.mediaFiles.set(state.mediaFiles);
        this.mediaUrls.set(state.mediaUrls);

        // Only restore platforms if not empty (don't override defaults)
        if (state.platforms && state.platforms.length > 0) {
          this.platforms.set(state.platforms);
        } else if (fromAI) {
          // Check if we have platform contents keys to enable multiple platforms
          if (state.platformContents && Object.keys(state.platformContents).length > 0) {
            const enabledTypes = Object.keys(state.platformContents);
            this.platforms.update(platforms =>
              platforms.map(p => ({
                ...p,
                enabled: enabledTypes.includes(p.type)
              }))
            );
          } else if (platform) {
            // Coming from AI generator with single platform query param
            const platformMap: Record<string, PlatformType> = {
              'twitter': PlatformType.X,
              'instagram': PlatformType.INSTAGRAM,
              'facebook': PlatformType.FACEBOOK,
              'tiktok': PlatformType.TIKTOK
            };
            const targetPlatform = platformMap[platform.toLowerCase()];
            if (targetPlatform) {
              this.platforms.update(platforms =>
                platforms.map(p => ({
                  ...p,
                  enabled: p.type === targetPlatform
                }))
              );
            }
          }
        }

        // Restore platform specific content
        if (state.usePlatformSpecificCaptions) {
          this.usePlatformSpecificCaptions.set(true);
          this.platformContents.set(state.platformContents || {});
        }

        // Restore editing post ID if we are returning to the composer
        // and we have a saved ID (meaning we were editing)
        if (state.editingPostId) {
          this.postId.set(state.editingPostId);
        }

        // Clear the state after loading to prevent stale data
        if (fromAI) {
          this.componentStateService.clearComposerState();
        }
      }
      this.setMinDateTime();
    }
  }

  goBack(): void {
    // Clear the form and state before navigating back
    this.resetForm();
    this.componentStateService.clearComposerState();

    // Navigate back to posts list or previous location
    this.router.navigate(['/posts']);
  }

  async loadPost(id: string): Promise<void> {
    try {
      const post = await this.postsService.getPost(id);
      this.content.set(post.content);
      this.mediaUrls.set(post.mediaUrls || []);

      if (post.targetPlatforms) {
        const targetPlatforms = post.targetPlatforms.map(p => p.toLowerCase());
        this.platforms.update(platforms =>
          platforms.map(p => ({
            ...p,
            enabled: targetPlatforms.includes(p.type)
          }))
        );
      }

      // Load platform specific content
      if (post.platformSpecificContent && Object.keys(post.platformSpecificContent).length > 0) {
        this.usePlatformSpecificCaptions.set(true);
        // Ensure all values are strings
        const contents: Record<string, string> = {};
        Object.entries(post.platformSpecificContent).forEach(([key, value]) => {
          contents[key] = String(value);
        });
        this.platformContents.set(contents);
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

    // Fetch TikTok creator info when TikTok is enabled
    if (platform.type === PlatformType.TIKTOK && !platform.enabled) {
      this.loadTikTokCreatorInfo();
    }
  }

  /**
   * Load TikTok creator info for Content Sharing Guidelines compliance
   * Called when TikTok platform is enabled
   */
  async loadTikTokCreatorInfo(): Promise<void> {
    try {
      this.tiktokLoading.set(true);
      this.tiktokError.set(null); // Reset error on retry
      const creatorInfo = await this.postsService.getTikTokCreatorInfo();
      this.tiktokCreatorInfo.set(creatorInfo);

      // Reset settings when loading new creator info
      this.tiktokSettings.set({
        title: '', // TikTok post title
        privacy_level: '', // No default - user must select
        allow_comment: false,
        allow_duet: false,
        allow_stitch: false,
        is_brand_organic: false,
        is_branded_content: false,
        auto_add_music: true, // Default on for photo posts
      });

      this.musicConfirmationAccepted.set(false);
      this.showCommercialDisclosure.set(false); // Reset commercial disclosure toggle

    } catch (error) {
      console.error('Failed to load TikTok creator info:', error);
      this.tiktokCreatorInfo.set(null);
      this.tiktokError.set('TikTok credentials may have expired. Please reconnect your account.');
    } finally {
      this.tiktokLoading.set(false);
    }
  }

  updateMediaTypeRestrictions(): void {
    const enabled = this.enabledPlatforms();
    const onlyTikTok = enabled.length === 1 && enabled[0].type === PlatformType.TIKTOK;

    if (onlyTikTok) {
      this.selectedMediaType.set('both');
    }
  }

  /**
   * Navigate to settings page integrations section for managing OAuth connections
   */
  navigateToIntegrations(): void {
    this.router.navigate(['/settings'], { fragment: 'integrations' });
  }

  /**
   * Helper method to update TikTok settings from template
   * Angular templates don't support arrow functions, so we use this method
   */
  updateTikTokSetting(key: keyof TikTokPostSettings, value: any): void {
    this.tiktokSettings.update(settings => ({
      ...settings,
      [key]: value
    }));
  }

  /**
   * Helper method to update YouTube settings from template
   */
  updateYouTubeSetting(key: keyof YouTubePostSettings, value: any): void {
    this.youtubeSettings.update(settings => ({
      ...settings,
      [key]: value
    }));
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

    // File size limits (matching backend)
    const MAX_IMAGE_SIZE = 8 * 1024 * 1024; // 8MB
    const MAX_VIDEO_SIZE = 300 * 1024 * 1024; // 300MB

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

      // File size validation
      const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
      const maxSizeMB = maxSize / (1024 * 1024);
      if (file.size > maxSize) {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        alert(`${file.name} is too large (${fileSizeMB}MB). Maximum size is ${maxSizeMB}MB for ${isVideo ? 'videos' : 'images'}.`);
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

  togglePlatformSpecificCaptions(): void {
    const newValue = !this.usePlatformSpecificCaptions();
    this.usePlatformSpecificCaptions.set(newValue);

    if (newValue) {
      // Initialize platform contents with global content
      const currentContent = this.content();
      const newContents: Record<string, string> = {};
      this.platforms().forEach(p => {
        newContents[p.type] = currentContent;
      });
      this.platformContents.set(newContents);
    }
  }

  updatePlatformContent(platformType: PlatformType, value: string): void {
    this.platformContents.update(contents => ({
      ...contents,
      [platformType]: value
    }));
  }

  getPreviewContent(platform: PlatformType): string {
    const config = this.platforms().find(p => p.type === platform);
    // If logic: check platform specific first, else global
    let content = this.usePlatformSpecificCaptions()
      ? (this.platformContents()[platform] || '')
      : this.content();

    if (!config) return content;

    if (content.length > config.maxChars) {
      return content.substring(0, config.maxChars - 3) + '...';
    }
    return content;
  }

  async publish(): Promise<void> {
    // Prevent double-clicks - immediately set publishing state
    if (this.isPublishing()) return;
    this.isPublishing.set(true);

    if (!this.canPublish()) {
      this.isPublishing.set(false);
      return;
    }

    const hasTikTok = this.enabledPlatforms().some(p => p.type === PlatformType.TIKTOK);

    // Validate TikTok-specific requirements
    if (hasTikTok) {
      if (this.mediaFiles().length === 0) {
        alert('TikTok requires at least one image or video');
        return;
      }
      const settings = this.tiktokSettings();
      const creatorInfo = this.tiktokCreatorInfo();

      // Title required
      if (!settings.title?.trim()) {
        alert('Please enter a title for your TikTok post');
        return;
      }

      // Privacy level required (no default)
      if (!settings.privacy_level) {
        alert('Please select a privacy level for TikTok');
        return;
      }

      // Branded content can't be private
      if (settings.is_branded_content && settings.privacy_level === 'SELF_ONLY') {
        alert('Branded content visibility cannot be set to private. Please select Public or Friends.');
        return;
      }

      // Commercial disclosure requires at least one option selected
      if (this.showCommercialDisclosure() && !settings.is_brand_organic && !settings.is_branded_content) {
        alert('When promoting a brand/product, you must select either "Your brand" or "Branded content" (or both)');
        return;
      }

      // Music confirmation required
      if (!this.musicConfirmationAccepted()) {
        alert('Please accept the Music Usage Confirmation for TikTok');
        return;
      }

      // Video duration validation (if a video is selected)
      if (creatorInfo) {
        const videoFile = this.mediaFiles().find(f => f.type.startsWith('video/'));
        if (videoFile) {
          // Note: Actual duration check would require reading video metadata
          // For now we just show a warning in the UI with max duration
          console.log(`Max video duration for this creator: ${creatorInfo.max_video_post_duration_sec}s`);
        }
      }
    }

    this.uploadProgress.set(0);

    try {
      const targetPlatforms = this.enabledPlatforms().map(p => p.type);

      let uploadedUrls: string[] = [];
      if (this.mediaFiles().length > 0) {
        uploadedUrls = await this.postsService.uploadMedia(
          this.mediaFiles(),
          (percent) => this.uploadProgress.set(percent)
        );
        console.log('Uploaded media URLs:', uploadedUrls);
      }

      const scheduledFor = this.scheduledDateTime();
      const postData: any = {
        content: this.usePlatformSpecificCaptions() ? '' : this.content(),
        mediaUrls: uploadedUrls.length > 0 ? uploadedUrls : this.mediaUrls(),
        targetPlatforms: this.enabledPlatforms().map(p => p.type),
        platformSpecificContent: this.usePlatformSpecificCaptions() ? this.platformContents() : {},
        scheduledFor: scheduledFor?.toISOString()
      };

      // Include TikTok settings if TikTok is enabled
      if (hasTikTok) {
        postData.tiktokSettings = this.tiktokSettings();
      }

      // Include YouTube settings if YouTube is enabled
      const hasYouTube = this.enabledPlatforms().some(p => p.type === PlatformType.YOUTUBE);
      if (hasYouTube) {
        postData.youtubeSettings = this.youtubeSettings();
      }

      if (this.isEditing()) {
        await this.postsService.updatePost(this.postId()!, postData);
        alert('Post updated successfully!');
        this.resetForm();
        this.componentStateService.clearComposerState();
        this.router.navigate(['/posts']);
      } else {
        await this.postsService.createPost(postData);
        this.publishSuccess.set(true);
        this.cdr.detectChanges();
        this.componentStateService.clearComposerState();
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
    this.postId.set(null);
    this.content.set('');
    this.mediaUrls().forEach(url => URL.revokeObjectURL(url));
    this.mediaFiles.set([]);
    this.mediaUrls.set([]);
    this.usePlatformSpecificCaptions.set(false);
    this.platformContents.set({});
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
  getGreenOpacity(percentage: number | null = null) {
    const p = percentage !== null ? percentage : this.characterPercentage();
    if (p <= 75) return 1;
    if (p >= 90) return 0;

    const t = (p - 75) / 15;
    return 1 - this.smoothstep(t);
  }



  getYellowOpacity(percentage: number | null = null) {
    const p = percentage !== null ? percentage : this.characterPercentage();

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

  getRedOpacity(percentage: number | null = null) {
    const p = percentage !== null ? percentage : this.characterPercentage();
    if (p <= 90) return 0;

    const t = (p - 90) / 10;
    return this.smoothstep(t);
  }


  smoothstep(t: number) {
    t = Math.min(1, Math.max(0, t));
    return t * t * (3 - 2 * t);
  }


}