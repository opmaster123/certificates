export interface ConfirmBundleDto {
  variantIds: string[];
}

export interface ProgressBundleDto {
  testVariantId: string;
}

export interface ActiveBundleItem {
  variantId: string;
  testId: string;
  testTitle: string;
  arabicTitle: string;
  englishTitle: string;
  cert?: string | null;
  tierName?: string | null;
  hours: number;
  duration: number;
  questionCount: number;
  price: number;
  finished: boolean;
  finishedAt?: Date | string | null;
}

export interface ActiveBundleLock {
  id: string;
  userId: string;
  createdAt: Date | string;
  tests: ActiveBundleItem[];
  totalHours: number;
  originalPrice: number;
  discountPercentage: number;
  discountedPrice: number;
  discountAmount: number;
  nextTier?: any;
}

export interface ActiveIndividualTestLock {
  id: string;
  userId: string;
  createdAt: Date | string;
  testVariantId: string;
  testTitle: string;
  arabicTitle?: string | null;
  englishTitle?: string | null;
  cert?: string | null;
  tierName?: string | null;
  hours: number;
  duration: number;
  questionCount: number;
  price: number;
}

export interface ActiveLock {
  type: 'bundle' | 'individual';
  isBundle: boolean;
  isReadyForPayment: boolean;
  finishedCount: number;
  totalCount: number;
  items: any[];
  payablePrice: number;
  originalPrice: number;
  discountPercentage: number;
  discountAmount: number;
  totalCpe: number;
  bundle?: ActiveBundleLock | null;
  individualTest?: ActiveIndividualTestLock | null;
}
