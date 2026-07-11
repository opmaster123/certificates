// Tier Configuration
export const TIER_METRICS = {
  SMALL: { hours: 2, duration: 10, questionCount: 10, price: 5 },
  MEDIUM: { hours: 4, duration: 20, questionCount: 20, price: 8 },
  LARGE: { hours: 6, duration: 30, questionCount: 30, price: 10 },
} as const;

export type TierName = keyof typeof TIER_METRICS;

export interface NextTierInfo {
  nextThreshold: number;
  hoursNeeded: number;
  nextDiscountPercentage: number;
  currentPercentage: number;
  progressPercent: number;
}

export const DISCOUNT_TIERS = [
  { minHours: 20, percentage: 30, label: 'خصم 30% (20+ ساعة)' },
  { minHours: 10, percentage: 20, label: 'خصم 20% (10-19 ساعة)' },
] as const;

/**
 * Returns discount percentage based on total credit hours H:
 * - H < 10 hours: 0% discount ($3.00/hr)
 * - 10 <= H < 20 hours: 20% discount ($2.40/hr)
 * - H >= 20 hours: 30% discount ($2.10/hr)
 */
export function calculateDiscountPercentage(totalHours: number): number {
  if (totalHours >= 20) return 30;
  if (totalHours >= 10) return 20;
  return 0;
}

/**
 * Calculates progress and information for the next discount tier.
 */
export function getNextDiscountTier(totalHours: number): NextTierInfo | null {
  if (totalHours < 10) {
    return {
      nextThreshold: 10,
      hoursNeeded: Math.max(0, 10 - totalHours),
      nextDiscountPercentage: 20,
      currentPercentage: 0,
      progressPercent: Math.min(100, Math.round((totalHours / 10) * 100)),
    };
  }
  if (totalHours < 20) {
    return {
      nextThreshold: 20,
      hoursNeeded: Math.max(0, 20 - totalHours),
      nextDiscountPercentage: 30,
      currentPercentage: 20,
      progressPercent: Math.min(100, Math.round(((totalHours - 10) / 10) * 100)),
    };
  }
  return null; // Maximum discount reached
}

/**
 * Calculates total hours, original price, discount percentage, and discounted price for a bundle of tests.
 */
export function calculateBundlePricing(
  tests: Array<{ hours?: number; price?: number; tierName?: string }>
) {
  const totalHours = tests.reduce((acc, t) => acc + (t.hours || 0), 0);
  const originalPrice = tests.reduce((acc, t) => {
    if (t.tierName && TIER_METRICS[t.tierName as TierName]) {
      return acc + TIER_METRICS[t.tierName as TierName].price;
    }
    if (t.hours === 2) return acc + TIER_METRICS.SMALL.price;
    if (t.hours === 4) return acc + TIER_METRICS.MEDIUM.price;
    if (t.hours === 6) return acc + TIER_METRICS.LARGE.price;
    if (typeof t.price === 'number') return acc + t.price;
    return acc;
  }, 0);
  const discountPercentage = calculateDiscountPercentage(totalHours);
  const discountedPrice = Math.round(originalPrice * (1 - discountPercentage / 100));
  const discountAmount = originalPrice - discountedPrice;
  const nextTier = getNextDiscountTier(totalHours);

  return {
    totalHours,
    originalPrice,
    discountPercentage,
    discountedPrice,
    discountAmount,
    nextTier,
  };
}

/**
 * Attaches metrics (hours, duration, questionCount, price) to a test variant object.
 */
export function attachMetrics(variant: any) {
  if (!variant) return null;
  const metrics = TIER_METRICS[variant.tierName as TierName];
  if (metrics) {
    Object.assign(variant, metrics);
  }
  return variant;
}
