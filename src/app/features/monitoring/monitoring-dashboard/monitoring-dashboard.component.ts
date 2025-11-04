import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MonitoredProfile, MonitoringService, Tweet } from '../../../services/monitoring.service';

@Component({
  selector: 'app-monitoring-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './monitoring-dashboard.component.html',
})
export class MonitoringDashboardComponent implements OnInit {
  profiles = signal<MonitoredProfile[]>([]);
  selectedProfile = signal<MonitoredProfile | null>(null);
  tweets= signal<Tweet[]>([]);
  loading = signal(false);
  addingProfile = signal(false);
  newUsername = signal('');

  constructor(private monitoringService: MonitoringService) {}

  async ngOnInit() {
    await this.loadProfiles();
  }

  async loadProfiles() {
    this.loading.set(true);
    try {
      let profiles = await this.monitoringService.getMonitoredProfiles();
      this.profiles.set(profiles);
      if (this.profiles.length > 0 && !this.selectedProfile) {
        await this.selectProfile(this.profiles()[0]);
      }
    } catch (error) {
      console.error('Error loading profiles:', error);
    } finally {
      this.loading.set(false);
    }
  }

  async selectProfile(profile: MonitoredProfile) {
    this.selectedProfile.set(profile);
    this.loading.set(true);
    try {
      let tweets = await this.monitoringService.getProfileTweets(profile.id);
      this.tweets.set(tweets);
    } catch (error) {
      console.error('Error loading tweets:', error);
    } finally {
      this.loading.set(false);
    }
  }

  async addProfile() {
    if (!this.newUsername().trim()) return;

    this.addingProfile.set(true);
    try {
      const profile = await this.monitoringService.addMonitoredProfile(this.newUsername());
      this.profiles().unshift(profile);
      this.newUsername.set('');
      await this.selectProfile(profile);
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
      
      if (this.selectedProfile()?.id === profile.id) {
        this.selectedProfile.set(null);
        this.tweets.set([]);
        if (this.profiles.length > 0) {
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