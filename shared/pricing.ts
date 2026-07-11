// Base price per CPE credit hour ($3/hour)
export const PRICE_PER_CPE_HOUR = 3;

// Tier Configuration
export const TIER_METRICS = {
  SMALL:  { hours: 2, duration: 10, questionCount: 10, price: 6 },
  MEDIUM: { hours: 4, duration: 20, questionCount: 20, price: 12 },
  LARGE:  { hours: 6, duration: 30, questionCount: 30, price: 18 },
} as const;

export type TierName = keyof typeof TIER_METRICS;

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
 * Calculates total hours, original price, discount percentage, and discounted price for a bundle of tests.
 */
export function calculateBundlePricing(tests: Array<{ hours?: number; price?: number }>) {
  const totalHours = tests.reduce((acc, t) => acc + (t.hours || 0), 0);
  const originalPrice = totalHours * PRICE_PER_CPE_HOUR;
  const discountPercentage = calculateDiscountPercentage(totalHours);
  const discountedPrice = Math.round(originalPrice * (1 - discountPercentage / 100));

  return {
    totalHours,
    originalPrice,
    discountPercentage,
    discountedPrice,
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
