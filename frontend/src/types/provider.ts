export type ProviderStatus = 'connected' | 'not_configured' | 'unavailable' | 'error' | 'disabled';

export interface ProviderHealth {
  providerId: string;
  displayName: string;
  capabilities: string[];
  status: ProviderStatus;
  configurationRequired: boolean;
  lastSuccessfulSync?: string;
  lastError?: string;
}

export interface AppleAppListing {
  selectionId: string;
  providerRecordId: string;
  appName: string;
  publisher: string;
  bundleId?: string;
  listingUrl?: string;
  platform: 'iOS';
  genre?: string;
  collectionTime: string;
  sourceProvider: 'apple_itunes_search';
}

export interface BlueskyProfile {
  selectionId: string;
  providerRecordId: string;
  did: string;
  handle: string;
  displayName?: string;
  description?: string;
  avatarUrl?: string;
  indexedAt?: string;
  profileUrl: string;
  platform: 'Bluesky';
  collectionTime: string;
  sourceProvider: 'bluesky_public_api';
}
