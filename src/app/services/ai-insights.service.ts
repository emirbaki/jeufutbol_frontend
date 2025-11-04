import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { firstValueFrom, map, Observable } from 'rxjs';

const GENERATE_AI_INSIGHTS = gql`
  mutation GenerateAIInsights($topic: String, $llmProvider: String) {
    generateAIInsights(topic: $topic, llmProvider: $llmProvider) {
      id
      type
      title
      description
      metadata
      relevanceScore
      createdAt
    }
  }
`;

const GENERATE_POST_TEMPLATE = gql`
  mutation GeneratePostTemplate(
    $insights: [String!]!
    $platform: String!
    $tone: String
  ) {
    generatePostTemplate(
      insights: $insights
      platform: $platform
      tone: $tone
    )
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
  constructor(private apollo: Apollo) {}

  async generateInsights(topic?: string, llmProvider?: string): Promise<any[]> {
    const result = await firstValueFrom(
      this.apollo.mutate<{ generateAIInsights: any[] }>({
        mutation: GENERATE_AI_INSIGHTS,
        variables: { topic, llmProvider }
      })
    );
    return result.data?.generateAIInsights || [];
  }

  async generatePostTemplate(
    insights: string[],
    platform: string,
    tone?: string
  ): Promise<any> {
    const result = await firstValueFrom(
      this.apollo.mutate<{ generatePostTemplate: string }>({
        mutation: GENERATE_POST_TEMPLATE,
        variables: { insights, platform, tone }
      })
    );
    return result.data?.generatePostTemplate;
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
