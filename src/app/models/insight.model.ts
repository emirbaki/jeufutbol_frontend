export enum InsightType {
  TRENDING_TOPIC = 'trending_topic',
  CONTENT_SUGGESTION = 'content_suggestion',
  ENGAGEMENT_PATTERN = 'engagement_pattern',
  OPTIMAL_POSTING_TIME = 'optimal_posting_time',
  AUDIENCE_INTEREST = 'audience_interest'
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
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}