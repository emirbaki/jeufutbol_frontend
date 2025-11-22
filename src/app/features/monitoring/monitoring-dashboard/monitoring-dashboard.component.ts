import { Component, OnInit, signal, effect, ElementRef, ViewChildren, QueryList, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MonitoredProfile, MonitoringService, Tweet } from '../../../services/monitoring.service';
import { memoize } from '../../../../shared/operators/memoize.operator';
import { from, Observable, firstValueFrom } from 'rxjs';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

type ViewMode = 'single' | 'timeline';

interface TweetWithProfile extends Tweet {
  profile: MonitoredProfile;
}

@Component({
  selector: 'app-monitoring-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './monitoring-dashboard.component.html',
})
export class MonitoringDashboardComponent implements OnInit, AfterViewInit {
  profiles = signal<MonitoredProfile[]>([]);
  selectedProfile = signal<MonitoredProfile | null>(null);
  tweets = signal<Tweet[]>([]);
  timelineTweets = signal<TweetWithProfile[]>([]);
  loading = signal(false);
  addingProfile = signal(false);
  newUsername = signal('');
  viewMode = signal<ViewMode>('timeline');

  @ViewChildren('tweetCard') tweetCards!: QueryList<ElementRef>;
  @ViewChildren('profileCard') profileCards!: QueryList<ElementRef>;

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
        this.animateList('.tweet-card');
      }
    });

    // Animate profile tweets when they change
    effect(() => {
      const tweets = this.tweets();
      if (this.viewMode() === 'single' && tweets.length > 0) {
        this.animateList('.tweet-card');
      }
    });

    // Animate profiles when loaded
    effect(() => {
      const profiles = this.profiles();
      if (profiles.length > 0) {
        this.animateList('.profile-card', 0.1);
      }
    });
  }

  async ngOnInit() {
    await this.loadProfiles();
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

  private animateList(selector: string, staggerAmount = 0.05) {
    if (!isPlatformBrowser(this.platformId)) return;

    // Wait for DOM update
    setTimeout(() => {
      // Set initial state for all elements
      gsap.set(selector, { opacity: 0, y: 20 });

      // Create batch scroll triggers
      ScrollTrigger.batch(selector, {
        onEnter: (batch) => {
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            stagger: staggerAmount,
            overwrite: true,
            duration: 0.4,
            ease: 'power2.out'
          });
        },
        start: 'top 95%',
        once: true // Only animate once
      });

      // Refresh ScrollTrigger to ensure accurate positions
      ScrollTrigger.refresh();
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

  private getProfileTweets$(profileId: string): Observable<Tweet[]> {
    return from(this.monitoringService.getProfileTweets(profileId))
      .pipe(memoize(profileId));
  }

  async loadTimelineTweets() {
    this.loading.set(true);
    try {
      const allTweets: TweetWithProfile[] = [];

      // Fetch tweets from all profiles
      for (const profile of this.profiles()) {
        const tweets = await firstValueFrom(this.getProfileTweets$(profile.id));
        const tweetsWithProfile = tweets.map(tweet => ({
          ...tweet,
          profile
        }));
        allTweets.push(...tweetsWithProfile);
      }

      // Sort by date (most recent first)
      allTweets.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      this.timelineTweets.set(allTweets);
    } catch (error) {
      console.error('Error loading timeline tweets:', error);
    } finally {
      this.loading.set(false);
    }
  }

  async selectProfile(profile: MonitoredProfile) {
    this.selectedProfile.set(profile);
    this.viewMode.set('single');
    this.loading.set(true);
    try {
      let tweets = await firstValueFrom(this.getProfileTweets$(profile.id));
      this.tweets.set(tweets);
    } catch (error) {
      console.error('Error loading tweets:', error);
    } finally {
      this.loading.set(false);
    }
  }

  async switchToTimeline() {
    this.viewMode.set('timeline');
    this.selectedProfile.set(null);
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