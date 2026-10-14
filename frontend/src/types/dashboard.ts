import type { DetectionPriority, DetectionSourceType } from './detection';

export interface DashboardOverview {
  metrics: Record<'totalBrands' | 'totalAnalyses' | 'highPriorityFindings' | 'criticalPriorityFindings' | 'socialAnalyses' | 'mobileAppAnalyses', { value: number; definition: string }>;
  riskDistribution: Record<DetectionPriority, number>;
  sourceDistribution: { sourceType: DetectionSourceType | 'other'; count: number }[];
  recentAnalyses: {
    analysisId: string;
    candidateName: string;
    brandName: string;
    sourceType: DetectionSourceType;
    platform?: string;
    score: number;
    priority: DetectionPriority;
    analyzedAt: string;
  }[];
  trend: { available: boolean; windowDays: number; points: { date: string; count: number }[]; message?: string };
}
