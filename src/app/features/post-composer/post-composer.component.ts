import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PostsService } from '../..//services/posts.service';
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
    {
      type: PlatformType.YOUTUBE,
      name: 'YouTube',
      icon: '▶️',
      iconPath: 'assets/icons/Twitter.png',
      enabled: false,
      maxChars: 5000,
      maxImages: 1,
      supportsVideo: true,
      aspectRatios: ['16:9']
    }
  ];

  selectedPreview: PlatformType = PlatformType.X;
  isPublishing = false;
  publishSuccess = false;

  constructor(private postsService: PostsService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {}

  togglePlatform(platform: PlatformConfig): void {
    platform.enabled = !platform.enabled;
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

  async onFileSelect(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const files = Array.from(input.files);
      this.mediaFiles = [...this.mediaFiles, ...files];
      
      // Create preview URLs
      for (const file of files) {
        const url = URL.createObjectURL(file);
        this.mediaUrls.push(url);
      }
    }
  }

  removeMedia(index: number): void {
    URL.revokeObjectURL(this.mediaUrls[index]);
    this.mediaFiles.splice(index, 1);
    this.mediaUrls.splice(index, 1);
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
  }
}