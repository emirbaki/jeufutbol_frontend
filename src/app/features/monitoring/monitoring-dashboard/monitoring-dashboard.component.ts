import { Component, OnInit, signal, effect, ElementRef, ViewChildren, QueryList, AfterViewInit, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MonitoredProfile, MonitoringService, Tweet } from '../../../services/monitoring.service';
import { from, Observable, firstValueFrom, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { matAdd, matViewTimeline, matPerson, matAccountCircle, matVisibility } from '@ng-icons/material-icons/baseline';
import { matChatBubbleOutline, matRepeatOutline, matFavoriteOutline, } from '@ng-icons/material-icons/outline';

type ViewMode = 'single' | 'timeline';

interface TweetWithProfile extends Tweet {
  profile: MonitoredProfile;
}

@Component({
  selector: 'app-monitoring-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIcon],
  templateUrl: './monitoring-dashboard.component.html',
  providers: [provideIcons({ matAdd, matViewTimeline, matPerson, matAccountCircle, matVisibility, matChatBubbleOutline, matRepeatOutline, matFavoriteOutline })],
})
export class MonitoringDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  profiles = signal<MonitoredProfile[]>([]);
  selectedProfile = signal<MonitoredProfile | null>(null);
  tweets = signal<Tweet[]>([]);
  timelineTweets = signal<TweetWithProfile[]>([]);
  loading = signal(false);
  addingProfile = signal(false);
  newUsername = signal('');
  viewMode = signal<ViewMode>('timeline');
  refreshingProfile = signal(false);

  // Pagination state
  tweetsOffset = signal(0);
  hasMoreTweets = signal(true);
  isLoadingMore = signal(false);

  // Timeline Pagination state
  timelineOffset = signal(0);
  hasMoreTimelineTweets = signal(true);
  isLoadingMoreTimeline = signal(false);

  readonly TWEETS_LIMIT = 20;
  readonly TIMELINE_LIMIT_PER_PROFILE = 5;

  @ViewChildren('tweetCard') tweetCards!: QueryList<ElementRef>;
  @ViewChildren('profileCard') profileCards!: QueryList<ElementRef>;

  // Subscription management
  private timelineSubscription: Subscription | null = null;
  private profileSubscription: Subscription | null = null;

  // Animation control
  private skipNextAnimation = false;

  constructor(
    private monitoringService: MonitoringService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      gsap.registerPlugin(ScrollTrigger);
    }

    // Animate timeline tweets when they change
    effect(() => {
      const tweets = this.timelineTweets();
      if (this.viewMode() === 'timeline' && tweets.length > 0) {
        this.animateList('.tweet-card', 0.05, '.main-scroll-container');
      }
    });

    // Animate profile tweets when they change
    effect(() => {
      const tweets = this.tweets();
      if (this.viewMode() === 'single' && tweets.length > 0) {
        this.animateList('.tweet-card', 0.05, '.main-scroll-container');
      }
    });

    // Animate profiles when loaded
    effect(() => {
      const profiles = this.profiles();
      if (profiles.length > 0) {
        // Use the scrollable container for profile cards
        this.animateList('.profile-card', 0.1, '.custom-scrollbar');
      }
    });
  }

  async ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      await this.loadProfiles();
    }
  }

  ngAfterViewInit() {
    // Initial animation for the main container
    if (isPlatformBrowser(this.platformId)) {
      gsap.from('.dashboard-container', {
        opacity: 0,
        y: 20,
        duration: 0.5,
        ease: 'power2.out'
      });
    }
  }

  ngOnDestroy() {
    if (this.timelineSubscription) {
      this.timelineSubscription.unsubscribe();
    }
    if (this.profileSubscription) {
      this.profileSubscription.unsubscribe();
    }
  }

  private animateList(selector: string, staggerAmount = 0.05, scroller?: string) {
    if (!isPlatformBrowser(this.platformId)) return;

    // Wait for DOM update
    setTimeout(() => {
      const elements = gsap.utils.toArray(selector) as HTMLElement[];
      // Only animate elements that haven't been animated yet
      const newElements = elements.filter(el => !el.classList.contains('has-animated'));

      if (newElements.length === 0) {
        ScrollTrigger.refresh();
        return;
      }

      // Set initial state for new elements
      gsap.set(newElements, { opacity: 0, y: 20 });

      // Create batch scroll triggers with optional scroller
      const batchConfig: any = {
        onEnter: (batch: any) => {
          if (this.skipNextAnimation) {
            // Instant appearance for cached data
            gsap.set(batch, {
              opacity: 1,
              y: 0,
              overwrite: true,
              onComplete: () => {
                batch.forEach((el: HTMLElement) => el.classList.add('has-animated'));
              }
            });
          } else {
            // Standard animation
            gsap.to(batch, {
              opacity: 1,
              y: 0,
              stagger: staggerAmount,
              overwrite: true,
              duration: 0.4,
              ease: 'power2.out',
              onComplete: () => {
                batch.forEach((el: HTMLElement) => el.classList.add('has-animated'));
              }
            });
          }
        },
        start: 'top 95%',
        once: true // Only animate once
      };

      // Add scroller if specified (for custom scroll containers)
      if (scroller) {
        batchConfig.scroller = scroller;
      }

      ScrollTrigger.batch(newElements, batchConfig);

      // Refresh ScrollTrigger to ensure accurate positions
      ScrollTrigger.refresh();

      // Reset flag after a short delay to ensure all batches are processed
      setTimeout(() => {
        this.skipNextAnimation = false;
      }, 200);
    }, 100);
  }

  async loadProfiles() {
    this.loading.set(true);
    try {
      let profiles = await firstValueFrom(this.monitoringService.watchMonitoredProfiles());
      this.profiles.set(profiles);

      if (this.viewMode() === 'timeline' && profiles.length > 0) {
        await this.loadTimelineTweets();
      } else if (this.profiles().length > 0 && !this.selectedProfile()) {
        await this.selectProfile(this.profiles()[0]);
      }
    } catch (error) {
      console.error('Error loading profiles:', error);
    } finally {
      this.loading.set(false);
    }
  }

  async loadTimelineTweets() {
    // Optimistic UI: Don't set loading if we already have data
    if (this.timelineTweets().length === 0) {
      this.loading.set(true);
    }

    this.timelineOffset.set(0);
    this.hasMoreTimelineTweets.set(true);

    try {
      // Cancel previous subscription if any
      if (this.timelineSubscription) {
        this.timelineSubscription.unsubscribe();
      }

      this.timelineSubscription = this.monitoringService.getTimelineTweets(50, 0)
        .subscribe({
          next: (tweets) => {
            this.timelineTweets.set(tweets);
            this.loading.set(false);
          },
          error: (error) => {
            console.error('Error loading timeline tweets:', error);
            this.loading.set(false);
          }
        });
    } catch (error) {
      console.error('Error loading timeline tweets:', error);
      this.loading.set(false);
    }
  }

  async loadMoreTimelineTweets() {
    if (this.isLoadingMoreTimeline() || !this.hasMoreTimelineTweets()) return;

    this.isLoadingMoreTimeline.set(true);
    const nextOffset = this.timelineOffset() + 50;

    try {
      const newTweets = await firstValueFrom(
        this.monitoringService.getTimelineTweets(50, nextOffset)
      );

      if (newTweets.length > 0) {
        this.timelineTweets.update(current => {
          // Filter out duplicates just in case
          const existingIds = new Set(current.map(t => t.id));
          const uniqueNewTweets = newTweets.filter(t => !existingIds.has(t.id));
          return [...current, ...uniqueNewTweets];
        });
        this.timelineOffset.set(nextOffset);
      } else {
        this.hasMoreTimelineTweets.set(false);
      }
    } catch (error) {
      console.error('Error loading more timeline tweets:', error);
    } finally {
      this.isLoadingMoreTimeline.set(false);
    }
  }

  selectProfile(profile: MonitoredProfile) {
    this.selectedProfile.set(profile);
    this.viewMode.set('single');
    this.tweetsOffset.set(0);
    this.hasMoreTweets.set(true);

    // Optimistic UI: Pre-fill from timeline data
    const cachedTweets = this.timelineTweets().filter(t => t.profile.id === profile.id);
    if (cachedTweets.length > 0) {
      this.tweets.set(cachedTweets);
      // Don't show loading spinner if we have data to show immediately
      this.loading.set(false);
      this.skipNextAnimation = true; // Skip animation for cached data
    } else {
      this.loading.set(true);
      this.skipNextAnimation = false; // Animate new data
    }

    if (this.profileSubscription) {
      this.profileSubscription.unsubscribe();
    }

    this.profileSubscription = this.monitoringService.getProfileTweets(profile.id, this.TWEETS_LIMIT, 0)
      .subscribe({
        next: (tweets) => {
          // Merge with existing if we pre-filled, or just set
          // Actually, just set is fine as it's the authoritative source
          this.tweets.set(tweets);
          this.loading.set(false);

          if (tweets.length < this.TWEETS_LIMIT) {
            this.hasMoreTweets.set(false);
          }
        },
        error: (error) => {
          console.error('Error loading tweets:', error);
          this.loading.set(false);
        }
      });
  }

  async loadMoreTweets() {
    const profile = this.selectedProfile();
    if (!profile || !this.hasMoreTweets() || this.isLoadingMore()) return;

    this.isLoadingMore.set(true);
    const nextOffset = this.tweetsOffset() + this.TWEETS_LIMIT;

    try {
      // For pagination, we can just take one value
      const newTweets = await firstValueFrom(
        this.monitoringService.getProfileTweets(profile.id, this.TWEETS_LIMIT, nextOffset)
      );

      if (newTweets.length > 0) {
        this.tweets.update(current => [...current, ...newTweets]);
        this.tweetsOffset.set(nextOffset);

        if (newTweets.length < this.TWEETS_LIMIT) {
          this.hasMoreTweets.set(false);
        }
      } else {
        this.hasMoreTweets.set(false);
      }
    } catch (error) {
      console.error('Error loading more tweets:', error);
    } finally {
      this.isLoadingMore.set(false);
    }
  }

  async switchToTimeline() {
    this.viewMode.set('timeline');
    this.selectedProfile.set(null);

    // If we already have timeline tweets, skip animation
    if (this.timelineTweets().length > 0) {
      this.skipNextAnimation = true;
    }

    await this.loadTimelineTweets();
  }

  async addProfile() {
    if (!this.newUsername().trim()) return;

    this.addingProfile.set(true);
    try {
      const profile = await this.monitoringService.addMonitoredProfile(this.newUsername());
      this.profiles.update(prev => [profile, ...prev]);
      this.newUsername.set('');

      if (this.viewMode() === 'timeline') {
        await this.loadTimelineTweets();
      } else {
        await this.selectProfile(profile);
      }
    } catch (error) {
      console.error('Error adding profile:', error);
      alert('Failed to add profile. Please check the username and try again.');
    } finally {
      this.addingProfile.set(false);
    }
  }

  async removeProfile(profile: any, event: Event) {
    event.stopPropagation();

    if (!confirm(`Remove ${profile.xUsername} from monitoring?`)) return;

    try {
      await this.monitoringService.removeMonitoredProfile(profile.id);
      this.profiles.set(this.profiles().filter(p => p.id !== profile.id));

      if (this.viewMode() === 'timeline') {
        await this.loadTimelineTweets();
      } else if (this.selectedProfile()?.id === profile.id) {
        this.selectedProfile.set(null);
        this.tweets.set([]);
        if (this.profiles().length > 0) {
          await this.selectProfile(this.profiles()[0]);
        }
      }
    } catch (error) {
      console.error('Error removing profile:', error);
    }
  }

  async refreshProfile(profile: MonitoredProfile, event: Event) {
    event.stopPropagation();
    if (this.refreshingProfile()) return;

    this.refreshingProfile.set(true);
    try {
      await this.monitoringService.refreshProfileTweets(profile.id);

      // Reload tweets after refresh
      if (this.selectedProfile()?.id === profile.id) {
        await this.selectProfile(profile);
      } else {
        // Just update the profile list to show new lastFetchedAt
        await this.loadProfiles();
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
      alert('Failed to refresh profile tweets. Please try again.');
    } finally {
      this.refreshingProfile.set(false);
    }
  }

  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  getEngagementRate(tweet: any): number {
    const total = tweet.likes + tweet.retweets + tweet.replies;
    return tweet.views > 0 ? (total / tweet.views) * 100 : 0;
  }
}