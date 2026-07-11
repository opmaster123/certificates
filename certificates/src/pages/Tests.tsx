import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { testVariantsService } from '@/services/test-variants';
import { authService } from '@/services/auth';
import {
  calculateBundlePricing,
  calculateDiscountPercentage,
  TIER_METRICS,
  type TierName,
} from '@shared/pricing';
import type { ActiveBundleLock, ActiveIndividualTestLock } from '@shared/dtos-and-types';
import {
  Search,
  Clock,
  FileText,
  Target,
  LayoutGrid,
  List,
  X,
  ShoppingCart,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Unlock,
  Check,
  CreditCard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import DashboardLayout from '@/components/DashboardLayout';

const chipFilters = ['CIA', 'CMA', 'CPA', 'CFE', 'CISA'];

const certColor = (c: string) => {
  if (c === 'CIA') return 'bg-primary/10 text-primary';
  if (c === 'CMA') return 'bg-secondary/10 text-secondary';
  if (c === 'CPA') return 'bg-accent/10 text-accent';
  if (c === 'CFE') return 'bg-destructive/10 text-destructive';
  return 'bg-indigo-500/10 text-indigo-500';
};

const Tests = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeChips, setActiveChips] = useState<Set<string>>(new Set());
  const [testVariants, setTestVariants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Cart State (survives refresh)
  const [cart, setCart] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('certificates_cart');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed)
        ? parsed.map((item) => {
            const tier = item.tierName as TierName;
            if (tier && TIER_METRICS[tier]) {
              return { ...item, price: TIER_METRICS[tier].price };
            }
            return item;
          })
        : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<any | null>(null);

  // Confirmed Bundle and Locks states (synced to backend)
  const [confirmedBundle, setConfirmedBundle] = useState<ActiveBundleLock | null>(null);
  const [takenTests, setTakenTests] = useState<string[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [hasIndividualLock, setHasIndividualLock] = useState(false);
  const [individualLock, setIndividualLock] = useState<ActiveIndividualTestLock | null>(null);

  const [permanentPassed, setPermanentPassed] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('certificates_passed_tests');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const { user, refreshUser } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    localStorage.setItem('certificates_cart', JSON.stringify(cart));
  }, [cart]);

  // Synchronize lock status directly from user context
  useEffect(() => {
    if (user?.activeIndividualTest) {
      setHasIndividualLock(true);
      setIndividualLock(user.activeIndividualTest);
      setIsLocked(true);
      setConfirmedBundle(null);
      setTakenTests([]);
    } else if (user?.activeBundle) {
      setHasIndividualLock(false);
      setIndividualLock(null);
      setConfirmedBundle(user.activeBundle);
      const finishedIds = user.activeBundle.tests
        ? user.activeBundle.tests.filter((t: any) => t.finished).map((t: any) => t.variantId)
        : [];
      setTakenTests(finishedIds);
      setIsLocked(true);
    } else {
      setHasIndividualLock(false);
      setIndividualLock(null);
      setConfirmedBundle(null);
      setTakenTests([]);
      setIsLocked(false);
    }
  }, [user]);

  const fetchTestVariants = async (pageToFetch: number, isInitial = false) => {
    if (isInitial) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    const certParam = Array.from(activeChips).join(',');
    const res = await testVariantsService.getTestVariants({
      page: pageToFetch,
      cert: certParam || undefined,
    });

    const items = res?.items || res?.data || (Array.isArray(res) ? res : []);
    const more = res?.hasMore ?? false;
    const total = res?.total ?? items.length;

    if (isInitial) {
      setTestVariants(items);
    } else {
      setTestVariants((prev) => {
        const existingIds = new Set(prev.map((v: any) => v.id));
        const newItems = items.filter((v: any) => !existingIds.has(v.id));
        return [...prev, ...newItems];
      });
    }

    setHasMore(more);
    setTotalCount(total);
    setPage(pageToFetch);
    setLoading(false);
    setLoadingMore(false);
  };

  useEffect(() => {
    refreshUser();
  }, []);

  useEffect(() => {
    fetchTestVariants(1, true);
  }, [activeChips]);

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;
    fetchTestVariants(page + 1, false);
  };

  const toggleChip = (chip: string) => {
    setActiveChips((prev) => {
      const next = new Set(prev);
      if (next.has(chip)) {
        next.delete(chip);
      } else {
        next.add(chip);
      }
      return next;
    });
  };

  const getCartItemTitle = (item: any) => {
    const foundByVariant = testVariants.find((v: any) => v.id === item.variantId);
    if (foundByVariant?.test) {
      const full =
        foundByVariant.test.arabicTitle ||
        foundByVariant.test.englishTitle ||
        foundByVariant.test.title;
      if (full) return full;
    }

    const foundGroup = groupedTests.find(
      (g: any) => g.id === item.testId || g.variants.some((v: any) => v.id === item.variantId)
    );
    if (foundGroup) {
      const full = foundGroup.arabicTitle || foundGroup.title || foundGroup.englishTitle;
      if (full) return full;
    }

    if (item.arabicTitle) return item.arabicTitle;
    if (item.testTitle && item.testTitle !== 'اختبار التقييم' && item.testTitle !== 'undefined') {
      return item.testTitle;
    }
    if (item.englishTitle) return item.englishTitle;
    if (item.title) return item.title;

    return item.testTitle || item.arabicTitle || item.englishTitle || 'اختبار التقييم';
  };

  // Auto-heal any cart items missing titles from previous sessions
  useEffect(() => {
    if (testVariants.length > 0 && cart.length > 0) {
      let changed = false;
      const updated = cart.map((item) => {
        const found = testVariants.find((v: any) => v.id === item.variantId);
        if (found?.test) {
          const fullTitle = found.test.arabicTitle || found.test.englishTitle || found.test.title;
          if (fullTitle && item.testTitle !== fullTitle) {
            changed = true;
            return {
              ...item,
              testTitle: fullTitle,
              arabicTitle: found.test.arabicTitle || item.arabicTitle,
              englishTitle: found.test.englishTitle || item.englishTitle,
              cert: found.test.cert || item.cert,
            };
          }
        }
        return item;
      });
      if (changed) {
        setCart(updated);
      }
    }
  }, [testVariants]);

  const addToCart = (item: any) => {
    const title = getCartItemTitle(item);
    const itemWithTitle = { ...item, testTitle: title };
    setCart((prev) => {
      if (prev.some((i) => i.variantId === item.variantId)) return prev;
      return [...prev, itemWithTitle];
    });
  };

  const removeFromCart = (variantId: string) => {
    setCart((prev) => prev.filter((i) => i.variantId !== variantId));
  };

  const clearCart = () => {
    if (cart.length === 0) return;
    setCart([]);
    localStorage.removeItem('certificates_cart');
  };

  // Handle Escape key and body scroll lock when side-by-side pricing modal is open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isModalOpen]);

  const {
    totalHours: totalCartHours,
    originalPrice: totalCartPrice,
    discountPercentage,
    discountedPrice: discountedCartPrice,
    discountAmount: cartDiscountAmount,
    nextTier: cartNextTier,
  } = calculateBundlePricing(cart);

  const isBundleCompleted = !!(
    confirmedBundle &&
    confirmedBundle.tests &&
    confirmedBundle.tests.length > 0 &&
    confirmedBundle.tests.every((t: any) => takenTests.includes(t.variantId))
  );

  // Detect Bundle Completion
  useEffect(() => {
    if (confirmedBundle && confirmedBundle.tests && confirmedBundle.tests.length > 0) {
      const allFinished = confirmedBundle.tests.every((t: any) => takenTests.includes(t.variantId));
      if (allFinished) {
        const hasShown = localStorage.getItem(
          `certificates_bundle_congrats_shown_${confirmedBundle.id}`
        );
        if (!hasShown) {
          setIsCompletionModalOpen(true);
          localStorage.setItem(`certificates_bundle_congrats_shown_${confirmedBundle.id}`, 'true');
        }
      }
    }
  }, [confirmedBundle, takenTests]);

  const handleConfirmBundle = async () => {
    if (!user) {
      toast({
        title: 'تسجيل الدخول مطلوب',
        description: 'يجب تسجيل الدخول أو إنشاء حساب أولاً لتأكيد حجز الباقة والبدء في الاختبارات.',
        variant: 'destructive',
      });
      setIsConfirmModalOpen(false);
      navigate('/login?redirect=/tests');
      return;
    }

    const variantIds = cart
      .map((item) => item.variantId || item.id)
      .filter((id) => typeof id === 'string' && id.trim().length > 0);

    const firstCartVariantId = variantIds[0];

    // If cart has no items, but user already has an active bundle, redirect directly to the active test!
    if (variantIds.length === 0) {
      if (confirmedBundle?.tests && confirmedBundle.tests.length > 0) {
        const firstActiveTest =
          confirmedBundle.tests.find((t: any) => !takenTests.includes(t.variantId)) ||
          confirmedBundle.tests[0];
        if (firstActiveTest?.variantId) {
          setIsConfirmModalOpen(false);
          setIsModalOpen(false);
          setIsCartOpen(false);
          window.location.href = `/test/${firstActiveTest.variantId}`;
          return;
        }
      }

      toast({
        title: 'السلة فارغة',
        description: 'يرجى إضافة اختبارات صالحة إلى السلة أولاً.',
        variant: 'destructive',
      });
      return;
    }

    setIsConfirming(true);

    try {
      const res = await testVariantsService.confirmBundle(variantIds);

      let targetVariantId =
        res?.items?.[0]?.testVariantId ||
        res?.items?.[0]?.testVariant?.id ||
        res?.tests?.[0]?.variantId ||
        firstCartVariantId;

      if (res) {
        setCart([]);
        localStorage.removeItem('certificates_cart');
        setIsConfirmModalOpen(false);
        setIsModalOpen(false);
        setIsCartOpen(false);

        toast({
          title: 'تم تأكيد حجز باقة الاختبارات!',
          description: 'جاري الانتقال إلى أول اختبار في الباقة...',
        });

        refreshUser().catch(() => {});

        if (targetVariantId) {
          window.location.href = `/test/${targetVariantId}`;
          return;
        }
      } else {
        // If confirmBundle returned null (e.g. bundle already active in database)
        const activeBundle = await testVariantsService.getActiveBundle();
        if (activeBundle && activeBundle.tests && activeBundle.tests.length > 0) {
          setCart([]);
          localStorage.removeItem('certificates_cart');
          setIsConfirmModalOpen(false);
          setIsModalOpen(false);
          setIsCartOpen(false);

          const firstUnfinished =
            activeBundle.tests.find((t: any) => !t.finished) || activeBundle.tests[0];
          targetVariantId = firstUnfinished?.variantId || targetVariantId;

          toast({
            title: 'تم تفعيل باقة الاختبارات!',
            description: 'جاري الانتقال إلى أول اختبار في الباقة...',
          });

          refreshUser().catch(() => {});

          if (targetVariantId) {
            window.location.href = `/test/${targetVariantId}`;
            return;
          }
        }
      }
    } catch (err) {
      console.error('Error confirming bundle:', err);
      if (firstCartVariantId) {
        window.location.href = `/test/${firstCartVariantId}`;
        return;
      }
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancelActive = async () => {
    const res = await authService.cancelActive();
    if (res) {
      setConfirmedBundle(null);
      setTakenTests([]);
      setHasIndividualLock(false);
      setIndividualLock(null);
      setIsLocked(false);
      setIsCancelModalOpen(false);
      setIsModalOpen(false);
      setIsCartOpen(false);
      toast({
        title: res.type === 'bundle' ? 'تم إلغاء حجز الباقة' : 'تم إلغاء الاختبار',
        description:
          res.type === 'bundle'
            ? 'تم إلغاء الباقة وحذف جميع التقدم المحرز في الاختبارات المشمولة بها.'
            : 'تم حذف الاختبار الفردي وإلغاء القفل بنجاح.',
        variant: res.type === 'bundle' ? 'destructive' : 'default',
      });
      await refreshUser();
    }
  };

  const handleCancelBundle = handleCancelActive;
  const handleCancelIndividualTest = handleCancelActive;

  const handleCompleteBundle = () => {
    setIsCompletionModalOpen(false);
    navigate('/payment');
  };

  const hoursByCert = cart.reduce<Record<string, number>>((acc, item) => {
    acc[item.cert] = (acc[item.cert] || 0) + item.hours;
    return acc;
  }, {});

  // Group variants by testId
  const groupedTests = (() => {
    const grouped: Record<
      string,
      {
        id: string;
        title: string;
        arabicTitle?: string;
        englishTitle?: string;
        desc: string;
        cert: string;
        variants: any[];
      }
    > = {};

    testVariants.forEach((variant) => {
      const test = variant.test;
      if (!test) return;
      if (!grouped[test.id]) {
        grouped[test.id] = {
          id: test.id,
          title: test.arabicTitle || test.englishTitle || test.title || 'اختبار التقييم',
          arabicTitle: test.arabicTitle,
          englishTitle: test.englishTitle,
          desc: test.desc,
          cert: test.cert,
          variants: [],
        };
      }
      grouped[test.id].variants.push(variant);
    });

    const tierOrder: Record<string, number> = {
      SMALL: 1,
      small: 1,
      MEDIUM: 2,
      medium: 2,
      LARGE: 3,
      large: 3,
    };

    return Object.values(grouped).map((group) => {
      group.variants.sort((a, b) => (tierOrder[a.tierName] || 0) - (tierOrder[b.tierName] || 0));
      return group;
    });
  })();

  const renderCartContent = () => {
    if (hasIndividualLock && individualLock) {
      return (
        <>
          <div className="flex flex-col space-y-1 text-right border-b border-border pb-3">
            <h2 className="text-base font-heading font-bold text-foreground flex items-center gap-2 justify-end">
              <span>اختبار فردي مستحق الدفع</span>
              <Lock className="h-4 w-4 text-amber-500 animate-pulse" />
            </h2>
            <p className="text-xs text-muted-foreground text-right font-sans leading-relaxed">
              لقد أكملت هذا الاختبار بنجاح. لإصدار الشهادة الرسمية وتثبيتها في حسابك، يرجى التوجه
              لخطوة الدفع.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
            <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 flex items-start justify-between gap-3">
              <div className="flex-1 text-right space-y-1 min-w-0">
                <Badge
                  className={`${certColor(individualLock.cert)} border-0 text-[10px] px-1.5 py-0`}
                >
                  {individualLock.cert}
                </Badge>
                <h4 className="font-heading font-bold text-xs text-foreground leading-snug break-words">
                  {individualLock.testTitle}
                </h4>
                <div className="flex items-center gap-2 justify-end text-[11px] text-muted-foreground">
                  <span>⏱️ {individualLock.duration} دقيقة</span>
                  <span>📚 {individualLock.hours} ساعة CPE</span>
                  <span className="font-semibold text-primary">
                    {individualLock.tierName === 'SMALL'
                      ? 'مبتدئ'
                      : individualLock.tierName === 'MEDIUM'
                        ? 'متوسط'
                        : 'متقدم'}
                  </span>
                </div>
              </div>
              <div className="text-left font-heading font-bold text-xs text-foreground">
                {individualLock.price} $
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-3 mt-auto space-y-2.5">
            <div className="flex justify-between items-center text-sm font-bold">
              <span className="text-foreground">المبلغ المطلوب:</span>
              <span className="text-primary font-black text-base">{individualLock.price} $</span>
            </div>

            <Button
              onClick={() => {
                setIsCartOpen(false);
                setIsModalOpen(false);
                navigate('/payment');
              }}
              className="w-full h-10 gradient-primary font-heading font-bold text-xs rounded-xl shadow-md hover:opacity-95 transition-opacity flex items-center justify-center gap-1.5"
            >
              <CreditCard className="h-4 w-4" /> الانتقال إلى صفحة الدفع وإصدار الشهادة
            </Button>

            <Button
              variant="outline"
              className="w-full h-9 border-destructive/30 text-destructive hover:bg-destructive/10 font-heading font-bold text-xs rounded-xl transition-colors"
              onClick={handleCancelIndividualTest}
            >
              <Trash2 className="ml-1 h-3.5 w-3.5" /> إلغاء الاختبار وحذف النتيجة
            </Button>
          </div>
        </>
      );
    }

    if (confirmedBundle) {
      return (
        <>
          <div className="flex flex-col space-y-1 text-right border-b border-border pb-3">
            <h2 className="text-base font-heading font-bold text-foreground flex items-center gap-2 justify-end">
              <span>باقة الاختبارات المحجوزة</span>
              <Lock className="h-4 w-4 text-primary animate-pulse" />
            </h2>
            <p className="text-xs text-muted-foreground text-right font-sans leading-relaxed">
              تفاصيل باقتك المؤكدة وحالة التقدم في الاختبارات المشمولة. لا يمكن تعديل هذه الباقة.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto py-3 space-y-3">
            {/* Progress Stats */}
            <div className="bg-muted/30 border border-border rounded-xl p-3 space-y-2 text-right">
              <div className="flex justify-between items-center text-[11px] font-semibold">
                <span className="text-muted-foreground">حالة إنجاز الباقة:</span>
                <span className="text-foreground font-bold">
                  {
                    confirmedBundle.tests.filter((t: any) => takenTests.includes(t.variantId))
                      .length
                  }{' '}
                  من {confirmedBundle.tests.length} اختبارات
                </span>
              </div>
              {/* Progress Bar */}
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full gradient-primary transition-all duration-500 rounded-full"
                  style={{
                    width: `${(confirmedBundle.tests.filter((t: any) => takenTests.includes(t.variantId)).length / confirmedBundle.tests.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="content-start items-start space-y-2.5">
              {confirmedBundle.tests.map((item: any) => {
                const isCompleted = takenTests.includes(item.variantId);
                return (
                  <div
                    key={item.variantId}
                    className={cn(
                      'flex items-start justify-between gap-2.5 p-2.5 rounded-xl border transition-all duration-200 shadow-sm',
                      isCompleted
                        ? 'border-success/30 bg-success/5'
                        : 'border-border bg-muted/10 hover:bg-muted/20'
                    )}
                  >
                    {isCompleted ? (
                      <Badge className="bg-success/10 text-success border-success/20 text-[10px] px-1.5 py-0.5 mt-0.5 flex items-center gap-1 font-sans">
                        <Check className="h-3 w-3" />
                        مكتمل
                      </Badge>
                    ) : (
                      <Button
                        asChild
                        size="sm"
                        className="gradient-primary border-0 text-primary-foreground hover:opacity-90 text-[10px] font-bold h-6 px-2.5 rounded-lg font-heading"
                        onClick={() => {
                          setIsCartOpen(false);
                          setIsModalOpen(false);
                        }}
                      >
                        <Link to={`/test/${item.variantId}`}>ابدأ الآن</Link>
                      </Button>
                    )}

                    <div className="flex-1 text-right min-w-0">
                      <Badge
                        className={`${certColor(item.cert)} border-0 text-[10px] px-1.5 py-0 mb-1`}
                      >
                        {item.cert}
                      </Badge>
                      <h4 className="font-heading font-bold text-xs text-foreground leading-snug break-words">
                        {getCartItemTitle(item)}
                      </h4>
                      <div className="flex items-center gap-2 justify-end mt-1 text-[11px] text-muted-foreground">
                        <span>⏱️ {item.duration} دقيقة</span>
                        <span>📚 {item.hours} ساعة CPE</span>
                        <span className="font-semibold text-primary">
                          {item.tierName.toUpperCase() === 'SMALL'
                            ? 'مبتدئ'
                            : item.tierName.toUpperCase() === 'MEDIUM'
                              ? 'متوسط'
                              : 'متقدم'}
                        </span>
                      </div>
                    </div>

                    <div className="text-left font-heading font-bold text-xs text-foreground pt-0.5 min-w-[42px]">
                      {item.price} $
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t border-border pt-3 mt-auto space-y-2.5">
            <div className="space-y-1.5 text-right">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground font-semibold">ساعات CPE الإجمالية:</span>
                <span className="font-bold text-foreground">{confirmedBundle.totalHours} ساعة</span>
              </div>
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>السعر الأصلي:</span>
                <span className="line-through">{confirmedBundle.originalPrice} $</span>
              </div>
              {confirmedBundle.discountPercentage > 0 && (
                <div className="flex justify-between items-center text-xs text-green-500 font-semibold">
                  <span>خصم الباقة ({confirmedBundle.discountPercentage}%):</span>
                  <span>-{confirmedBundle.originalPrice - confirmedBundle.discountedPrice} $</span>
                </div>
              )}
              <div className="flex justify-between items-center text-sm font-bold border-t border-border/40 pt-1.5">
                <span className="text-foreground">القيمة الإجمالية للباقة:</span>
                <span className="text-primary font-black text-base">
                  {confirmedBundle.discountedPrice} $
                </span>
              </div>
            </div>

            {isBundleCompleted ? (
              <Button
                onClick={() => {
                  setIsCartOpen(false);
                  setIsModalOpen(false);
                  navigate('/payment');
                }}
                className="w-full h-10 gradient-primary font-heading font-bold text-xs rounded-xl shadow-md hover:opacity-95 transition-opacity flex items-center justify-center gap-1.5"
              >
                <CreditCard className="h-4 w-4" /> الانتقال إلى الدفع وإصدار الشهادات
              </Button>
            ) : null}

            <Button
              variant={isBundleCompleted ? 'outline' : 'destructive'}
              className={`w-full h-9 ${
                isBundleCompleted
                  ? 'border-destructive/30 text-destructive hover:bg-destructive/10'
                  : ''
              } font-heading font-bold text-xs rounded-xl transition-colors`}
              onClick={() => setIsCancelModalOpen(true)}
            >
              <Trash2 className="ml-1 h-3.5 w-3.5" /> إلغاء حجز الباقة والبدء من جديد
            </Button>
            <p className="text-[10px] text-destructive text-center leading-relaxed font-semibold">
              ⚠️ انتبه: إلغاء الباقة سيؤدي إلى فقدان جميع التقدم المحرز في الاختبارات التي أكملتها
              أو بدأتها ضمنها.
            </p>
          </div>
        </>
      );
    }

    return (
      <>
        <div className="flex flex-col space-y-1 text-right border-b border-border pb-3">
          <div className="flex items-center justify-between gap-2 pl-6">
            <h2 className="text-base font-heading font-bold text-foreground flex items-center gap-2 justify-end">
              <span>سلة الاختبارات المختارة</span>
              <ShoppingCart className="h-4 w-4 text-primary" />
            </h2>
            {cart.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-[11px] text-destructive hover:text-destructive hover:bg-destructive/10 h-7 px-2 flex items-center gap-1 font-heading font-bold rounded-lg transition-colors"
                onClick={clearCart}
                title="حذف جميع العناصر من السلة"
              >
                <Trash2 className="h-3 w-3" />
                <span>حذف الكل</span>
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground text-right">
            المواد والشهادات التي اخترتها. قم بتأكيد طلبك للبدء في الاختبارات.
          </p>
        </div>

        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-8 text-muted-foreground">
            <ShoppingCart className="h-12 w-12 text-muted-foreground/20 mb-3 stroke-[1.2]" />
            <p className="text-sm font-semibold">السلة فارغة حالياً</p>
            <p className="text-[11px] text-muted-foreground mt-1 text-center max-w-[180px] leading-relaxed">
              تصفح الاختبارات وأضف الباقات والشهادات التي ترغب في دراستها.
            </p>
          </div>
        ) : (
          <>
            {/* Dynamic Discount Tier Banner */}
            <div className="pt-2 pb-1">
              {totalCartHours < 10 ? (
                <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-2.5 space-y-1 text-right">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1 font-heading">
                      خصم 20% يبدأ من 10 ساعات
                    </span>
                    <span className="font-semibold text-muted-foreground text-[10px] font-mono">
                      {totalCartHours} / 10 س
                    </span>
                  </div>
                  <div className="w-full bg-amber-500/20 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (totalCartHours / 10) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground font-sans leading-tight">
                    أضف{' '}
                    <strong className="text-foreground font-semibold">
                      {10 - totalCartHours} ساعة إضافية
                    </strong>{' '}
                    لتفعيل خصم 20% على كامل الباقة!
                  </p>
                </div>
              ) : totalCartHours < 20 ? (
                <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-xl p-2.5 space-y-1 text-right">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 font-heading">
                      تم تفعيل خصم 20%! 🎉
                    </span>
                    <span className="font-semibold text-muted-foreground text-[10px] font-mono">
                      {totalCartHours} / 20 س
                    </span>
                  </div>
                  <div className="w-full bg-emerald-500/20 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, ((totalCartHours - 10) / 10) * 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground font-sans leading-tight">
                    أنت توفر الآن{' '}
                    <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                      {cartDiscountAmount} $
                    </strong>
                    . أضف{' '}
                    <strong className="text-foreground font-semibold">
                      {20 - totalCartHours} ساعة أخرى
                    </strong>{' '}
                    للحصول على أعلى خصم (30%)!
                  </p>
                </div>
              ) : (
                <div className="bg-primary/10 border border-primary/25 rounded-xl p-2.5 flex items-center justify-between text-right">
                  <div className="space-y-0.5">
                    <div className="font-bold text-primary text-[11px] flex items-center gap-1 font-heading">
                      الخصم الأقصى مفعل (30%)! 🔥
                    </div>
                    <p className="text-[10px] text-muted-foreground font-sans">
                      تم تطبيق أعلى نسبة خصم للباقات. إجمالي التوفير:{' '}
                      <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                        {cartDiscountAmount} $
                      </strong>
                    </p>
                  </div>
                  <Badge className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5">
                    30% خصم
                  </Badge>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto py-2 pr-1 content-start items-start space-y-2">
              {cart.map((item) => (
                <div
                  key={item.variantId}
                  className="flex items-start justify-between gap-2.5 p-2.5 rounded-xl border border-border bg-muted/10 hover:bg-muted/30 transition-all duration-200 shadow-sm"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg h-7 w-7 mt-0.5 transition-colors"
                    onClick={() => removeFromCart(item.variantId)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>

                  <div className="flex-1 text-right min-w-0">
                    <Badge
                      className={`${certColor(item.cert)} border-0 text-[10px] px-1.5 py-0 mb-1`}
                    >
                      {item.cert}
                    </Badge>
                    <h4 className="font-heading font-bold text-xs text-foreground leading-snug break-words">
                      {getCartItemTitle(item)}
                    </h4>
                    <div className="flex items-center gap-2 justify-end mt-1 text-[11px] text-muted-foreground">
                      <span>⏱️ {item.duration} دقيقة</span>
                      <span>📚 {item.hours} ساعة CPE</span>
                      <span className="font-semibold text-primary">
                        {item.tierName.toUpperCase() === 'SMALL'
                          ? 'مبتدئ'
                          : item.tierName.toUpperCase() === 'MEDIUM'
                            ? 'متوسط'
                            : 'متقدم'}
                      </span>
                    </div>
                  </div>

                  <div className="text-left font-heading font-bold text-xs text-foreground pt-0.5 min-w-[42px]">
                    {item.price} $
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-3 mt-auto space-y-2.5">
              <div className="space-y-1.5 text-right">
                {Object.keys(hoursByCert).map((cert) => {
                  const hours = hoursByCert[cert] ?? 0;

                  return (
                    <div
                      key={cert}
                      className="flex justify-between items-center text-[11px] text-muted-foreground"
                    >
                      <span>ساعات {cert}:</span>
                      <span>{hours} ساعة</span>
                    </div>
                  );
                })}

                <div className="flex justify-between items-center text-xs border-t border-border/40 pt-1.5">
                  <span className="text-muted-foreground font-semibold">إجمالي ساعات CPE:</span>
                  <span className="font-bold text-foreground">{totalCartHours} ساعة</span>
                </div>

                {discountPercentage > 0 ? (
                  <>
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>السعر الأصلي:</span>
                      <span className="line-through">{totalCartPrice} $</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                      <span className="flex items-center gap-1">
                        خصم الباقة ({discountPercentage}%):
                      </span>
                      <span>-{cartDiscountAmount} $</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-bold border-t border-border/40 pt-1.5">
                      <span className="text-foreground">الإجمالي النهائي المطلوب:</span>
                      <span className="text-primary font-black text-base">
                        {discountedCartPrice} $
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between items-center text-sm font-bold border-t border-border/40 pt-1.5">
                    <span className="text-foreground">الإجمالي المطلوب:</span>
                    <span className="text-primary font-black text-base">{totalCartPrice} $</span>
                  </div>
                )}
              </div>

              <Button
                className="w-full h-10 font-heading font-bold text-xs text-primary-foreground gradient-primary border-0 rounded-xl shadow-md shadow-primary/10 hover:opacity-95 transition-opacity flex items-center justify-center gap-2"
                onClick={handleConfirmBundle}
                disabled={isConfirming}
              >
                {isConfirming ? (
                  <div className="flex items-center gap-2 justify-center">
                    <div className="h-3.5 w-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    <span>جاري التأكيد والانتقال...</span>
                  </div>
                ) : (
                  <span>تأكيد حجز هذه الاختبارات</span>
                )}
              </Button>
            </div>
          </>
        )}
      </>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Header + Cart Trigger */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-border/40 pb-4">
          <div>
            <h1 className="text-xl font-heading font-bold text-foreground">الاختبارات المتاحة</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              اختر اختبارًا لبدء كسب ساعات التعليم المهني المستمر
            </p>
          </div>

          <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className="relative flex items-center gap-2.5 border-primary/20 hover:border-primary/50 bg-card/65 backdrop-blur-sm px-3.5 py-2.5 h-auto rounded-xl transition-all shadow-sm hover:shadow-md hover:bg-card group animate-in fade-in slide-in-from-top-2 duration-300"
              >
                <div className="relative">
                  {hasIndividualLock ? (
                    <Lock className="h-4 w-4 text-amber-500 group-hover:scale-110 transition-transform duration-200" />
                  ) : (
                    <ShoppingCart className="h-4 w-4 text-primary group-hover:scale-110 transition-transform duration-200" />
                  )}
                  {(hasIndividualLock
                    ? 1
                    : confirmedBundle
                      ? confirmedBundle.tests.length
                      : cart.length) > 0 && (
                    <span
                      className={`absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full ${
                        hasIndividualLock ? 'bg-amber-500' : 'bg-primary'
                      } text-primary-foreground text-[9px] font-bold animate-pulse`}
                    >
                      {hasIndividualLock
                        ? 1
                        : confirmedBundle
                          ? confirmedBundle.tests.length
                          : cart.length}
                    </span>
                  )}
                </div>
                <div className="text-right text-xs">
                  <div className="font-bold text-foreground text-[11px]">
                    {hasIndividualLock
                      ? 'اختبار فردي مكتمل'
                      : confirmedBundle
                        ? 'الباقة المحجوزة'
                        : 'سلة الاختبارات'}
                  </div>
                  <div className="text-muted-foreground text-[10px]">
                    {hasIndividualLock && individualLock
                      ? `${individualLock.hours} ساعة - ${individualLock.price} $`
                      : confirmedBundle
                        ? `${confirmedBundle.totalHours} ساعة - ${confirmedBundle.discountedPrice} $`
                        : discountPercentage > 0
                          ? `${totalCartHours} ساعة - ${discountedCartPrice} $ (خصم ${discountPercentage}%)`
                          : `${totalCartHours} ساعة - ${totalCartPrice} $`}
                  </div>
                </div>
              </Button>
            </SheetTrigger>

            <SheetContent
              className="w-full sm:max-w-md bg-card border-l border-border p-4 flex flex-col h-full text-right transition-all duration-300"
              side="right"
            >
              {renderCartContent()}
            </SheetContent>
          </Sheet>
        </div>

        {confirmedBundle &&
          (isBundleCompleted ? (
            <div
              className="bg-success/10 border border-success/30 text-success rounded-xl p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 animate-in fade-in duration-300 text-right"
              dir="rtl"
            >
              <div className="flex gap-2.5">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-success" />
                <div>
                  <p className="font-bold text-xs text-foreground">
                    تهانينا! اكتملت جميع اختبارات باقتك بنجاح
                  </p>
                  <p className="text-[11px] mt-0.5 text-muted-foreground leading-relaxed font-sans">
                    لقد أنهيت جميع الاختبارات المشمولة في الباقة. الخطوة النهائية هي إتمام الدفع
                    لإصدار وتثبيت الشهادات المعتمدة في حسابك.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 self-end sm:self-center">
                <Button
                  size="sm"
                  className="gradient-primary border-0 text-primary-foreground font-bold whitespace-nowrap shadow-sm font-heading h-8 text-xs"
                  onClick={() => navigate('/payment')}
                >
                  <CreditCard className="ml-1.5 h-3.5 w-3.5" /> إتمام الدفع وإصدار الشهادات
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-border/60 hover:bg-muted whitespace-nowrap font-bold font-heading h-8 text-xs"
                  onClick={() => setIsCartOpen(true)}
                >
                  عرض التفاصيل
                </Button>
              </div>
            </div>
          ) : (
            <div
              className="bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-xl p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 animate-in fade-in duration-300 text-right"
              dir="rtl"
            >
              <div className="flex gap-2.5">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
                <div>
                  <p className="font-bold text-xs text-foreground">
                    لديك باقة اختبارات نشطة ومحجوزة حالياً
                  </p>
                  <p className="text-[11px] mt-0.5 text-muted-foreground leading-relaxed font-sans">
                    يرجى إكمال جميع الاختبارات المشمولة في الباقة للحصول على السعر النهائي المخفض.
                    لا يمكن تعديل الباقة أو البدء باختبارات خارجها إلا بعد إكمالها أو إلغائها.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="border-amber-500/30 text-amber-700 hover:bg-amber-500/20 whitespace-nowrap self-end sm:self-center font-bold h-8 text-xs"
                onClick={() => setIsCartOpen(true)}
              >
                عرض تفاصيل الباقة
              </Button>
            </div>
          ))}

        {hasIndividualLock && individualLock && (
          <div
            className="bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-xl p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 animate-in fade-in duration-300 text-right"
            dir="rtl"
          >
            <div className="flex gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
              <div>
                <p className="font-bold text-xs text-foreground">
                  لديك اختبار فردي مكتمل وغير مدفوع
                </p>
                <p className="text-[11px] mt-0.5 text-muted-foreground leading-relaxed font-sans">
                  لقد أكملت بنجاح اختبار {individualLock.testTitle} ({individualLock.hours} ساعات
                  CPE). يرجى التوجه لإتمام الدفع لإصدار الشهادة الرسمية أو إلغاء الاختبار لحجز باقات
                  أخرى.
                </p>
              </div>
            </div>
            <div className="flex gap-2 self-end sm:self-center">
              <Button
                size="sm"
                className="gradient-primary border-0 text-primary-foreground font-bold whitespace-nowrap shadow-sm font-heading h-8 text-xs"
                onClick={() => navigate('/payment')}
              >
                <CreditCard className="ml-1.5 h-3.5 w-3.5" /> الانتقال إلى الدفع
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-destructive/30 text-destructive hover:bg-destructive/10 whitespace-nowrap font-bold font-heading h-8 text-xs"
                onClick={handleCancelIndividualTest}
              >
                <Trash2 className="ml-1 h-3.5 w-3.5" /> إلغاء الاختبار
              </Button>
            </div>
          </div>
        )}

        {/* Chip Filters */}
        <div className="flex flex-wrap gap-1.5">
          {chipFilters.map((chip) => (
            <button
              key={chip}
              onClick={() => toggleChip(chip)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-all border duration-200 ${
                activeChips.has(chip)
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/15'
                  : 'bg-card text-muted-foreground border-border hover:border-primary/50'
              }`}
            >
              {chip}
              {activeChips.has(chip) && <X className="inline h-3 w-3 mr-1" />}
            </button>
          ))}
          {activeChips.size > 0 && (
            <button
              onClick={() => setActiveChips(new Set())}
              className="text-xs text-destructive hover:underline px-2 transition-all"
            >
              مسح الكل
            </button>
          )}
        </div>

        {/* Result count */}
        <p className="text-xs text-muted-foreground">عرض {groupedTests.length} اختبار</p>

        {/* Tests Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={viewMode === 'grid' ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3' : 'space-y-3'}
        >
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-card p-4 animate-pulse flex flex-col justify-between h-[230px]"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="h-5 w-10 rounded bg-muted-foreground/20" />
                    <div className="h-4 w-20 rounded bg-muted-foreground/15" />
                  </div>
                  <div className="h-6 w-3/4 rounded bg-muted-foreground/20 mb-2" />
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-full rounded bg-muted-foreground/15" />
                    <div className="h-3.5 w-11/12 rounded bg-muted-foreground/15" />
                    <div className="h-3.5 w-2/3 rounded bg-muted-foreground/15" />
                  </div>
                </div>
                <div>
                  <div className="flex gap-3 border-t border-border/40 pt-3">
                    <div className="h-3.5 w-16 rounded bg-muted-foreground/15" />
                    <div className="h-3.5 w-14 rounded bg-muted-foreground/15" />
                  </div>
                  <div className="mt-3.5 h-9 w-full rounded bg-muted-foreground/20" />
                </div>
              </div>
            ))
          ) : groupedTests.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-base font-heading font-bold text-foreground">لا توجد نتائج</p>
              <p className="mt-1 text-xs text-muted-foreground">
                لا توجد اختبارات تطابق معايير البحث. حاول تعديل الفلاتر.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 text-xs"
                onClick={() => {
                  setActiveChips(new Set());
                }}
              >
                مسح الفلاتر
              </Button>
            </div>
          ) : (
            groupedTests.map((group) => {
              const baseVariant = group.variants[0] || {};
              const topVariant = group.variants[group.variants.length - 1] || baseVariant;

              return (
                <div
                  key={group.id}
                  className="rounded-xl border border-border bg-card p-4 card-hover flex flex-col justify-between h-full group cursor-pointer hover:border-primary/50 transition-all duration-300"
                  onClick={() => {
                    setSelectedTest(group);
                    setIsCartOpen(false);
                    setIsModalOpen(true);
                  }}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <Badge
                        className={`${certColor(group.cert)} border-0 text-[10px] px-2 py-0.5`}
                      >
                        {group.cert}
                      </Badge>
                      {confirmedBundle ? (
                        group.variants.some((v: any) =>
                          confirmedBundle.tests.some((bt: any) => bt.variantId === v.id)
                        ) ? (
                          <Badge className="bg-success/10 text-success border-success/20 flex items-center gap-1 text-[10px] font-sans">
                            <Check className="h-2.5 w-2.5" />
                            مشمول بالباقة
                          </Badge>
                        ) : (
                          <Badge className="bg-muted text-muted-foreground border-0 flex items-center gap-1 text-[10px] font-sans">
                            <Lock className="h-2.5 w-2.5" />
                            غير متاح بالباقة
                          </Badge>
                        )
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-[10px] text-muted-foreground border-border bg-muted/20"
                        >
                          {group.variants.length} باقات متاحة
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-heading font-bold text-card-foreground text-base group-hover:text-primary transition-colors">
                      {group.title}
                    </h3>
                    <p className="mt-1.5 text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                      {group.desc}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground border-t border-border/40 pt-3">
                      <span className="flex items-center gap-1">
                        📚 {baseVariant.hours} - {topVariant.hours} ساعة CPE
                      </span>
                      <span className="flex items-center gap-1">
                        💰 {baseVariant.price} - {topVariant.price} $
                      </span>
                    </div>
                  </div>

                  <Button
                    className="mt-4 w-full bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground border-0 transition-all duration-200 h-9 text-xs font-semibold rounded-lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTest(group);
                      setIsCartOpen(false);
                      setIsModalOpen(true);
                    }}
                  >
                    عرض الباقات والخيارات
                  </Button>
                </div>
              );
            })
          )}
        </motion.div>

        {/* Show More Button */}
        {hasMore && !loading && (
          <div className="flex justify-center pt-6 pb-3">
            <Button
              onClick={handleLoadMore}
              disabled={loadingMore}
              variant="outline"
              className="px-6 h-10 rounded-xl border-primary/30 hover:border-primary text-primary hover:bg-primary/5 font-heading font-bold text-xs shadow-sm transition-all duration-200"
            >
              {loadingMore ? (
                <div className="flex items-center gap-2">
                  <div className="h-3.5 w-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span>جاري تحميل المزيد...</span>
                </div>
              ) : (
                <span>أظهر المزيد</span>
              )}
            </Button>
          </div>
        )}

        {/* Tier Comparison Modal + Original Full-Height Right Cart Drawer */}
        {isModalOpen && selectedTest && (
          <div className="fixed inset-0 z-50 !m-0 flex flex-row overflow-hidden" dir="rtl">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/80 animate-in fade-in-0 duration-200"
              onClick={() => setIsModalOpen(false)}
            />

            {/* 1. Original Cart Drawer on the Very Right Edge Above Sidebar */}
            <div className="relative z-10 w-full sm:max-w-md bg-card border-l border-border p-4 flex flex-col h-full text-right shadow-lg transition-all duration-300 animate-in slide-in-from-right duration-300 shrink-0">
              {renderCartContent()}
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="absolute right-3.5 top-3.5 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </button>
            </div>

            {/* 2. Original Pricing Modal Beside the Cart on the Left */}
            <div
              className="relative z-10 flex-1 h-full flex items-center justify-center p-3 sm:p-5 overflow-hidden"
              onClick={() => setIsModalOpen(false)}
            >
              <div
                className="relative w-full max-w-3xl bg-card border border-border rounded-2xl p-4 sm:p-5 overflow-y-auto max-h-[92vh] text-right shadow-lg animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="absolute right-3.5 top-3.5 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </button>

                <div className="flex flex-col space-y-1 text-right items-end border-b border-border/40 pb-3">
                  <div className="flex items-center gap-2 mb-1 w-full justify-between pl-6">
                    <Badge
                      className={`${certColor(selectedTest.cert)} border-0 text-[10px] px-2 py-0.5`}
                    >
                      {selectedTest.cert}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground font-sans">
                      اختر الباقة المناسبة لاحتياجاتك
                    </span>
                  </div>
                  <h2 className="text-lg font-heading font-bold text-foreground w-full text-right">
                    {selectedTest.title}
                  </h2>
                  <p className="text-xs text-muted-foreground leading-relaxed w-full text-right mt-1">
                    {selectedTest.desc}
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-3 mt-3.5">
                  {selectedTest.variants.map((v: any) => {
                    const isInCart = cart.some((item) => item.variantId === v.id);
                    const isSmall = v.tierName.toUpperCase() === 'SMALL';
                    const isMedium = v.tierName.toUpperCase() === 'MEDIUM';
                    const isLarge = v.tierName.toUpperCase() === 'LARGE';

                    let tierTitle = v.tierName;
                    let tierColorClass = 'border-border hover:border-primary/30';
                    let bgBadge = 'bg-muted text-muted-foreground';

                    if (isSmall) {
                      tierTitle = 'مبتدئ';
                      tierColorClass = 'border-border hover:border-blue-500/40 shadow-sm';
                      bgBadge = 'bg-blue-500/10 text-blue-500';
                    } else if (isMedium) {
                      tierTitle = 'متوسط';
                      tierColorClass =
                        'border-primary/50 shadow-md ring-1 ring-primary/20 hover:border-primary';
                      bgBadge = 'bg-primary text-primary-foreground';
                    } else if (isLarge) {
                      tierTitle = 'متقدم';
                      tierColorClass = 'border-border hover:border-amber-500/40 shadow-sm';
                      bgBadge = 'bg-amber-500/10 text-amber-500';
                    }

                    return (
                      <div
                        key={v.id}
                        className={`relative flex flex-col justify-between p-4 rounded-xl border bg-card/40 backdrop-blur-sm transition-all duration-300 ${tierColorClass}`}
                      >
                        {isMedium && (
                          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase bg-primary text-primary-foreground rounded-full shadow-sm">
                            الأكثر شعبية
                          </span>
                        )}

                        <div className="text-center">
                          <Badge
                            className={`mb-2 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${bgBadge}`}
                          >
                            {tierTitle}
                          </Badge>
                          <div className="mt-0.5 text-xl font-heading font-black text-foreground">
                            {v.price} $
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">دفع لمرة واحدة</p>

                          <div className="mt-3 space-y-2 border-t border-b border-border/50 py-2.5 text-xs text-right">
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">ساعات CPE:</span>
                              <span className="font-bold text-foreground">{v.hours} ساعة</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">عدد الأسئلة:</span>
                              <span className="font-bold text-foreground">
                                {v.questionCount} سؤال
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">المدة المتاحة:</span>
                              <span className="font-bold text-foreground">{v.duration} دقيقة</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 space-y-2">
                          {permanentPassed.includes(v.id) ? (
                            <div className="text-center py-2 bg-success/15 border border-success/20 rounded-lg text-success font-bold text-[11px] font-heading">
                              تم اجتياز هذا الاختبار بنجاح ✓
                            </div>
                          ) : hasIndividualLock ? (
                            <div className="space-y-1.5">
                              <Button
                                disabled
                                className="w-full bg-muted text-muted-foreground border border-border h-9 font-bold text-xs rounded-lg cursor-not-allowed font-heading"
                              >
                                المنصة مقفلة
                              </Button>
                              <p className="text-[10px] text-muted-foreground text-center font-sans">
                                لديك اختبار فردي مكتمل وغير مدفوع. يجب إكماله أو إلغاؤه أولاً.
                              </p>
                            </div>
                          ) : confirmedBundle ? (
                            (() => {
                              const isTestInBundle = confirmedBundle.tests.some(
                                (bt: any) => bt.variantId === v.id
                              );
                              const isCompleted = takenTests.includes(v.id);

                              if (isTestInBundle) {
                                if (isCompleted) {
                                  return (
                                    <div className="text-center py-2 bg-success/15 border border-success/20 rounded-lg text-success font-bold text-[11px] font-heading">
                                      مكتمل ضمن الباقة ✓
                                    </div>
                                  );
                                } else {
                                  return (
                                    <Button
                                      asChild
                                      className="w-full gradient-primary border-0 text-primary-foreground hover:opacity-90 h-9 font-bold text-xs rounded-lg transition-all shadow-sm flex items-center justify-center font-heading"
                                      onClick={() => setIsModalOpen(false)}
                                    >
                                      <Link to={`/test/${v.id}`}>ابدأ الاختبار الآن</Link>
                                    </Button>
                                  );
                                }
                              } else {
                                return (
                                  <div className="space-y-1.5">
                                    <Button
                                      disabled
                                      className="w-full bg-muted text-muted-foreground border border-border h-9 font-bold text-xs rounded-lg cursor-not-allowed font-heading"
                                    >
                                      غير متاح بالباقة الحالية
                                    </Button>
                                    <p className="text-[10px] text-muted-foreground text-center font-sans">
                                      لديك باقة نشطة أخرى، يجب إكمالها أو إلغاؤها أولاً.
                                    </p>
                                  </div>
                                );
                              }
                            })()
                          ) : (
                            <>
                              <Button
                                asChild
                                className="w-full gradient-primary border-0 text-primary-foreground hover:opacity-90 h-9 font-bold text-xs rounded-lg transition-all shadow-sm flex items-center justify-center font-heading"
                                onClick={() => setIsModalOpen(false)}
                              >
                                <Link to={`/test/${v.id}?mode=individual`}>ابدأ كاختبار منفصل</Link>
                              </Button>

                              <Button
                                variant={isInCart ? 'destructive' : 'outline'}
                                className="w-full border-border/60 hover:bg-muted text-foreground h-9 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-all font-heading"
                                onClick={() => {
                                  if (isInCart) {
                                    removeFromCart(v.id);
                                  } else {
                                    addToCart({
                                      variantId: v.id,
                                      testId: selectedTest.id,
                                      testTitle:
                                        selectedTest.arabicTitle ||
                                        selectedTest.title ||
                                        selectedTest.englishTitle ||
                                        'اختبار التقييم',
                                      arabicTitle: selectedTest.arabicTitle,
                                      englishTitle: selectedTest.englishTitle,
                                      cert: selectedTest.cert,
                                      tierName: v.tierName,
                                      hours: v.hours,
                                      duration: v.duration,
                                      questionCount: v.questionCount,
                                      price: v.price,
                                    });
                                  }
                                }}
                              >
                                {isInCart ? (
                                  <>
                                    <Trash2 className="h-3.5 w-3.5" />
                                    إزالة من السلة
                                  </>
                                ) : (
                                  <>
                                    <ShoppingCart className="h-3.5 w-3.5" />
                                    إضافة إلى السلة
                                  </>
                                )}
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Bundle Modal */}
        <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
          <DialogContent
            className="text-right max-w-md bg-card border border-border p-6 rounded-2xl animate-in fade-in duration-200"
            dir="rtl"
          >
            <DialogHeader className="text-right items-end border-b border-border/40 pb-3">
              <DialogTitle className="text-lg font-heading font-bold text-foreground flex items-center gap-2 justify-end">
                <span>تأكيد حجز باقة الاختبارات</span>
                <AlertTriangle className="h-5 w-5 text-yellow-500 animate-bounce" />
              </DialogTitle>
            </DialogHeader>

            <div className="my-4 space-y-4 text-sm text-muted-foreground leading-relaxed">
              <p className="font-semibold text-foreground">
                يرجى العلم بأنه عند تأكيد حجز هذه المجموعة من الاختبارات كباقة واحدة
                {discountPercentage > 0 ? (
                  <>
                    {' '}
                    بسعر مخفض (
                    <span className="text-primary font-bold">{discountedCartPrice} $</span> بدلاً من{' '}
                    <span className="line-through">{totalCartPrice} $</span> بخصم{' '}
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      {discountPercentage}%
                    </span>
                    ):
                  </>
                ) : (
                  <>
                    {' '}
                    بسعر (<span className="text-primary font-bold">{totalCartPrice} $</span>
                    ):
                  </>
                )}
              </p>
              <ul className="list-disc list-inside space-y-2.5 text-right pr-2 font-sans">
                <li>
                  <strong className="text-foreground">لا يمكن تعديل الباقة:</strong> لن تتمكن من
                  إضافة اختبارات جديدة أو إزالة اختبار منفرد من هذه المجموعة لاحقاً.
                </li>
                <li>
                  <strong className="text-foreground">إلغاء الباقة بالكامل:</strong> إذا أردت البدء
                  من جديد أو تعديل الاختيارات، يجب عليك إلغاء حجز الباقة بالكامل من السلة والبدء من
                  الصفر.
                </li>
                <li>
                  <strong className="text-foreground">الاستفادة من الخصم:</strong> يجب عليك إكمال
                  جميع اختبارات هذه الباقة للاستفادة من السعر المخفض النهائي.
                </li>
                <li>
                  <strong className="text-destructive font-bold">تنبيه هام لفقدان التقدم:</strong>{' '}
                  في حال قمت بالبدء في أي اختبار ضمن الباقة ثم قررت إلغاءها، فستفقد كل التقدم المحرز
                  وسيتعين عليك إعادة جميع الاختبارات التي أكملتها مجدداً.
                </li>
              </ul>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                className="flex-1 rounded-xl h-12 font-bold font-heading"
                disabled={isConfirming}
                onClick={() => setIsConfirmModalOpen(false)}
              >
                تراجع وإلغاء
              </Button>
              <Button
                className="flex-1 rounded-xl h-12 font-bold gradient-primary border-0 text-primary-foreground hover:opacity-90 font-heading"
                disabled={isConfirming}
                onClick={handleConfirmBundle}
              >
                {isConfirming ? 'جاري التأكيد...' : 'نعم، استمرار وتأكيد'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Cancel Bundle Modal */}
        <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
          <DialogContent
            className="text-right max-w-md bg-card border border-border p-6 rounded-2xl animate-in fade-in duration-200"
            dir="rtl"
          >
            <DialogHeader className="text-right items-end border-b border-border/40 pb-3">
              <DialogTitle className="text-lg font-heading font-bold text-destructive flex items-center gap-2 justify-end">
                <span>تأكيد إلغاء حجز الباقة</span>
                <AlertTriangle className="h-5 w-5 text-destructive animate-pulse" />
              </DialogTitle>
            </DialogHeader>

            <div className="my-4 space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p className="font-bold text-foreground text-base">
                هل أنت متأكد من رغبتك في إلغاء الباقة والبدء من جديد؟
              </p>
              <p className="text-destructive font-semibold bg-destructive/5 border border-destructive/10 p-3 rounded-xl font-sans">
                ⚠️ تحذير: سيؤدي هذا الإجراء إلى إلغاء الباقة بالكامل وفقدان كل التقدم المحرز في
                الاختبارات التي أكملتها أو بدأتها ضمن هذه الباقة. سيتعين عليك إعادة تقديم هذه
                الاختبارات مجدداً.
              </p>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                className="flex-1 rounded-xl h-12 font-bold font-heading"
                onClick={() => setIsCancelModalOpen(false)}
              >
                تراجع
              </Button>
              <Button
                variant="destructive"
                className="flex-1 rounded-xl h-12 font-bold font-heading"
                onClick={handleCancelBundle}
              >
                نعم، إلغاء وفقدان التقدم
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Completion Modal */}
        <Dialog open={isCompletionModalOpen} onOpenChange={setIsCompletionModalOpen}>
          <DialogContent
            className="text-center max-w-md bg-card border border-border p-8 rounded-2xl animate-in fade-in duration-200"
            dir="rtl"
          >
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success/10 border-2 border-success animate-bounce">
              <CheckCircle2 className="h-10 w-10 text-success" />
            </div>

            <DialogHeader className="text-center items-center pb-3">
              <DialogTitle className="text-2xl font-heading font-bold text-foreground">
                تهانينا! اكتملت جميع اختبارات الباقة 🎉
              </DialogTitle>
            </DialogHeader>

            <div className="my-4 space-y-3 text-sm text-muted-foreground leading-relaxed text-center font-sans">
              <p className="font-semibold text-foreground text-base">
                لقد أتممت بنجاح جميع الاختبارات المشمولة في باقتك!
              </p>
              <p>
                الخطوة النهائية هي إتمام الدفع لإصدار واعتماد كافة الشهادات المشمولة وتثبيتها في
                حسابك.
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-2.5">
              <Button
                className="w-full rounded-xl h-12 font-bold gradient-primary border-0 text-primary-foreground hover:opacity-90 font-heading flex items-center justify-center gap-2"
                onClick={() => {
                  setIsCompletionModalOpen(false);
                  navigate('/payment');
                }}
              >
                <CreditCard className="h-5 w-5" /> الانتقال إلى صفحة الدفع وإصدار الشهادات
              </Button>
              <Button
                variant="outline"
                className="w-full rounded-xl h-12 font-bold border-destructive/30 text-destructive hover:bg-destructive/10 font-heading"
                onClick={() => {
                  setIsCompletionModalOpen(false);
                  setIsCancelModalOpen(true);
                }}
              >
                <Trash2 className="ml-1.5 h-4 w-4" /> إلغاء حجز الباقة والبدء من جديد
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Tests;
