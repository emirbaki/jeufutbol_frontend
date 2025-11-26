import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { firstValueFrom, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Insight } from '../models/insight.model';
import { JobService } from './job.service';

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
      user {
        id
        firstName
        lastName
        email
      }
      tenantId
    }
  }
`;

const GENERATE_AI_INSIGHTS = gql`
  mutation GenerateAIInsights {
    generateAIInsights {
      jobId
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
  constructor(
    private apollo: Apollo,
    private jobService: JobService
  ) { }

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
    // 1. Start the job
    const mutationResult = await firstValueFrom(
      this.apollo.mutate<{ generateAIInsights: { jobId: string } }>({
        mutation: GENERATE_AI_INSIGHTS
      })
    );

    const jobId = mutationResult.data?.generateAIInsights?.jobId;
    if (!jobId) {
      throw new Error('Failed to start insight generation job');
    }

    // 2. Wait for completion
    const jobResult = await this.jobService.waitForJobCompletion(jobId);

    // 3. Return results
    // The processor returns { insights: Insight[] }
    let result = jobResult.result;
    if (typeof result === 'string') {
      try {
        result = JSON.parse(result);
      } catch (e) {
        console.error('Failed to parse job result', e);
      }
    }
    return result?.insights || [];
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