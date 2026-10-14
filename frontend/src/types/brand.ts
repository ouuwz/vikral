export type VerificationStatus = 'verified' | 'unverified';
export type SocialPlatform = 'Instagram' | 'Facebook' | 'X' | 'LinkedIn' | 'YouTube' | 'TikTok';
export type AppPlatform = 'Google Play' | 'Apple App Store' | 'Other';

export interface SocialAccount {
  platform: SocialPlatform;
  handle: string;
  profileUrl?: string;
  verificationStatus: VerificationStatus;
  evidenceNote?: string;
}

export interface MobileApp {
  platform: AppPlatform;
  appName: string;
  packageId?: string;
  bundleId?: string;
  publisher: string;
  storeUrl?: string;
  verificationStatus: VerificationStatus;
  evidenceNote?: string;
}

export interface Brand {
  id: string;
  name: string;
  officialWebsite?: string;
  industry?: string;
  description?: string;
  logoUrl?: string;
  aliases: string[];
  trustedDomains: string[];
  socialAccounts: SocialAccount[];
  mobileApps: MobileApp[];
  createdAt: string;
  updatedAt: string;
}

export type BrandInput = Omit<Brand, 'id' | 'createdAt' | 'updatedAt'>;
