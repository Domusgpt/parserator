// packages/api/src/config/tierLimits.ts
export interface TierConfig {
  requestsPerMonth: number;
  requestsPerMinute: number;
}

export const TIER_LIMITS: { [key: string]: TierConfig } = {
  free: { requestsPerMonth: 100, requestsPerMinute: 10 },
  pro: { requestsPerMonth: 10000, requestsPerMinute: 100 },
  enterprise: { requestsPerMonth: 100000, requestsPerMinute: 1000 }, // Example
  admin: { requestsPerMonth: Infinity, requestsPerMinute: Infinity }, // Admins might have no limits
};
