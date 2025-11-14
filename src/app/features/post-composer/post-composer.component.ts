import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PostsService } from '../../services/posts.service';
import { PlatformType } from '../../models/platform.model';

interface PlatformConfig {
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
export class PostComposerComponent implements OnInit {
  content = '';
  mediaFiles: File[] = [];
  mediaUrls: string[] = [];
  selectedMediaType: MediaType = 'both'; // Default allows both
  
  platforms: PlatformConfig[] = [
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
      maxImages: 0,
      supportsVideo: true,
      aspectRatios: ['9:16']
    },
  ];

  selectedPreview: PlatformType = PlatformType.X;
  isPublishing = false;
  publishSuccess = false;

  constructor(private postsService: PostsService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {}

  togglePlatform(platform: PlatformConfig): void {
    platform.enabled = !platform.enabled;
    
    // Auto-adjust media type based on enabled platforms
    this.updateMediaTypeRestrictions();
  }

  /**
   * Update media type restrictions based on selected platforms
   */
  updateMediaTypeRestrictions(): void {
    const enabledPlatforms = this.getEnabledPlatforms();
    
    // Check if TikTok is the only enabled platform
    const onlyTikTok = enabledPlatforms.length === 1 && 
                       enabledPlatforms[0].type === PlatformType.TIKTOK;
    
    if (onlyTikTok) {
      // TikTok requires video OR photos (max 35)
      this.selectedMediaType = 'both';
    }
  }

  getEnabledPlatforms(): PlatformConfig[] {
    return this.platforms.filter(p => p.enabled);
  }

  getMinMaxChars(): { min: number; max: number } {
    const enabled = this.getEnabledPlatforms();
    if (enabled.length === 0) return { min: 0, max: 0 };
    
    const maxChars = Math.min(...enabled.map(p => p.maxChars));
    return { min: 0, max: maxChars };
  }

  getCharacterCount(): number {
    return this.content.length;
  }

  getCharacterPercentage(): number {
    const { max } = this.getMinMaxChars();
    if (max === 0) return 0;
    return (this.content.length / max) * 100;
  }

  getCharacterColor(): string {
    const percentage = this.getCharacterPercentage();
    if (percentage > 90) return 'text-red-600';
    if (percentage > 75) return 'text-yellow-600';
    return 'text-gray-600';
  }

  isOverLimit(): boolean {
    const { max } = this.getMinMaxChars();
    return this.content.length > max;
  }

  /**
   * Set media type filter
   */
  setMediaType(type: MediaType): void {
    this.selectedMediaType = type;
  }

  /**
   * Get accepted file types based on selected media type
   */
  getAcceptedFileTypes(): string {
    switch (this.selectedMediaType) {
      case 'image':
        return 'image/*';
      case 'video':
        return 'video/*';
      case 'both':
      default:
        return 'image/*,video/*';
    }
  }

  /**
   * Get media type label for UI
   */
  getMediaTypeLabel(): string {
    switch (this.selectedMediaType) {
      case 'image':
        return 'Images Only';
      case 'video':
        return 'Videos Only';
      case 'both':
      default:
        return 'Images & Videos';
    }
  }

  async onFileSelect(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    const files = Array.from(input.files);
    
    // Validate file types
    for (const file of files) {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');

      // Check if file matches selected media type
      if (this.selectedMediaType === 'image' && !isImage) {
        alert(`${file.name} is not an image. Please select images only.`);
        continue;
      }
      if (this.selectedMediaType === 'video' && !isVideo) {
        alert(`${file.name} is not a video. Please select videos only.`);
        continue;
      }

      // Add valid files
      this.mediaFiles.push(file);
      const url = URL.createObjectURL(file);
      this.mediaUrls.push(url);
    }

    // Check platform-specific limits
    const maxFiles = this.getMaxMediaFiles();
    if (this.mediaFiles.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed for selected platforms`);
      // Remove excess files
      while (this.mediaFiles.length > maxFiles) {
        const removed = this.mediaFiles.pop();
        const removedUrl = this.mediaUrls.pop();
        if (removedUrl) URL.revokeObjectURL(removedUrl);
      }
    }

    this.cdr.detectChanges();
  }

  getTotalSize(): string {
    return (this.mediaFiles.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024).toFixed(2);
  }

  /**
   * Get maximum allowed media files based on enabled platforms
   */
  getMaxMediaFiles(): number {
    const enabled = this.getEnabledPlatforms();
    if (enabled.length === 0) return 50;

    // Check if TikTok is enabled
    const hasTikTok = enabled.some(p => p.type === PlatformType.TIKTOK);
    
    if (hasTikTok) {
      // TikTok: 1 video OR up to 35 photos
      const hasVideo = this.mediaFiles.some(f => f.type.startsWith('video/'));
      return hasVideo ? 1 : 35;
    }

    // Use minimum max images from enabled platforms
    const maxImages = Math.min(...enabled.map(p => p.maxImages));
    return maxImages;
  }

  removeMedia(index: number): void {
    URL.revokeObjectURL(this.mediaUrls[index]);
    this.mediaFiles.splice(index, 1);
    this.mediaUrls.splice(index, 1);
  }

  /**
   * Check if file is video
   */
  isVideo(url: string): boolean {
    const index = this.mediaUrls.indexOf(url);
    if (index === -1) return false;
    return this.mediaFiles[index]?.type.startsWith('video/') || false;
  }

  getPreviewContent(platform: PlatformType): string {
    const config = this.platforms.find(p => p.type === platform);
    if (!config) return this.content;
    
    if (this.content.length > config.maxChars) {
      return this.content.substring(0, config.maxChars - 3) + '...';
    }
    return this.content;
  }

  async publish(): Promise<void> {
    if (this.isOverLimit() || this.getEnabledPlatforms().length === 0) {
      return;
    }

    // Validate TikTok requirements
    const hasTikTok = this.getEnabledPlatforms().some(p => p.type === PlatformType.TIKTOK);
    if (hasTikTok && this.mediaFiles.length === 0) {
      alert('TikTok requires at least one image or video');
      return;
    }

    this.isPublishing = true;
    try {
      const targetPlatforms = this.getEnabledPlatforms().map(p => p.type);
      
      // Upload media files first if any
      let uploadedUrls: string[] = [];
      if (this.mediaFiles.length > 0) {
        uploadedUrls = await this.postsService.uploadMedia(this.mediaFiles);
        console.log('Uploaded media URLs:', uploadedUrls);
      }

      await this.postsService.createPost({
        content: this.content,
        mediaUrls: uploadedUrls,
        targetPlatforms,
        platformSpecificContent: {}
      });

      this.publishSuccess = true;
      this.cdr.detectChanges();
      this.resetForm();
      
      setTimeout(() => {
        this.publishSuccess = false;
      }, 3000);
    } catch (error) {
      console.error('Error publishing post:', error);
      alert('Failed to publish post. Please try again.');
    } finally {
      this.isPublishing = false;
    }
  }

  resetForm(): void {
    this.content = '';
    this.mediaFiles = [];
    this.mediaUrls.forEach(url => URL.revokeObjectURL(url));
    this.mediaUrls = [];
    this.selectedMediaType = 'both';
  }
}