import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { firstValueFrom } from 'rxjs';
import { JobService } from './job.service';

const GENERATE_AI_INSIGHTS = gql`
  mutation GenerateAIInsights($topic: String, $llmProvider: String) {
    generateAIInsights(topic: $topic, llmProvider: $llmProvider) {
      jobId
    }
  }
`;

const GENERATE_POST_TEMPLATE = gql`
  mutation GeneratePostTemplate(
    $insights: [String!]!
    $platform: String!
    $tone: String
    $llmProvider: String
  ) {
    generatePostTemplate(
      insights: $insights
      platform: $platform
      tone: $tone
      llmProvider: $llmProvider
    ) {
      jobId
    }
  }
`;

const ANALYZE_TRENDS = gql`
  query AnalyzeTrends($topic: String, $timeRange: String) {
    analyzeTrends(topic: $topic, timeRange: $timeRange)
  }
`;

@Injectable({
  providedIn: 'root'
})
export class AIInsightsService {
  constructor(
    private apollo: Apollo,
    private jobService: JobService
  ) { }

  async generateInsights(topic?: string, llmProvider?: string): Promise<any[]> {
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
    return jobResult.result?.insights || [];
  }

  async generatePostTemplate(
    insights: string[],
    platform: string,
    tone?: string,
    llmProvider?: string,
  ): Promise<any> {
    // 1. Start the job
    const mutationResult = await firstValueFrom(
      this.apollo.mutate<{ generatePostTemplate: { jobId: string } }>({
        mutation: GENERATE_POST_TEMPLATE,
        variables: { insights, platform, tone, llmProvider }
      })
    );

    const jobId = mutationResult.data?.generatePostTemplate?.jobId;
    if (!jobId) {
      throw new Error('Failed to start post generation job');
    }

    // 2. Wait for completion
    const jobResult = await this.jobService.waitForJobCompletion(jobId);

    // 3. Return results
    return jobResult.result;
  }

  async analyzeTrends(topic?: string, timeRange?: string): Promise<any> {
    const result = await firstValueFrom(
      this.apollo.query<{ analyzeTrends: any }>({
        query: ANALYZE_TRENDS,
        variables: { topic, timeRange },
        fetchPolicy: 'network-only'
      })
    );
    return result.data?.analyzeTrends;
  }
}
