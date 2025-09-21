export interface User {
  id: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Article {
  id: string;
  title: string;
  content: string;
  summary: string;
  url: string;
  imageUrl?: string;
  category: string;
  tags: string[];
  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  isPublished: boolean;
}

export interface NewsletterSubscription {
  id: string;
  email: string;
  categories: string[];
  frequency: 'daily' | 'weekly' | 'monthly';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnalyticsEvent {
  id: string;
  eventType: string;
  userId?: string;
  sessionId: string;
  properties: Record<string, any>;
  timestamp: Date;
}

export interface SearchCondition {
  id: string;
  userId: string;
  description: string;
  priority: 1 | 2 | 3;
  keywords: string[];
  extractedKeywords?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchConditionInput {
  description: string;
  priority: 1 | 2 | 3;
  keywords: string[];
}

export interface KeywordExtractionResult {
  keywords: string[];
  categories: string[];
  confidence: number;
}
