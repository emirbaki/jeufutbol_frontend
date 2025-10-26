import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MonitoringService } from '../../../services/monitoring.service';

@Component({
  selector: 'app-monitoring-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './monitoring-dashboard.component.html',
})
export class MonitoringDashboardComponent implements OnInit {
  profiles: any[] = [];
  selectedProfile: any = null;
  tweets: any[] = [];
  loading = false;
  addingProfile = false;
  newUsername = '';

  constructor(private monitoringService: MonitoringService) {}

  async ngOnInit() {
    await this.loadProfiles();
  }

  async loadProfiles() {
    this.loading = true;
    try {
      this.profiles = await this.monitoringService.getMonitoredProfiles();
      if (this.profiles.length > 0 && !this.selectedProfile) {
        await this.selectProfile(this.profiles[0]);
      }
    } catch (error) {
      console.error('Error loading profiles:', error);
    } finally {
      this.loading = false;
    }
  }

  async selectProfile(profile: any) {
    this.selectedProfile = profile;
    this.loading = true;
    try {
      this.tweets = await this.monitoringService.getProfileTweets(profile.id);
    } catch (error) {
      console.error('Error loading tweets:', error);
    } finally {
      this.loading = false;
    }
  }

  async addProfile() {
    if (!this.newUsername.trim()) return;

    this.addingProfile = true;
    try {
      const profile = await this.monitoringService.addMonitoredProfile(this.newUsername);
      this.profiles.unshift(profile);
      this.newUsername = '';
      await this.selectProfile(profile);
    } catch (error) {
      console.error('Error adding profile:', error);
      alert('Failed to add profile. Please check the username and try again.');
    } finally {
      this.addingProfile = false;
    }
  }

  async removeProfile(profile: any, event: Event) {
    event.stopPropagation();
    
    if (!confirm(`Remove ${profile.xUsername} from monitoring?`)) return;

    try {
      await this.monitoringService.removeMonitoredProfile(profile.id);
      this.profiles = this.profiles.filter(p => p.id !== profile.id);
      
      if (this.selectedProfile?.id === profile.id) {
        this.selectedProfile = null;
        this.tweets = [];
        if (this.profiles.length > 0) {
          await this.selectProfile(this.profiles[0]);
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