import type { Brand, BrandInput } from '../types/brand';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/+$/, '') || '/api';

const request = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  const payload = (await response.json()) as T & { error?: string; issues?: string[] };
  if (!response.ok) throw new Error(payload.error ?? 'The request could not be completed.');
  return payload;
};

export const brandsApi = {
  list: async () => (await request<{ brands: Brand[] }>('/brands')).brands,
  create: async (input: BrandInput) => (await request<{ brand: Brand }>('/brands', { method: 'POST', body: JSON.stringify(input) })).brand,
  update: async (id: string, input: BrandInput) => (await request<{ brand: Brand }>(`/brands/${id}`, { method: 'PUT', body: JSON.stringify(input) })).brand,
  remove: (id: string) => request<void>(`/brands/${id}`, { method: 'DELETE' }),
};
