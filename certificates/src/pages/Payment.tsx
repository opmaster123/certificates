import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { testVariantsService } from "@/services/test-variants";
import {
  CreditCard,
  Trash2,
  Loader2,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/DashboardLayout";

const Payment = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [activeBundle, setActiveBundle] = useState<any | null>(null);
  const [individualLock, setIndividualLock] = useState<any | null>(null);

  // Payment Form State
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardName, setCardName] = useState("");

  // Processing & Success State
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const fetchActiveStatus = async () => {
    try {
      setLoading(true);
      // 1. Fetch active individual lock
      const indLock = await testVariantsService.getActiveIndividualTest();
      if (indLock) {
        setIndividualLock(indLock);
        setActiveBundle(null);
        setLoading(false);
        return;
      }

      // 2. Fetch active bundle
      const bundle = await testVariantsService.getActiveBundle();
      if (bundle) {
        setActiveBundle(bundle);
        setIndividualLock(null);
      }
      setLoading(false);
    } catch (e) {
      console.error("Error fetching locks:", e);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveStatus();
  }, []);

  const handlePay = () => {
    if (!cardNumber || !cardExpiry || !cardCvc || !cardName) {
      toast({
        title: "خطأ في الدفع",
        description: "يرجى تعبئة جميع حقول بطاقة الدفع.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    // Simulate payment transaction
    setTimeout(() => {
      setIsProcessing(false);
      setPaymentSuccess(true);
      toast({
        title: "تم الدفع بنجاح!",
        description: "تمت عملية الدفع التجريبية بنجاح. شكراً لك!",
      });
    }, 2500);
  };

  const handleCancel = async () => {
    try {
      if (individualLock) {
        await testVariantsService.cancelIndividualTest();
        toast({
          title: "تم إلغاء الاختبار",
          description: "تم حذف الاختبار الفردي وإلغاء القفل بنجاح.",
        });
      } else if (activeBundle) {
        await testVariantsService.cancelBundle();
        toast({
          title: "تم إلغاء الباقة",
          description:
            "تم إلغاء الباقة وحذف التقدم المحرز في الاختبارات بنجاح.",
        });
      }
      navigate("/tests");
    } catch (e: any) {
      toast({
        title: "فشل إلغاء الحجز",
        description: e.message || "حدث خطأ غير متوقع.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-[60vh] w-full flex-col items-center justify-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground font-heading">
            جاري جلب تفاصيل الدفع...
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (!activeBundle && !individualLock) {
    return (
      <DashboardLayout>
        <div className="flex h-[60vh] w-full flex-col items-center justify-center text-center space-y-6 max-w-md mx-auto">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <CreditCard className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-heading font-bold text-foreground">
              لا توجد دفعات مستحقة
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed font-sans">
              ليس لديك باقة اختبارات مكتملة أو اختبار فردي مستحق الدفع حالياً.
              تصفح الاختبارات المتاحة للبدء.
            </p>
          </div>
          <Button
            asChild
            className="gradient-primary border-0 text-primary-foreground hover:opacity-90"
          >
            <Link to="/tests">عرض الاختبارات المتاحة</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // Calculate prices based on locking state
  const isBundle = !!activeBundle;
  const items = isBundle ? activeBundle.tests : [individualLock];
  const payablePrice = isBundle
    ? activeBundle.discountedPrice
    : individualLock.price;
  const originalPrice = isBundle
    ? activeBundle.originalPrice
    : individualLock.price;
  const discountPercentage = isBundle ? activeBundle.discountPercentage : 0;
  const totalCpe = isBundle ? activeBundle.totalHours : individualLock.hours;

  return (
    <DashboardLayout>
      <div className="space-y-6 text-right max-w-5xl mx-auto" dir="rtl">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border/40 pb-5">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-lg"
          >
            <Link to="/tests">
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">
              إتمام الدفع
            </h1>
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
                تمت عملية الدفع بنجاح!
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed font-sans">
                نشكرك على إتمام الدفع. تم إرسال طلب الدفع الخاص بك وجاري إتمام
                تسجيل الشهادات مع الجهات المعنية.
              </p>
            </div>

            <div className="bg-muted/30 border border-border/50 rounded-xl p-4 text-sm font-sans space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">نوع العملية:</span>
                <span className="font-semibold text-foreground">
                  {isBundle ? "باقة اختبارات" : "اختبار مستقل"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">المبلغ المدفوع:</span>
                <span className="font-bold text-primary">{payablePrice} $</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">إجمالي ساعات CPE:</span>
                <span className="font-semibold text-foreground">
                  {totalCpe} ساعة
                </span>
              </div>
            </div>

            <Button
              asChild
              className="w-full gradient-primary border-0 text-primary-foreground font-heading"
            >
              <Link to="/tests">العودة إلى الرئيسية</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-5">
            {/* Payment form */}
            <div className="md:col-span-3 bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div className="space-y-5">
                <h3 className="text-lg font-heading font-bold text-foreground flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  بيانات بطاقة الدفع (تجريبي)
                </h3>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">
                      الاسم المكتوب على البطاقة
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-xl border border-border bg-transparent px-4 py-3 text-sm text-right focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="Ahmed Mohamed"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">
                      رقم البطاقة
                    </label>
                    <input
                      type="text"
                      maxLength={16}
                      className="w-full rounded-xl border border-border bg-transparent px-4 py-3 text-sm text-left focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                      placeholder="4000 1234 5678 9010"
                      value={cardNumber}
                      onChange={(e) =>
                        setCardNumber(e.target.value.replace(/\D/g, ""))
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">
                        رمز التحقق (CVC)
                      </label>
                      <input
                        type="password"
                        maxLength={3}
                        className="w-full rounded-xl border border-border bg-transparent px-4 py-3 text-sm text-left focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                        placeholder="***"
                        value={cardCvc}
                        onChange={(e) =>
                          setCardCvc(e.target.value.replace(/\D/g, ""))
                        }
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">
                        تاريخ الانتهاء
                      </label>
                      <input
                        type="text"
                        maxLength={5}
                        className="w-full rounded-xl border border-border bg-transparent px-4 py-3 text-sm text-left focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 items-center bg-muted/30 border border-border/50 rounded-xl p-3 text-xs text-muted-foreground leading-relaxed font-sans">
                  <ShieldCheck className="h-5 w-5 text-success shrink-0" />
                  <span>
                    عملية دفع تجريبية آمنة ومحميّة بالكامل من خلال محاكي الدفع.
                  </span>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <Button
                  onClick={handlePay}
                  disabled={isProcessing}
                  className="flex-1 gradient-primary border-0 text-primary-foreground font-heading h-12 font-bold rounded-xl flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      جاري إتمام العملية...
                    </>
                  ) : (
                    `تأكيد دفع ${payablePrice} $`
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isProcessing}
                  className="border-destructive/30 hover:bg-destructive/10 text-destructive h-12 font-bold font-heading rounded-xl px-5"
                >
                  <Trash2 className="h-4 w-4 ml-1.5" />
                  إلغاء وحذف التقدم
                </Button>
              </div>
            </div>

            {/* Billing Summary */}
            <div className="md:col-span-2 space-y-4">
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
                      <div className="text-right">
                        <h4 className="font-heading font-bold text-xs text-foreground line-clamp-1">
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
                    <span className="font-bold text-foreground">
                      {totalCpe} ساعة
                    </span>
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
                    <span className="text-primary font-black text-lg">
                      {payablePrice} $
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-2xl p-4 flex gap-3 text-right">
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-amber-500" />
                <div>
                  <p className="font-bold text-xs text-foreground">
                    تنبيه التقدم ومخاطر الإلغاء
                  </p>
                  <p className="text-[10px] mt-0.5 text-muted-foreground leading-relaxed font-sans">
                    إذا قمت بإلغاء هذه الدفعة من خلال زر "إلغاء وحذف التقدم"،
                    سيتم حذف جميع التقدم الذي أحرزته في الاختبارات بنجاح وإلغاء
                    القفل لتبدأ مجدداً.
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
