export enum InsightType {
  TRENDING_TOPIC = 'TRENDING_TOPIC',
  CONTENT_SUGGESTION = 'CONTENT_SUGGESTION',
  ENGAGEMENT_PATTERN = 'ENGAGEMENT_PATTERN',
  OPTIMAL_POSTING_TIME = 'OPTIMAL_POSTING_TIME',
  AUDIENCE_INTEREST = 'AUDIENCE_INTEREST'
}

export interface Insight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  metadata?: Record<string, any>;
  relevanceScore: number;
  isRead: boolean;
  createdAt: Date;
}