import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { testVariantsService } from "@/services/test-variants";
import { calculateBundlePricing } from "@shared/pricing";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import DashboardLayout from "@/components/DashboardLayout";

const chipFilters = ["CIA", "CMA", "CPA", "CFE", "CISA"];

const certColor = (c: string) => {
  if (c === "CIA") return "bg-primary/10 text-primary";
  if (c === "CMA") return "bg-secondary/10 text-secondary";
  if (c === "CPA") return "bg-accent/10 text-accent";
  if (c === "CFE") return "bg-destructive/10 text-destructive";
  return "bg-indigo-500/10 text-indigo-500";
};

const Tests = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
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
      const saved = localStorage.getItem("certificates_cart");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<any | null>(null);

  // Confirmed Bundle and Locks states (synced to backend)
  const [confirmedBundle, setConfirmedBundle] = useState<any | null>(null);
  const [takenTests, setTakenTests] = useState<string[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [hasIndividualLock, setHasIndividualLock] = useState(false);
  const [individualLock, setIndividualLock] = useState<any | null>(null);

  const [permanentPassed, setPermanentPassed] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("certificates_passed_tests");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    localStorage.setItem("certificates_cart", JSON.stringify(cart));
  }, [cart]);

  const fetchActiveStatus = async () => {
    try {
      // 1. Fetch active individual test lock
      const indLock = await testVariantsService.getActiveIndividualTest();
      if (indLock) {
        setHasIndividualLock(true);
        setIndividualLock(indLock);
        setIsLocked(true);
        setConfirmedBundle(null);
        setTakenTests([]);
        return;
      } else {
        setHasIndividualLock(false);
        setIndividualLock(null);
      }

      // 2. Fetch active bundle
      const activeBundle = await testVariantsService.getActiveBundle();
      if (activeBundle) {
        setConfirmedBundle(activeBundle);
        const finishedIds = activeBundle.tests
          .filter((t: any) => t.finished)
          .map((t: any) => t.variantId);
        setTakenTests(finishedIds);
        setIsLocked(true);
      } else {
        setConfirmedBundle(null);
        setTakenTests([]);
        setIsLocked(false);
      }
    } catch (e) {
      console.error("Error fetching locks status:", e);
    }
  };

  const fetchTestVariants = async (pageToFetch: number, isInitial = false) => {
    if (isInitial) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const certParam = Array.from(activeChips).join(",");
      const res = await testVariantsService.getTestVariants({
        page: pageToFetch,
        cert: certParam || undefined,
      });

      const items = res.items || res.data || (Array.isArray(res) ? res : []);
      const more = res.hasMore ?? false;
      const total = res.total ?? items.length;

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
    } catch (err) {
      console.error("Error loading tests catalog:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchActiveStatus();
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
      next.has(chip) ? next.delete(chip) : next.add(chip);
      return next;
    });
  };

  const addToCart = (item: any) => {
    setCart((prev) => {
      if (prev.some((i) => i.variantId === item.variantId)) return prev;
      toast({
        title: "تمت الإضافة إلى السلة",
        description: `تمت إضافة ${item.testTitle} (${item.tierName === "SMALL" ? "مبتدئ" : item.tierName === "MEDIUM" ? "متوسط" : "متقدم"}) إلى سلتك.`,
      });
      return [...prev, item];
    });
  };

  const removeFromCart = (variantId: string) => {
    const item = cart.find((i) => i.variantId === variantId);
    if (item) {
      toast({
        title: "تمت الإزالة من السلة",
        description: `تمت إزالة ${item.testTitle} (${item.tierName === "SMALL" ? "مبتدئ" : item.tierName === "MEDIUM" ? "متوسط" : "متقدم"}) من سلتك.`,
        variant: "destructive",
      });
    }
    setCart((prev) => prev.filter((i) => i.variantId !== variantId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const {
    totalHours: totalCartHours,
    originalPrice: totalCartPrice,
    discountPercentage,
    discountedPrice: discountedCartPrice,
  } = calculateBundlePricing(cart);

  const isBundleCompleted = !!(
    confirmedBundle &&
    confirmedBundle.tests &&
    confirmedBundle.tests.length > 0 &&
    confirmedBundle.tests.every((t: any) => takenTests.includes(t.variantId))
  );

  // Detect Bundle Completion
  useEffect(() => {
    if (
      confirmedBundle &&
      confirmedBundle.tests &&
      confirmedBundle.tests.length > 0
    ) {
      const allFinished = confirmedBundle.tests.every((t: any) =>
        takenTests.includes(t.variantId),
      );
      if (allFinished) {
        const hasShown = localStorage.getItem(
          `certificates_bundle_congrats_shown_${confirmedBundle.id}`,
        );
        if (!hasShown) {
          setIsCompletionModalOpen(true);
          localStorage.setItem(
            `certificates_bundle_congrats_shown_${confirmedBundle.id}`,
            "true",
          );
        }
      }
    }
  }, [confirmedBundle, takenTests]);

  const handleConfirmBundle = async () => {
    try {
      const variantIds = cart.map((item) => item.variantId);
      await testVariantsService.confirmBundle(variantIds);

      setCart([]);
      localStorage.removeItem("certificates_cart");
      setIsConfirmModalOpen(false);
      setIsCartOpen(false);

      toast({
        title: "تم تأكيد حجز باقة الاختبارات!",
        description:
          "تم حجز الباقة بنجاح وقفل السلة. يمكنك البدء في الاختبارات المشمولة الآن.",
      });

      await fetchActiveStatus();
    } catch (e: any) {
      toast({
        title: "فشل تأكيد الباقة",
        description: e.message || "حدث خطأ غير متوقع.",
        variant: "destructive",
      });
    }
  };

  const handleCancelBundle = async () => {
    try {
      await testVariantsService.cancelBundle();
      setConfirmedBundle(null);
      setTakenTests([]);
      setIsLocked(false);
      setIsCancelModalOpen(false);
      setIsCartOpen(false);
      toast({
        title: "تم إلغاء حجز الباقة",
        description:
          "تم إلغاء الباقة وحذف جميع التقدم المحرز في الاختبارات المشمولة بها.",
        variant: "destructive",
      });
      await fetchActiveStatus();
    } catch (e: any) {
      toast({
        title: "فشل إلغاء الباقة",
        description: e.message || "حدث خطأ غير متوقع.",
        variant: "destructive",
      });
    }
  };

  const handleCompleteBundle = () => {
    setIsCompletionModalOpen(false);
    navigate("/payment");
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
          title: test.title,
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
      group.variants.sort(
        (a, b) => (tierOrder[a.tierName] || 0) - (tierOrder[b.tierName] || 0),
      );
      return group;
    });
  })();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header + Cart Trigger */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/40 pb-5">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">
              الاختبارات المتاحة
            </h1>
            <p className="mt-1 text-muted-foreground">
              اختر اختبارًا لبدء كسب ساعات التعليم المهني المستمر
            </p>
          </div>

          <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className="relative flex items-center gap-3 border-primary/20 hover:border-primary/50 bg-card/65 backdrop-blur-sm px-4 py-6 rounded-xl transition-all shadow-sm hover:shadow-md hover:bg-card group animate-in fade-in slide-in-from-top-2 duration-300"
              >
                <div className="relative">
                  <ShoppingCart className="h-5 w-5 text-primary group-hover:scale-110 transition-transform duration-200" />
                  {(confirmedBundle
                    ? confirmedBundle.tests.length
                    : cart.length) > 0 && (
                    <span className="absolute -top-2.5 -right-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold animate-pulse">
                      {confirmedBundle
                        ? confirmedBundle.tests.length
                        : cart.length}
                    </span>
                  )}
                </div>
                <div className="text-right text-xs">
                  <div className="font-bold text-foreground">
                    {confirmedBundle ? "الباقة المحجوزة" : "سلة الاختبارات"}
                  </div>
                  <div className="text-muted-foreground text-[10px] mt-0.5">
                    {confirmedBundle
                      ? `${confirmedBundle.totalHours} ساعة - ${confirmedBundle.discountedPrice} دولار`
                      : `${totalCartHours} ساعة - ${totalCartPrice} دولار`}
                  </div>
                </div>
              </Button>
            </SheetTrigger>

            <SheetContent
              className={cn(
                "w-full bg-card border-l border-border p-6 flex flex-col h-full text-right transition-all duration-300",
                (confirmedBundle ? confirmedBundle.tests.length : cart.length) >
                  3
                  ? "sm:max-w-3xl"
                  : "sm:max-w-md",
              )}
              side="right"
            >
              {confirmedBundle ? (
                <>
                  <SheetHeader className="text-right border-b border-border pb-4">
                    <SheetTitle className="text-xl font-heading font-bold text-foreground flex items-center gap-2 justify-end">
                      <span>باقة الاختبارات المحجوزة</span>
                      <Lock className="h-5 w-5 text-primary animate-pulse" />
                    </SheetTitle>
                    <SheetDescription className="text-sm text-muted-foreground text-right mt-1 font-sans">
                      تفاصيل باقتك المؤكدة وحالة التقدم في الاختبارات المشمولة.
                      لا يمكن تعديل هذه الباقة.
                    </SheetDescription>
                  </SheetHeader>

                  <div className="flex-1 overflow-y-auto py-4 space-y-4">
                    {/* Progress Stats */}
                    <div className="bg-muted/30 border border-border rounded-2xl p-4 space-y-3 text-right">
                      <div className="flex justify-between items-center text-xs font-semibold">
                        <span className="text-muted-foreground">
                          حالة إنجاز الباقة:
                        </span>
                        <span className="text-foreground font-bold">
                          {
                            confirmedBundle.tests.filter((t: any) =>
                              takenTests.includes(t.variantId),
                            ).length
                          }{" "}
                          من {confirmedBundle.tests.length} اختبارات
                        </span>
                      </div>
                      {/* Progress Bar */}
                      <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full gradient-primary transition-all duration-500 rounded-full"
                          style={{
                            width: `${(confirmedBundle.tests.filter((t: any) => takenTests.includes(t.variantId)).length / confirmedBundle.tests.length) * 100}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div
                      className={cn(
                        "content-start items-start",
                        confirmedBundle.tests.length > 3
                          ? "grid grid-cols-1 md:grid-cols-2 gap-4"
                          : "space-y-4",
                      )}
                    >
                      {confirmedBundle.tests.map((item: any) => {
                        const isCompleted = takenTests.includes(item.variantId);
                        return (
                          <div
                            key={item.variantId}
                            className={cn(
                              "flex items-start justify-between gap-4 p-4 rounded-xl border transition-all duration-200 shadow-sm",
                              isCompleted
                                ? "border-success/30 bg-success/5"
                                : "border-border bg-muted/10 hover:bg-muted/20",
                            )}
                          >
                            {isCompleted ? (
                              <Badge className="bg-success/10 text-success border-success/20 text-[10px] px-2 py-0.5 mt-1 flex items-center gap-1 font-sans">
                                <Check className="h-3 w-3" />
                                مكتمل
                              </Badge>
                            ) : (
                              <Button
                                asChild
                                size="sm"
                                className="gradient-primary border-0 text-primary-foreground hover:opacity-90 text-[10px] font-bold h-7 px-3 rounded-lg font-heading"
                                onClick={() => setIsCartOpen(false)}
                              >
                                <Link to={`/test/${item.variantId}`}>
                                  ابدأ الآن
                                </Link>
                              </Button>
                            )}

                            <div className="flex-1 text-right">
                              <Badge
                                className={`${certColor(item.cert)} border-0 text-[10px] px-2 py-0.5 mb-1.5`}
                              >
                                {item.cert}
                              </Badge>
                              <h4 className="font-heading font-bold text-sm text-foreground line-clamp-1">
                                {item.testTitle}
                              </h4>
                              <div className="flex items-center gap-2.5 justify-end mt-1.5 text-xs text-muted-foreground">
                                <span>⏱️ {item.duration} دقيقة</span>
                                <span>📚 {item.hours} ساعة CPE</span>
                                <span className="font-semibold text-primary">
                                  {item.tierName.toUpperCase() === "SMALL"
                                    ? "مبتدئ"
                                    : item.tierName.toUpperCase() === "MEDIUM"
                                      ? "متوسط"
                                      : "متقدم"}
                                </span>
                              </div>
                            </div>

                            <div className="text-left font-heading font-bold text-sm text-foreground pt-1 min-w-[50px]">
                              {item.price} $
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="border-t border-border pt-4 mt-auto space-y-4">
                    <div className="space-y-2 text-right">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground font-semibold">
                          ساعات CPE الإجمالية:
                        </span>
                        <span className="font-bold text-foreground">
                          {confirmedBundle.totalHours} ساعة
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm text-muted-foreground">
                        <span>السعر الأصلي:</span>
                        <span className="line-through">
                          {confirmedBundle.originalPrice} $
                        </span>
                      </div>
                      {confirmedBundle.discountPercentage > 0 && (
                        <div className="flex justify-between items-center text-xs text-green-500 font-semibold">
                          <span>
                            خصم الباقة ({confirmedBundle.discountPercentage}%):
                          </span>
                          <span>
                            -
                            {confirmedBundle.originalPrice -
                              confirmedBundle.discountedPrice}{" "}
                            $
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-lg font-bold border-t border-border/40 pt-2">
                        <span className="text-foreground">
                          القيمة الإجمالية للباقة:
                        </span>
                        <span className="text-primary font-black">
                          {confirmedBundle.discountedPrice} $
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="destructive"
                      className="w-full py-6 font-heading font-bold text-sm rounded-xl shadow-lg hover:opacity-95 transition-opacity"
                      onClick={() => setIsCancelModalOpen(true)}
                    >
                      إلغاء حجز الباقة والبدء من جديد
                    </Button>
                    {isBundleCompleted && (
                      <Button
                        asChild
                        className="w-full py-6 gradient-primary font-heading font-bold text-sm rounded-xl shadow-lg hover:opacity-95 transition-opacity"
                        onClick={() => setIsCartOpen(false)}
                      >
                        <Link to="/payment">
                          الذهاب لصفحة الدفع وإصدار الشهادات
                        </Link>
                      </Button>
                    )}
                    <p className="text-[10px] text-destructive text-center leading-relaxed font-semibold">
                      ⚠️ انتبه: إلغاء الباقة سيؤدي إلى فقدان جميع التقدم المحرز
                      في الاختبارات التي أكملتها أو بدأتها ضمنها.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <SheetHeader className="text-right border-b border-border pb-4">
                    <SheetTitle className="text-xl font-heading font-bold text-foreground flex items-center gap-2 justify-end">
                      <span>سلة الاختبارات المختارة</span>
                      <ShoppingCart className="h-5 w-5 text-primary" />
                    </SheetTitle>
                    <SheetDescription className="text-sm text-muted-foreground text-right mt-1">
                      المواد والشهادات التي اخترتها. قم بتأكيد طلبك للبدء في
                      الاختبارات.
                    </SheetDescription>
                  </SheetHeader>

                  {cart.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <ShoppingCart className="h-16 w-16 text-muted-foreground/20 mb-4 stroke-[1.2]" />
                      <p className="text-base font-semibold">
                        السلة فارغة حالياً
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 text-center max-w-[200px] leading-relaxed">
                        تصفح الاختبارات وأضف الباقات والشهادات التي ترغب في
                        دراستها.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div
                        className={cn(
                          "flex-1 overflow-y-auto py-4 pr-1 content-start items-start",
                          cart.length > 3
                            ? "grid grid-cols-1 md:grid-cols-2 gap-4"
                            : "space-y-4",
                        )}
                      >
                        {cart.map((item) => (
                          <div
                            key={item.variantId}
                            className="flex items-start justify-between gap-4 p-4 rounded-xl border border-border bg-muted/10 hover:bg-muted/30 transition-all duration-200 shadow-sm"
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg h-8 w-8 mt-1 transition-colors"
                              onClick={() => removeFromCart(item.variantId)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>

                            <div className="flex-1 text-right">
                              <Badge
                                className={`${certColor(item.cert)} border-0 text-[10px] px-2 py-0.5 mb-1.5`}
                              >
                                {item.cert}
                              </Badge>
                              <h4 className="font-heading font-bold text-sm text-foreground line-clamp-1">
                                {item.testTitle}
                              </h4>
                              <div className="flex items-center gap-2.5 justify-end mt-1.5 text-xs text-muted-foreground">
                                <span>⏱️ {item.duration} دقيقة</span>
                                <span>📚 {item.hours} ساعة CPE</span>
                                <span className="font-semibold text-primary">
                                  {item.tierName.toUpperCase() === "SMALL"
                                    ? "مبتدئ"
                                    : item.tierName.toUpperCase() === "MEDIUM"
                                      ? "متوسط"
                                      : "متقدم"}
                                </span>
                              </div>
                            </div>

                            <div className="text-left font-heading font-bold text-sm text-foreground pt-1 min-w-[50px]">
                              {item.price} $
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-border pt-4 mt-auto space-y-4">
                        <div className="space-y-2 text-right">
                          {Object.keys(hoursByCert).map((cert) => {
                            const hours = hoursByCert[cert] ?? 0;

                            return (
                              <div
                                key={cert}
                                className="flex justify-between items-center text-xs text-muted-foreground"
                              >
                                <span>ساعات {cert}:</span>
                                <span>{hours} ساعة</span>
                              </div>
                            );
                          })}

                          <div className="flex justify-between items-center text-sm border-t border-border/40 pt-2">
                            <span className="text-muted-foreground font-semibold">
                              إجمالي ساعات CPE:
                            </span>
                            <span className="font-bold text-foreground">
                              {totalCartHours} ساعة
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-lg font-bold">
                            <span className="text-foreground">
                              الإجمالي المطلوب:
                            </span>
                            <span className="text-primary font-black">
                              {totalCartPrice} $
                            </span>
                          </div>
                          {discountPercentage > 0 && (
                            <div className="flex justify-between items-center text-xs text-green-500 font-semibold">
                              <span>خصم الباقة ({discountPercentage}%):</span>
                              <span>
                                -{totalCartPrice - discountedCartPrice} $
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between items-center text-lg font-bold border-t border-border/40 pt-1">
                            <span className="text-foreground">
                              السعر بعد الخصم:
                            </span>
                            <span className="text-primary font-black">
                              {discountedCartPrice} $
                            </span>
                          </div>
                        </div>

                        <Button
                          className="w-full py-6 font-heading font-bold text-sm text-primary-foreground gradient-primary border-0 rounded-xl shadow-lg shadow-primary/10 hover:opacity-95 transition-opacity"
                          onClick={() => setIsConfirmModalOpen(true)}
                        >
                          تأكيد حجز هذه الاختبارات
                        </Button>
                      </div>
                    </>
                  )}
                </>
              )}
            </SheetContent>
          </Sheet>
        </div>

        {confirmedBundle && (
          <div
            className="bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 animate-in fade-in duration-300 text-right"
            dir="rtl"
          >
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-amber-500" />
              <div>
                <p className="font-bold text-sm text-foreground">
                  لديك باقة اختبارات نشطة ومحجوزة حالياً
                </p>
                <p className="text-xs mt-0.5 text-muted-foreground leading-relaxed font-sans">
                  يرجى إكمال جميع الاختبارات المشمولة في الباقة للحصول على السعر
                  النهائي المخفض. لا يمكن تعديل الباقة أو البدء باختبارات خارجها
                  إلا بعد إكمالها أو إلغائها.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-amber-500/30 text-amber-700 hover:bg-amber-500/20 whitespace-nowrap self-end sm:self-center font-bold"
              onClick={() => setIsCartOpen(true)}
            >
              عرض تفاصيل الباقة
            </Button>
          </div>
        )}

        {hasIndividualLock && individualLock && (
          <div
            className="bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 animate-in fade-in duration-300 text-right"
            dir="rtl"
          >
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-amber-500" />
              <div>
                <p className="font-bold text-sm text-foreground">
                  لديك اختبار فردي مكتمل وغير مدفوع
                </p>
                <p className="text-xs mt-0.5 text-muted-foreground leading-relaxed font-sans">
                  لقد أكملت بنجاح اختبار {individualLock.testTitle} (
                  {individualLock.tierName === "SMALL"
                    ? "مبتدئ"
                    : individualLock.tierName === "MEDIUM"
                      ? "متوسط"
                      : "متقدم"}
                  ). يرجى إتمام الدفع أو إلغاء الاختبار للتمكن من حجز باقات
                  جديدة أو تقديم اختبارات أخرى.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-amber-500/30 text-amber-700 hover:bg-amber-500/20 whitespace-nowrap self-end sm:self-center font-bold"
              onClick={() => navigate("/payment")}
            >
              عرض تفاصيل الدفع
            </Button>
          </div>
        )}

        {/* Chip Filters */}
        <div className="flex flex-wrap gap-2">
          {chipFilters.map((chip) => (
            <button
              key={chip}
              onClick={() => toggleChip(chip)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all border duration-200 ${
                activeChips.has(chip)
                  ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/15"
                  : "bg-card text-muted-foreground border-border hover:border-primary/50"
              }`}
            >
              {chip}
              {activeChips.has(chip) && <X className="inline h-3 w-3 mr-1.5" />}
            </button>
          ))}
          {activeChips.size > 0 && (
            <button
              onClick={() => setActiveChips(new Set())}
              className="text-sm text-destructive hover:underline px-2 transition-all"
            >
              مسح الكل
            </button>
          )}
        </div>

        {/* Result count */}
        <p className="text-sm text-muted-foreground">
          عرض {groupedTests.length} اختبار
        </p>

        {/* Tests Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={
            viewMode === "grid"
              ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
              : "space-y-3"
          }
        >
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-card p-5 animate-pulse flex flex-col justify-between h-[280px]"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="h-6 w-12 rounded bg-muted-foreground/20" />
                    <div className="h-5 w-24 rounded bg-muted-foreground/15" />
                  </div>
                  <div className="h-7 w-3/4 rounded bg-muted-foreground/20 mb-3" />
                  <div className="space-y-2">
                    <div className="h-4 w-full rounded bg-muted-foreground/15" />
                    <div className="h-4 w-11/12 rounded bg-muted-foreground/15" />
                    <div className="h-4 w-2/3 rounded bg-muted-foreground/15" />
                  </div>
                </div>
                <div>
                  <div className="flex gap-4 border-t border-border/40 pt-4">
                    <div className="h-4 w-20 rounded bg-muted-foreground/15" />
                    <div className="h-4 w-16 rounded bg-muted-foreground/15" />
                  </div>
                  <div className="mt-5 h-10 w-full rounded bg-muted-foreground/20" />
                </div>
              </div>
            ))
          ) : groupedTests.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <p className="text-lg font-heading font-bold text-foreground">
                لا توجد نتائج
              </p>
              <p className="mt-2 text-muted-foreground">
                لا توجد اختبارات تطابق معايير البحث. حاول تعديل الفلاتر.
              </p>
              <Button
                variant="outline"
                className="mt-4"
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
              const topVariant =
                group.variants[group.variants.length - 1] || baseVariant;

              return (
                <div
                  key={group.id}
                  className="rounded-xl border border-border bg-card p-5 card-hover flex flex-col justify-between h-full group cursor-pointer hover:border-primary/50 transition-all duration-300"
                  onClick={() => {
                    setSelectedTest(group);
                    setIsModalOpen(true);
                  }}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3.5">
                      <Badge className={`${certColor(group.cert)} border-0`}>
                        {group.cert}
                      </Badge>
                      {confirmedBundle ? (
                        group.variants.some((v: any) =>
                          confirmedBundle.tests.some(
                            (bt: any) => bt.variantId === v.id,
                          ),
                        ) ? (
                          <Badge className="bg-success/10 text-success border-success/20 flex items-center gap-1 text-[10px] font-sans">
                            <Check className="h-3 w-3" />
                            مشمول بالباقة
                          </Badge>
                        ) : (
                          <Badge className="bg-muted text-muted-foreground border-0 flex items-center gap-1 text-[10px] font-sans">
                            <Lock className="h-3 w-3" />
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
                    <h3 className="font-heading font-bold text-card-foreground text-lg group-hover:text-primary transition-colors">
                      {group.title}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                      {group.desc}
                    </p>

                    <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-muted-foreground border-t border-border/40 pt-4">
                      <span className="flex items-center gap-1">
                        📚 {baseVariant.hours} - {topVariant.hours} ساعة CPE
                      </span>
                      <span className="flex items-center gap-1">
                        💰 {baseVariant.price} - {topVariant.price} $
                      </span>
                    </div>
                  </div>

                  <Button
                    className="mt-5 w-full bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground border-0 transition-all duration-200 py-5 font-semibold"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTest(group);
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
          <div className="flex justify-center pt-8 pb-4">
            <Button
              onClick={handleLoadMore}
              disabled={loadingMore}
              variant="outline"
              className="px-8 py-6 rounded-xl border-primary/30 hover:border-primary text-primary hover:bg-primary/5 font-heading font-bold text-sm shadow-sm transition-all duration-200"
            >
              {loadingMore ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span>جاري تحميل المزيد...</span>
                </div>
              ) : (
                <span>أظهر المزيد</span>
              )}
            </Button>
          </div>
        )}

        {/* Tier Comparison Modal (Dialog) */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-4xl bg-card border border-border rounded-2xl p-6 md:p-6 overflow-y-auto max-h-[95vh] text-right">
            {selectedTest && (
              <>
                <DialogHeader className="text-right items-end border-b border-border/40 pb-3 mb-3">
                  <DialogTitle className="text-xl font-heading font-bold text-foreground text-right w-full">
                    {selectedTest.title}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground leading-relaxed mt-2 text-right w-full">
                    {selectedTest.desc}
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 md:grid-cols-3 mt-4">
                  {selectedTest.variants.map((v: any) => {
                    const isInCart = cart.some(
                      (item) => item.variantId === v.id,
                    );
                    const isSmall = v.tierName.toUpperCase() === "SMALL";
                    const isMedium = v.tierName.toUpperCase() === "MEDIUM";
                    const isLarge = v.tierName.toUpperCase() === "LARGE";

                    let tierTitle = v.tierName;
                    let tierColorClass =
                      "border-border hover:border-primary/30";
                    let bgBadge = "bg-muted text-muted-foreground";

                    if (isSmall) {
                      tierTitle = "مبتدئ";
                      tierColorClass =
                        "border-border hover:border-blue-500/40 shadow-sm";
                      bgBadge = "bg-blue-500/10 text-blue-500";
                    } else if (isMedium) {
                      tierTitle = "متوسط";
                      tierColorClass =
                        "border-primary/50 shadow-md ring-1 ring-primary/20 hover:border-primary";
                      bgBadge = "bg-primary text-primary-foreground";
                    } else if (isLarge) {
                      tierTitle = "متقدم";
                      tierColorClass =
                        "border-border hover:border-amber-500/40 shadow-sm";
                      bgBadge = "bg-amber-500/10 text-amber-500";
                    }

                    return (
                      <div
                        key={v.id}
                        className={cn(
                          "relative flex flex-col justify-between p-5 rounded-2xl border bg-card/40 backdrop-blur-sm transition-all duration-300 min-h-[420px]",
                          tierColorClass,
                        )}
                      >
                        {isMedium && (
                          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 text-[9px] font-bold tracking-wider uppercase bg-primary text-primary-foreground rounded-full shadow-sm">
                            الأكثر شعبية
                          </span>
                        )}

                        <div className="text-center">
                          <Badge
                            className={cn(
                              "mb-3 text-xs font-bold px-2.5 py-1 rounded-full",
                              bgBadge,
                            )}
                          >
                            {tierTitle}
                          </Badge>
                          <div className="mt-1 text-2xl font-heading font-black text-foreground">
                            {v.price} $
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            دفع لمرة واحدة
                          </p>

                          <div className="mt-4 space-y-3 border-t border-b border-border/50 py-3 text-sm text-right">
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">
                                ساعات CPE:
                              </span>
                              <span className="font-bold text-foreground">
                                {v.hours} ساعة
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">
                                عدد الأسئلة:
                              </span>
                              <span className="font-bold text-foreground">
                                {v.questionCount} سؤال
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">
                                المدة المتاحة:
                              </span>
                              <span className="font-bold text-foreground">
                                {v.duration} دقيقة
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-5 space-y-2.5">
                          {permanentPassed.includes(v.id) ? (
                            <div className="text-center py-2.5 bg-success/15 border border-success/20 rounded-xl text-success font-bold text-xs font-heading">
                              تم اجتياز هذا الاختبار بنجاح ✓
                            </div>
                          ) : hasIndividualLock ? (
                            <div className="space-y-2">
                              <Button
                                disabled
                                className="w-full bg-muted text-muted-foreground border border-border h-10 font-bold text-xs rounded-xl cursor-not-allowed font-heading"
                              >
                                المنصة مقفلة
                              </Button>
                              <p className="text-[10px] text-muted-foreground text-center font-sans">
                                لديك اختبار فردي مكتمل وغير مدفوع. يجب إكماله أو
                                إلغاؤه أولاً.
                              </p>
                            </div>
                          ) : confirmedBundle ? (
                            (() => {
                              const isTestInBundle = confirmedBundle.tests.some(
                                (bt: any) => bt.variantId === v.id,
                              );
                              const isCompleted = takenTests.includes(v.id);

                              if (isTestInBundle) {
                                if (isCompleted) {
                                  return (
                                    <div className="text-center py-2.5 bg-success/15 border border-success/20 rounded-xl text-success font-bold text-xs font-heading">
                                      مكتمل ضمن الباقة ✓
                                    </div>
                                  );
                                } else {
                                  return (
                                    <Button
                                      asChild
                                      className="w-full gradient-primary border-0 text-primary-foreground hover:opacity-90 h-10 font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center font-heading"
                                      onClick={() => setIsModalOpen(false)}
                                    >
                                      <Link to={`/test/${v.id}`}>
                                        ابدأ الاختبار الآن
                                      </Link>
                                    </Button>
                                  );
                                }
                              } else {
                                return (
                                  <div className="space-y-2">
                                    <Button
                                      disabled
                                      className="w-full bg-muted text-muted-foreground border border-border h-10 font-bold text-xs rounded-xl cursor-not-allowed font-heading"
                                    >
                                      غير متاح بالباقة الحالية
                                    </Button>
                                    <p className="text-[10px] text-muted-foreground text-center font-sans">
                                      لديك باقة نشطة أخرى، يجب إكمالها أو
                                      إلغاؤها أولاً.
                                    </p>
                                  </div>
                                );
                              }
                            })()
                          ) : (
                            <>
                              <Button
                                asChild
                                className="w-full gradient-primary border-0 text-primary-foreground hover:opacity-90 h-10 font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center font-heading"
                                onClick={() => setIsModalOpen(false)}
                              >
                                <Link to={`/test/${v.id}?mode=individual`}>
                                  ابدأ كاختبار منفصل
                                </Link>
                              </Button>

                              <Button
                                variant={isInCart ? "destructive" : "outline"}
                                className="w-full border-border/60 hover:bg-muted text-foreground h-10 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all font-heading"
                                onClick={() => {
                                  if (isInCart) {
                                    removeFromCart(v.id);
                                  } else {
                                    addToCart({
                                      variantId: v.id,
                                      testId: selectedTest.id,
                                      testTitle: selectedTest.title,
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
              </>
            )}
          </DialogContent>
        </Dialog>

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
                يرجى العلم بأنه عند تأكيد حجز هذه المجموعة من الاختبارات كباقة
                واحدة بسعر مخفض (
                <span className="text-primary font-bold">
                  {Math.round(
                    totalCartPrice *
                      (1 -
                        (cart.length >= 3 ? 20 : cart.length === 2 ? 10 : 0) /
                          100),
                  )}{" "}
                  $
                </span>{" "}
                بدلاً من{" "}
                <span className="line-through">{totalCartPrice} $</span>):
              </p>
              <ul className="list-disc list-inside space-y-2.5 text-right pr-2 font-sans">
                <li>
                  <strong className="text-foreground">
                    لا يمكن تعديل الباقة:
                  </strong>{" "}
                  لن تتمكن من إضافة اختبارات جديدة أو إزالة اختبار منفرد من هذه
                  المجموعة لاحقاً.
                </li>
                <li>
                  <strong className="text-foreground">
                    إلغاء الباقة بالكامل:
                  </strong>{" "}
                  إذا أردت البدء من جديد أو تعديل الاختيارات، يجب عليك إلغاء حجز
                  الباقة بالكامل من السلة والبدء من الصفر.
                </li>
                <li>
                  <strong className="text-foreground">
                    الاستفادة من الخصم:
                  </strong>{" "}
                  يجب عليك إكمال جميع اختبارات هذه الباقة للاستفادة من السعر
                  المخفض النهائي.
                </li>
                <li>
                  <strong className="text-destructive font-bold">
                    تنبيه هام لفقدان التقدم:
                  </strong>{" "}
                  في حال قمت بالبدء في أي اختبار ضمن الباقة ثم قررت إلغاءها،
                  فستفقد كل التقدم المحرز وسيتعين عليك إعادة جميع الاختبارات
                  التي أكملتها مجدداً.
                </li>
              </ul>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                className="flex-1 rounded-xl h-12 font-bold font-heading"
                onClick={() => setIsConfirmModalOpen(false)}
              >
                تراجع وإلغاء
              </Button>
              <Button
                className="flex-1 rounded-xl h-12 font-bold gradient-primary border-0 text-primary-foreground hover:opacity-90 font-heading"
                onClick={handleConfirmBundle}
              >
                نعم، استمرار وتأكيد
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
                ⚠️ تحذير: سيؤدي هذا الإجراء إلى إلغاء الباقة بالكامل وفقدان كل
                التقدم المحرز في الاختبارات التي أكملتها أو بدأتها ضمن هذه
                الباقة. سيتعين عليك إعادة تقديم هذه الاختبارات مجدداً.
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
        <Dialog
          open={isCompletionModalOpen}
          onOpenChange={setIsCompletionModalOpen}
        >
          <DialogContent
            className="text-center max-w-md bg-card border border-border p-8 rounded-2xl animate-in fade-in duration-200"
            dir="rtl"
          >
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success/10 border-2 border-success animate-bounce">
              <CheckCircle2 className="h-10 w-10 text-success" />
            </div>

            <DialogHeader className="text-center items-center pb-3">
              <DialogTitle className="text-2xl font-heading font-bold text-foreground">
                تهانينا! تم إكمال الباقة بنجاح 🎉
              </DialogTitle>
            </DialogHeader>

            <div className="my-4 space-y-3 text-sm text-muted-foreground leading-relaxed text-center font-sans">
              <p className="font-semibold text-foreground text-base">
                لقد أتممت بنجاح جميع الاختبارات المشمولة في باقتك!
              </p>
              <p>
                تم الحصول على الساعات المعتمدة المقررة وحفظ إنجازاتك بنجاح. تم
                نقل الاختبارات المكتملة إلى سجل شهاداتك الدائم.
              </p>
            </div>

            <div className="mt-6">
              <Button
                className="w-full rounded-xl h-12 font-bold gradient-primary border-0 text-primary-foreground hover:opacity-90 font-heading"
                onClick={handleCompleteBundle}
              >
                رائع، شكراً لك
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Tests;
