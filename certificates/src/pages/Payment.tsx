import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import 'paymob-pixel';
import { authService } from '@/services/auth';
import { paymentsService } from '@/services/payments';
import { useAuth } from '@/hooks/use-auth';
import type {
  PaymentResult,
  Certificate,
  CreateIntentionResponseDto,
} from '@shared/dtos-and-types';
import {
  CreditCard,
  Trash2,
  Loader2,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Award,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/DashboardLayout';
import { isBigTourActive } from '@/services/tour';

declare global {
  interface Window {
    Pixel?: new (options: {
      publicKey: string;
      clientSecret?: string;
      paymentMethods?: string[];
      elementId: string;
      showSaveCard?: boolean;
      forceSaveCard?: boolean;
      disablePay?: boolean;
      afterPaymentComplete?: (res: any) => Promise<void> | void;
      beforePaymentComplete?: (paymentMethod: any) => Promise<boolean> | boolean;
      cardValidationChanged?: (isValid: boolean) => void;
      onPaymentCancel?: () => void;
      customStyle?: Record<string, any>;
      [key: string]: any;
    }) => any;
  }
}

const Payment = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading, refreshUser } = useAuth();

  // Processing & Success State
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [issuedCertificates, setIssuedCertificates] = useState<Certificate[]>([]);

  // Paymob Pixel State
  const [intention, setIntention] = useState<CreateIntentionResponseDto | null>(null);
  const [isInitializingPixel, setIsInitializingPixel] = useState(false);
  const [pixelMounted, setPixelMounted] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast({
      title: 'تم النسخ',
      description: `تم نسخ ${fieldName} إلى الحافظة.`,
    });
    setTimeout(() => setCopiedField(null), 2000);
  };

  /**
   * Initializes Paymob Pixel Embedded Checkout
   */
  const handleLaunchPaymob = async () => {
    setIsInitializingPixel(true);

    if (!user?.activeLock && isBigTourActive()) {
      setTimeout(() => {
        setIsInitializingPixel(false);
        setPaymentSuccess(true);
        toast({
          title: 'تم الدفع بنجاح (محاكاة الجولة)!',
          description: 'تم إصدار الشهادات بنجاح واحتساب ساعات الـ CPE في رصيدك.',
        });
      }, 700);
      return;
    }

    try {
      const res = await paymentsService.createIntention();
      if (!res || !res.clientSecret) {
        setIsInitializingPixel(false);
        return;
      }

      setIntention(res);
      setPixelMounted(true);

      // Give React DOM time to mount the container element
      setTimeout(() => {
        if (typeof window !== 'undefined' && window.Pixel) {
          try {
            new window.Pixel({
              publicKey: res.publicKey,
              clientSecret: res.clientSecret,
              paymentMethods: ['card'],
              elementId: 'paymob-checkout-container',
              customStyle: {
                Direction: 'rtl',
                Label_Text: {
                  cardLabel: 'بيانات البطاقة البنكية',
                  savedCardsLabel: 'البطاقات المحفوظة',
                  saveCardConsentLabel: 'حفظ بيانات البطاقة',
                },
                Button_Text: {
                  payBtn: `تأكيد الدفع (${payablePrice} $)`,
                },
              },
              afterPaymentComplete: async (data: any) => {
                setIsProcessing(true);
                const isSuccess =
                  data?.success === undefined ||
                  data?.success === true ||
                  String(data?.success).toLowerCase() === 'true';

                if (!isSuccess) {
                  setIsProcessing(false);
                  toast({
                    title: 'لم تكتمل عملية الدفع',
                    description: 'يرجى التأكد من بيانات البطاقة والمحاولة مرة أخرى.',
                    variant: 'destructive',
                  });
                  return;
                }

                const txId =
                  data?.transaction_id || data?.id || data?.order_id || data?.transactionId;

                const confirmRes = await paymentsService.confirm({
                  transactionId: txId,
                  intentionId: res.intentionId,
                });

                if (confirmRes) {
                  setIssuedCertificates(confirmRes.certificates);
                  setPaymentSuccess(true);
                  await refreshUser();
                  toast({
                    title: 'تم الدفع بنجاح!',
                    description: `تم إصدار ${confirmRes.count} شهادة واحتساب ساعات الـ CPE في حسابك بنجاح.`,
                  });
                  setTimeout(() => {
                    navigate('/certificates');
                  }, 1200);
                }
                setIsProcessing(false);
              },
              cardValidationChanged: () => {
              },
            });
          } catch (err: any) {
            toast({
              title: 'خطأ في تشغيل Pixel',
              description: err?.message || 'تعذر تحميل نموذج الدفع.',
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'خطأ في المكون',
            description: 'حزمة Paymob Pixel لم يتم العثور عليها في النافذة.',
            variant: 'destructive',
          });
        }
      }, 150);
    } catch (err: any) {
      toast({
        title: 'خطأ في بوابة الدفع',
        description: err?.message || 'تعذر بدء جلسة الدفع.',
        variant: 'destructive',
      });
    } finally {
      setIsInitializingPixel(false);
    }
  };

  const handleCancel = async () => {
    const res = await authService.cancelActive();
    if (res) {
      toast({
        title: res.type === 'bundle' ? 'تم إلغاء الباقة' : 'تم إلغاء الاختبار',
        description:
          res.type === 'bundle'
            ? 'تم إلغاء الباقة وحذف التقدم المحرز في الاختبارات بنجاح.'
            : 'تم حذف الاختبار الفردي وإلغاء القفل بنجاح.',
        variant: res.type === 'bundle' ? 'destructive' : 'default',
      });
      await refreshUser();
      navigate('/tests');
    }
  };

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-[60vh] w-full flex-col items-center justify-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground font-heading">جاري جلب تفاصيل الدفع...</p>
        </div>
      </DashboardLayout>
    );
  }

  const isTour = isBigTourActive();
  const activeLock =
    user?.activeLock ||
    (isTour
      ? ({
          isBundle: true,
          isReadyForPayment: true,
          finishedCount: 2,
          totalCount: 2,
          totalCpe: 4,
          payablePrice: 340,
          originalPrice: 400,
          discountPercentage: 15,
          items: [
            {
              testId: 'demo-1',
              title: 'شهادة فاحص الاحتيال المعتمد (CFE) - مكافحة الاحتيال والالتزام المهني',
              tierName: 'الأساسية',
              cpeHours: 2,
              price: 200,
            },
            {
              testId: 'demo-2',
              title: 'المدقق الداخلي المعتمد (CIA) - إدارة وتدقيق المخاطر والرقابة',
              tierName: 'المتقدمة',
              cpeHours: 2,
              price: 200,
            },
          ],
        } as any)
      : null);

  if (!activeLock) {
    return (
      <DashboardLayout>
        <div
          data-tour="payment-summary"
          className="flex h-[60vh] w-full flex-col items-center justify-center text-center space-y-6 max-w-md mx-auto"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <CreditCard className="h-8 w-8" />
          </div>
          <div data-tour="payment-header" className="space-y-2">
            <h2 className="text-2xl font-heading font-bold text-foreground">
              لا توجد دفعات مستحقة
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed font-sans">
              ليس لديك باقة اختبارات مكتملة أو اختبار فردي مستحق الدفع حالياً. تصفح الاختبارات
              المتاحة للبدء.
            </p>
          </div>
          <Button
            asChild
            data-tour="payment-form"
            className="gradient-primary border-0 text-primary-foreground hover:opacity-90"
          >
            <Link to="/tests">عرض الاختبارات المتاحة</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const isBundle = activeLock.isBundle;
  const isBundleIncomplete = isBundle && !activeLock.isReadyForPayment;

  if (isBundleIncomplete) {
    return (
      <DashboardLayout>
        <div
          className="flex h-[60vh] w-full flex-col items-center justify-center text-center space-y-6 max-w-md mx-auto"
          dir="rtl"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-heading font-bold text-foreground">
              باقة الاختبارات قيد التقدم
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed font-sans">
              لقد أكملت {activeLock.finishedCount} من أصل {activeLock.totalCount} اختبارات في باقتك
              المحجوزة. يجب إنهاء جميع اختبارات الباقة للتمكن من الانتقال للدفع وإصدار الشهادات.
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full">
            <Button
              asChild
              className="w-full gradient-primary border-0 text-primary-foreground hover:opacity-90 font-heading font-bold py-6 rounded-xl"
            >
              <Link to="/tests">متابعة اختبارات الباقة</Link>
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              className="w-full border-destructive/30 text-destructive hover:bg-destructive/10 font-heading font-bold py-5 rounded-xl"
            >
              <Trash2 className="ml-1.5 h-4 w-4" /> إلغاء حجز الباقة والبدء من جديد
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Pre-calculated checkout details directly from activeLock
  const items = activeLock.items || [];
  const payablePrice = activeLock.payablePrice || 0;
  const originalPrice = activeLock.originalPrice || 0;
  const discountPercentage = activeLock.discountPercentage || 0;
  const totalCpe = activeLock.totalCpe || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6 text-right max-w-5xl mx-auto" dir="rtl">
        {/* Header */}
        <div
          data-tour="payment-header"
          className="flex items-center gap-3 border-b border-border/40 pb-5"
        >
          <Button asChild variant="ghost" size="icon" className="h-9 w-9 rounded-lg">
            <Link to="/tests">
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">إتمام الدفع</h1>
            <p className="text-sm text-muted-foreground">
              قم بإتمام الدفع لإصدار وتثبيت شهاداتك المعتمدة
            </p>
          </div>
        </div>

        {paymentSuccess ? (
          <div className="bg-card border border-success/20 rounded-2xl p-8 max-w-md mx-auto text-center space-y-6 shadow-lg shadow-success/5 animate-in fade-in zoom-in-95 duration-300">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success/10 border-2 border-success text-success animate-bounce">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-heading font-bold text-foreground">
                تم الدفع وإصدار الشهادات بنجاح!
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed font-sans">
                تهانينا! تمت معالجة الدفع بنجاح وإصدار شهاداتك المعتمدة واحتساب ساعات الـ CPE في
                حسابك. يمكنك الآن الانتقال لمكتبة الشهادات لتحديد تواريخ التدريب واستعراض أو تحميل
                شهاداتك.
              </p>
            </div>

            <div className="bg-muted/30 border border-border/50 rounded-xl p-4 text-sm font-sans space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">نوع العملية:</span>
                <span className="font-semibold text-foreground">
                  {isBundle ? 'باقة اختبارات' : 'اختبار مستقل'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">المبلغ المدفوع:</span>
                <span className="font-bold text-primary">{payablePrice} $</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">إجمالي ساعات CPE:</span>
                <span className="font-semibold text-foreground">{totalCpe} ساعة</span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <Button
                asChild
                className="w-full h-11 gradient-primary border-0 text-primary-foreground font-heading font-bold rounded-xl"
              >
                <Link to="/certificates">
                  <Award className="ml-2 h-4 w-4" /> عرض في مكتبة الشهادات
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full h-11 border-primary/30 text-primary hover:bg-primary/5 font-heading font-bold rounded-xl"
              >
                <Link to="/tests">العودة إلى الاختبارات</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-5">
            {/* Paymob Pixel Checkout Section */}
            <div
              data-tour="payment-form"
              className="md:col-span-3 bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col"
            >
              <div className="space-y-5 flex-1 flex flex-col">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-heading font-bold text-foreground flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    الدفع الإلكتروني
                  </h3>
                  <Badge
                    variant="outline"
                    className="text-xs bg-primary/5 border-primary/20 text-primary"
                  >
                    USD ($)
                  </Badge>
                </div>

                {/* Pixel Embedded Container or Launch Box */}
                {!pixelMounted ? (
                  <div className="flex-1 flex flex-col">
                    <div className="flex-1 flex flex-col items-center justify-center rounded-xl border border-dashed border-primary/40 bg-primary/5 p-6 text-center space-y-4">
                      <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <CreditCard className="h-6 w-6" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-heading font-bold text-base text-foreground">
                          جاهز للدفع
                        </h4>
                        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                          انقر على الزر بالأسفل لفتح نموذج الدفع المباشر دون مغادرة الصفحة.
                        </p>
                      </div>

                      <Button
                        data-tour="payment-pay-btn"
                        onClick={handleLaunchPaymob}
                        disabled={isInitializingPixel}
                        className="gradient-primary border-0 text-primary-foreground font-heading h-12 font-bold rounded-xl px-8 shadow-md hover:opacity-95"
                      >
                        {isInitializingPixel ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin ml-2" />
                            جاري تهيئة...
                          </>
                        ) : (
                          <>فتح نموذج الدفع ({payablePrice} $)</>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 flex-1 flex flex-col">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>أدخل بيانات البطاقة في النموذج أدناه:</span>
                      <button
                        onClick={handleLaunchPaymob}
                        className="text-primary hover:underline font-bold"
                      >
                        إعادة تحميل النموذج
                      </button>
                    </div>

                    {/* Paymob Pixel Mount Element */}
                    <div
                      id="paymob-checkout-container"
                      className="w-full flex-1 min-h-[420px] rounded-xl border border-border bg-background p-4 [&_iframe]:w-full [&_iframe]:h-full"
                    ></div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-3 flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isProcessing}
                  className="border-destructive/30 hover:bg-destructive/10 text-destructive h-10 font-bold font-heading rounded-xl px-4 text-xs"
                >
                  <Trash2 className="h-4 w-4 ml-1.5" />
                  إلغاء وحذف التقدم
                </Button>
              </div>
            </div>

            {/* Billing Summary */}
            <div data-tour="payment-summary" className="md:col-span-2 space-y-4">
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-lg font-heading font-bold text-foreground">
                  ملخص الدفعة المستحقة
                </h3>

                <div className="space-y-3">
                  {items.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex justify-between items-start gap-4 p-3 rounded-xl border border-border/50 bg-muted/10"
                    >
                      <div className="text-left font-bold text-foreground text-sm pt-0.5">
                        {item.price} $
                      </div>
                      <div className="text-right flex-1 min-w-0">
                        <h4 className="font-heading font-bold text-xs text-foreground leading-snug break-words">
                          {item.testTitle}
                        </h4>
                        <div className="flex items-center gap-1.5 justify-end mt-1 text-[10px] text-muted-foreground font-sans">
                          <span>⏱️ {item.duration} دقيقة</span>
                          <span>•</span>
                          <span>📚 {item.hours} ساعة CPE</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-4 space-y-2 text-sm font-sans">
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>إجمالي الساعات المعتمدة:</span>
                    <span className="font-bold text-foreground">{totalCpe} ساعة</span>
                  </div>

                  {isBundle && (
                    <>
                      <div className="flex justify-between items-center text-muted-foreground">
                        <span>السعر الأصلي:</span>
                        <span className="line-through">{originalPrice} $</span>
                      </div>
                      {discountPercentage > 0 && (
                        <div className="flex justify-between items-center text-green-500 font-semibold text-xs">
                          <span>خصم الباقة ({discountPercentage}%):</span>
                          <span>-{originalPrice - payablePrice} $</span>
                        </div>
                      )}
                    </>
                  )}

                  <div className="flex justify-between items-center text-base font-bold border-t border-border/40 pt-2">
                    <span className="text-foreground">الإجمالي المطلوب:</span>
                    <span className="text-primary font-black text-lg">{payablePrice} $</span>
                  </div>
                </div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-2xl p-4 flex gap-3 text-right">
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-amber-500" />
                <div>
                  <p className="font-bold text-xs text-foreground">تنبيه التقدم ومخاطر الإلغاء</p>
                  <p className="text-[10px] mt-0.5 text-muted-foreground leading-relaxed font-sans">
                    إذا قمت بإلغاء هذه الدفعة من خلال زر "إلغاء وحذف التقدم"، سيتم حذف جميع التقدم
                    الذي أحرزته في الاختبارات بنجاح وإلغاء القفل لتبدأ مجدداً.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Payment;
