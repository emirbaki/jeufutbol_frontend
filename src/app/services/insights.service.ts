import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { firstValueFrom, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Insight } from '../models/insight.model';
import { JobService } from './job.service';
import { LLMCredentials, LLMService } from './llm.service';

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
  mutation GenerateAIInsights($topic: String, $llmProvider: String) {
    generateAIInsights(topic: $topic, llmProvider: $llmProvider) {
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
    private jobService: JobService,
    private llmService: LLMService
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

    // Manually write to cache to trigger watchQuery updates
    this.apollo.client.writeQuery({
      query: GET_INSIGHTS,
      variables: { limit },
      data: { getInsights: result.data.getInsights }
    });

    return result.data.getInsights;
  }

  async generateInsights(topic?: string, llmProvider?: string): Promise<Insight[]> {
    if (!topic) {
      topic = 'General';
    }
    if (!llmProvider) {
      const _firstLLMCredentials = await this.llmService.getCredentials();
      llmProvider = _firstLLMCredentials[0].provider;
    }

    // 1. Start the job
    const mutationResult = await firstValueFrom(
      this.apollo.mutate<{ generateAIInsights: { jobId: string } }>({
        mutation: GENERATE_AI_INSIGHTS,
        variables: { topic, llmProvider }
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

  async refetchInsights(limit = 50): Promise<void> {
    await this.apollo.client.refetchQueries({
      include: [GET_INSIGHTS]
    });
  }
}