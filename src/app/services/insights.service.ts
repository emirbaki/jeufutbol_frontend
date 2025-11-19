import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { firstValueFrom, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Insight } from '../models/insight.model';

const GET_INSIGHTS = gql`
  query GetInsights($limit: Float) {
    getInsights(limit: $limit) {
      id
      type
      title
      description
      metadata
      relevanceScore
      isRead
      createdAt
    }
  }
`;

const GENERATE_INSIGHTS = gql`
  mutation GenerateInsights {
    generateInsights {
      id
      type
      title
      description
      metadata
      relevanceScore
      isRead
      createdAt
    }
  }
`;

const MARK_INSIGHT_READ = gql`
  mutation MarkInsightAsRead($insightId: String!) {
    markInsightAsRead(insightId: $insightId) {
      id
      isRead
    }
  }
`;

@Injectable({
  providedIn: 'root'
})
export class InsightsService {
  constructor(private apollo: Apollo) { }

  watchInsights(limit = 50): Observable<Insight[]> {
    return this.apollo.watchQuery<{ getInsights: Insight[] }>({
      query: GET_INSIGHTS,
      variables: { limit },
      fetchPolicy: 'cache-and-network'
    }).valueChanges.pipe(
      map(result => result.data.getInsights)
    );
  }

  async getInsights(limit = 50): Promise<Insight[]> {
    const result = await firstValueFrom(
      this.apollo.query<{ getInsights: Insight[] }>({
        query: GET_INSIGHTS,
        variables: { limit },
        fetchPolicy: 'network-only'
      })
    );
    return result.data.getInsights;
  }

  async generateInsights(): Promise<Insight[]> {
    const result = await firstValueFrom(
      this.apollo.mutate<{ generateInsights: Insight[] }>({
        mutation: GENERATE_INSIGHTS
      })
    );
    return result.data?.generateInsights || [];
  }

  async markAsRead(insightId: string): Promise<void> {
    await firstValueFrom(
      this.apollo.mutate({
        mutation: MARK_INSIGHT_READ,
        variables: { insightId }
      })
    );
  }
}