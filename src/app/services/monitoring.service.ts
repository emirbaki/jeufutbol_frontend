import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { firstValueFrom } from 'rxjs';

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
    }
  }
`;

const GET_PROFILE_TWEETS = gql`
  query GetProfileTweets($profileId: String!, $limit: Int) {
    getProfileTweets(profileId: $profileId, limit: $limit) {
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
    }
  }
`;

const REMOVE_MONITORED_PROFILE = gql`
  mutation RemoveMonitoredProfile($profileId: String!) {
    removeMonitoredProfile(profileId: $profileId)
  }
`;

@Injectable({
  providedIn: 'root'
})
export class MonitoringService {
  constructor(private apollo: Apollo) {}

  async getMonitoredProfiles(): Promise<any[]> {
    const result = await firstValueFrom(
      this.apollo.query<{ getMonitoredProfiles: any[] }>({
        query: GET_MONITORED_PROFILES,
        fetchPolicy: 'network-only'
      })
    );
    return result.data.getMonitoredProfiles;
  }

  async getProfileTweets(profileId: string, limit = 50): Promise<any[]> {
    const result = await firstValueFrom(
      this.apollo.query<{ getProfileTweets: any[] }>({
        query: GET_PROFILE_TWEETS,
        variables: { profileId, limit },
        fetchPolicy: 'network-only'
      })
    );
    return result.data.getProfileTweets;
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
}