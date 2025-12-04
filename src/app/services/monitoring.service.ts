import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { firstValueFrom, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { JobService } from './job.service';

const GET_MONITORED_PROFILES = gql`
  query GetMonitoredProfiles {
    getMonitoredProfiles {
      id
      xUsername
      xUserId
      displayName
      profileImageUrl
      isActive
      lastFetchedAt
      createdAt
      tenant {
        id
        name
        subdomain
      }
    }
  }
`;

const GET_PROFILE_TWEETS = gql`
  query GetProfileTweets($profileId: String!, $limit: Int, $offset: Int) {
    getProfileTweets(profileId: $profileId, limit: $limit, offset: $offset) {
      id
      tweetId
      content
      createdAt
      likes
      retweets
      replies
      views
      mediaUrls
      hashtags
      mentions
      urls
    }
  }
`;

const GET_TIMELINE_TWEETS = gql`
  query GetTimelineTweets($limit: Int, $offset: Int) {
    getTimelineTweets(limit: $limit, offset: $offset) {
      id
      tweetId
      content
      createdAt
      likes
      retweets
      replies
      views
      mediaUrls
      hashtags
      mentions
      urls
      monitoredProfile {
        id
        xUsername
        displayName
        profileImageUrl
      }
    }
  }
`;

const ADD_MONITORED_PROFILE = gql`
  mutation AddMonitoredProfile($xUsername: String!) {
    addMonitoredProfile(xUsername: $xUsername) {
      id
      xUsername
      xUserId
      displayName
      profileImageUrl
      isActive
      createdAt
      tenant {
        id
        name
        subdomain
      }
    }
  }
`;

const REMOVE_MONITORED_PROFILE = gql`
  mutation RemoveMonitoredProfile($profileId: String!) {
    removeMonitoredProfile(profileId: $profileId)
  }
`;

const REFRESH_PROFILE_TWEETS = gql`
  mutation RefreshProfileTweets($profileId: String!) {
    refreshProfileTweets(profileId: $profileId) {
      jobId
    }
  }
`;

const SEARCH_TWEETS = gql`
  query SearchTweets($query: String!, $offset: Int) {
    searchTweets(query: $query, offset: $offset) {
      id
      tweetId
      content
      createdAt
      likes
      retweets
      replies
      views
      mediaUrls
      hashtags
      mentions
      urls
      monitoredProfile {
        id
        xUsername
        displayName
        profileImageUrl
      }
    }
  }
`;

export interface MonitoredProfile {
  id: string,
  xUsername: string,
  xUserId: string,
  displayName: string,
  profileImageUrl: string,
  isActive: boolean,
  lastFetchedAt: string,
  createdAt: string,
  tenant?: {
    id: string,
    name: string,
    subdomain: string
  }
}
export interface Tweet {
  id: string,
  tweetId: string,
  content: string,
  createdAt: string,
  likes: number,
  retweets: number,
  replies: number,
  views: number,
  mediaUrls: string[],
  hashtags: string[],
  mentions: string[],
  urls: string[],
  monitoredProfile: MonitoredProfile
}

@Injectable({
  providedIn: 'root'
})
export class MonitoringService {
  constructor(
    private apollo: Apollo,
    private jobService: JobService
  ) { }

  watchMonitoredProfiles(): Observable<MonitoredProfile[]> {
    return this.apollo.watchQuery<{ getMonitoredProfiles: MonitoredProfile[] }>({
      query: GET_MONITORED_PROFILES,
      fetchPolicy: 'cache-and-network'
    }).valueChanges.pipe(
      map(result => result.data.getMonitoredProfiles)
    );
  }

  async getMonitoredProfiles(): Promise<MonitoredProfile[]> {
    const result = await firstValueFrom(
      this.apollo.query<{ getMonitoredProfiles: MonitoredProfile[] }>({
        query: GET_MONITORED_PROFILES,

        // fetchPolicy: 'network-only' // Removed to allow SSR cache restoration
      })
    );
    return result.data.getMonitoredProfiles;
  }

  getProfileTweets(profileId: string, limit = 50, offset = 0): Observable<any[]> {
    return this.apollo.watchQuery<{ getProfileTweets: any[] }>({
      query: GET_PROFILE_TWEETS,
      variables: { profileId, limit, offset },
      fetchPolicy: 'cache-and-network'
    }).valueChanges.pipe(
      map(result => result.data.getProfileTweets)
    );
  }

  getTimelineTweets(limit = 50, offset = 0): Observable<any[]> {
    return this.apollo.watchQuery<{ getTimelineTweets: any[] }>({
      query: GET_TIMELINE_TWEETS,
      variables: { limit, offset },
      fetchPolicy: 'cache-and-network'
    }).valueChanges.pipe(
      map(result => result.data.getTimelineTweets.map(t => ({
        ...t,
        profile: t.monitoredProfile
      })))
    );
  }

  async addMonitoredProfile(xUsername: string): Promise<any> {
    const result = await firstValueFrom(
      this.apollo.mutate<{ addMonitoredProfile: any }>({
        mutation: ADD_MONITORED_PROFILE,
        variables: { xUsername }
      })
    );
    return result.data?.addMonitoredProfile;
  }

  async removeMonitoredProfile(profileId: string): Promise<boolean> {
    const result = await firstValueFrom(
      this.apollo.mutate<{ removeMonitoredProfile: boolean }>({
        mutation: REMOVE_MONITORED_PROFILE,
        variables: { profileId }
      })
    );
    return result.data?.removeMonitoredProfile || false;
  }

  async refreshProfileTweets(profileId: string): Promise<void> {
    // 1. Start the job
    const mutationResult = await firstValueFrom(
      this.apollo.mutate<{ refreshProfileTweets: { jobId: string } }>({
        mutation: REFRESH_PROFILE_TWEETS,
        variables: { profileId }
      })
    );

    const jobId = mutationResult.data?.refreshProfileTweets?.jobId;
    if (!jobId) {
      throw new Error('Failed to start refresh job');
    }

    // 2. Wait for completion
    await this.jobService.waitForJobCompletion(jobId);
  }

  async searchTweets(query: string, offset = 0): Promise<Tweet[]> {
    const result = await firstValueFrom(
      this.apollo.query<{ searchTweets: Tweet[] }>({
        query: SEARCH_TWEETS,
        variables: { query, offset },
        fetchPolicy: 'network-only' // Always fetch fresh results for search
      })
    );
    return result.data.searchTweets;
  }
}