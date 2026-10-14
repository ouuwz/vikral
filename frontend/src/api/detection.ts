import type { Brand } from '../types/brand';
import type { CandidateInput, DetectionResult } from '../types/detection';
import type { DashboardOverview } from '../types/dashboard';
import type { AppleAppListing, BlueskyProfile, ProviderHealth } from '../types/provider';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/+$/, '') || '/api';

const request = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(`${apiBaseUrl}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...options?.headers } });
  const payload = (await response.json()) as T & { error?: string; issues?: string[] };
  if (!response.ok) throw new Error(payload.issues?.join(' ') || payload.error || 'The request could not be completed.');
  return payload;
};

export const detectionApi = {
  listBrands: async () => (await request<{ brands: Brand[] }>('/brands')).brands,
  analyze: async (brandId: string, candidate: CandidateInput) =>
    (await request<{ analysis: DetectionResult }>('/detection/analyze', { method: 'POST', body: JSON.stringify({ brandId, candidate }) })).analysis,
  listAnalyses: async () => (await request<{ analyses: DetectionResult[] }>('/social-monitoring/analyses')).analyses,
  getAnalysis: async (analysisId: string) =>
    (await request<{ analysis: DetectionResult }>(`/social-monitoring/analyses/${analysisId}`)).analysis,
  getDashboard: async (days = 30, limit = 10) =>
    (await request<{ overview: DashboardOverview }>(`/dashboard/overview?days=${days}&limit=${limit}`)).overview,
  getIntegrations: async () => (await request<{ providers: ProviderHealth[] }>('/integrations/status')).providers,
  searchAppleApps: async (term: string, country: string, limit: number) =>
    (await request<{ listings: AppleAppListing[] }>('/integrations/apple/search', {
      method: 'POST',
      body: JSON.stringify({ term, country, limit }),
    })).listings,
  analyzeAppleApp: async (brandId: string, selectionId: string) =>
    (await request<{ analysis: DetectionResult }>('/integrations/apple/analyze', {
      method: 'POST',
      body: JSON.stringify({ brandId, selectionId }),
    })).analysis,
  searchBlueskyProfiles: async (query: string, limit: number) =>
    (await request<{ profiles: BlueskyProfile[] }>('/integrations/bluesky/search', {
      method: 'POST',
      body: JSON.stringify({ query, limit }),
    })).profiles,
  analyzeBlueskyProfile: async (brandId: string, selectionId: string) =>
    (await request<{ analysis: DetectionResult }>('/integrations/bluesky/analyze', {
      method: 'POST',
      body: JSON.stringify({ brandId, selectionId }),
    })).analysis,
};
