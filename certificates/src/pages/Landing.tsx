import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle,
  ArrowLeft,
  FileText,
  ShoppingCart,
  QrCode,
  Menu,
  X,
  BookOpen,
  CreditCard,
  Award,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { TIER_METRICS, DISCOUNT_TIERS } from '@shared/pricing';

const individualFlowSteps = [
  {
    step: '١',
    title: 'اختر اختباراً واحداً',
    description:
      'من صفحة الاختبارات، اختر الموضوع المناسب لتخصصك (CIA, CMA, CPA, CFE, CISA) وحجم الاختبار (2 أو 4 أو 6 ساعات) ثم ابدأ الاختبار.',
    icon: BookOpen,
  },
  {
    step: '٢',
    title: 'أجب عن الأسئلة مجاناً',
    description:
      'قدّم الاختبار مباشرة عبر الموقع بدون دفع مسبق. تحتاج إلى نتيجة 70% للنجاح، ويمكنك إعادة المحاولة مجاناً إذا لم تجتز.',
    icon: FileText,
  },
  {
    step: '٣',
    title: 'ادفع واستلم الشهادة',
    description:
      'بعد نجاحك في الاختبار، انتقل إلى صفحة الدفع لسداد رسوم الاختبار فقط، وستصدر شهادتك فوراً لتحميلها بصيغة PDF.',
    icon: Award,
  },
];

const bundleFlowSteps = [
  {
    step: '١',
    title: 'أضف عدة اختبارات إلى السلة',
    description:
      'اختر أكثر من اختبار وأضفها إلى سلة الحزمة، لتحصل على خصم 20% (من 10 إلى 19 ساعة) أو خصم 30% (لـ 20 ساعة فأكثر) ثم اعتمد الحزمة.',
    icon: ShoppingCart,
  },
  {
    step: '٢',
    title: 'أكمل جميع اختبارات الحزمة',
    description:
      'تُثبّت الحزمة في حسابك، وتقوم بحل واجتياز كل اختبار داخل الحزمة على حدة مجاناً وبسرعتك الخاصة.',
    icon: CheckCircle,
  },
  {
    step: '٣',
    title: 'ادفع مرة واحدة واستلم كل الشهادات',
    description:
      'بعد اجتياز جميع اختبارات الحزمة، تدفع المبلغ الإجمالي المخفض في خطوة واحدة، وتصدر جميع شهاداتك دفعة واحدة.',
    icon: CreditCard,
  },
];

const certificateFlowSteps = [
  {
    title: 'تعديل تواريخ الشهادة قبل التحميل',
    description:
      'من صفحة (شهاداتي)، يمكنك تحديد تاريخ بداية ونهاية الدورة وتاريخ الإصدار لكل شهادة لتتناسب مع فترة التقرير الخاصة بك قبل تحميل ملف الـ PDF.',
    icon: Calendar,
  },
  {
    title: 'التحقق من الشهادة عبر رمز QR',
    description:
      'تحمل كل شهادة رقماً مرجعياً ورمز QR يفتح صفحة الشهادة الرسمية مباشرة للتأكد من صحتها ومطابقة بياناتها.',
    icon: QrCode,
  },
];

const testSizes = [
  {
    name: 'اختبار قصير',
    hours: TIER_METRICS.SMALL.hours,
    questions: TIER_METRICS.SMALL.questionCount,
    duration: TIER_METRICS.SMALL.duration,
    price: TIER_METRICS.SMALL.price,
  },
  {
    name: 'اختبار متوسط',
    hours: TIER_METRICS.MEDIUM.hours,
    questions: TIER_METRICS.MEDIUM.questionCount,
    duration: TIER_METRICS.MEDIUM.duration,
    price: TIER_METRICS.MEDIUM.price,
  },
  {
    name: 'اختبار شامل',
    hours: TIER_METRICS.LARGE.hours,
    questions: TIER_METRICS.LARGE.questionCount,
    duration: TIER_METRICS.LARGE.duration,
    price: TIER_METRICS.LARGE.price,
  },
];

const Landing = () => {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div
      className="min-h-screen bg-[#070b13] text-slate-100 font-sans selection:bg-accent selection:text-accent-foreground"
      dir="rtl"
    >
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#070b13]/95 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white p-1.5 shadow-sm">
              <img
                src="/logo-pic-nobg.png"
                alt="خطى للتدريب والاستشارات"
                className="h-full w-full object-contain"
              />
            </div>
            <span className="text-lg font-heading font-bold text-sidebar-foreground">
              خطى للتدريب والاستشارات
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a
              href="#about"
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              عن الموقع
            </a>
            <a
              href="#flows"
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              خطوات الاستخدام
            </a>
            <a
              href="#pricing"
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              الأسعار والخصومات
            </a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <Button
                asChild
                className="gradient-accent border-0 text-accent-foreground hover:opacity-90 font-heading font-bold"
              >
                <Link to="/tests">الذهاب للاختبارات</Link>
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  asChild
                  className="text-slate-200 hover:text-white hover:bg-white/10"
                >
                  <Link to="/login">تسجيل الدخول</Link>
                </Button>
                <Button
                  asChild
                  className="gradient-accent border-0 text-accent-foreground hover:opacity-90 font-heading font-bold"
                >
                  <Link to="/register">إنشاء حساب</Link>
                </Button>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
            className="md:hidden p-2 text-slate-300 hover:text-white rounded-lg hover:bg-white/10"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 bg-[#0b1323] px-6 py-4 space-y-3">
            <a
              href="#about"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm text-slate-300 hover:text-white"
            >
              عن الموقع
            </a>
            <a
              href="#flows"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm text-slate-300 hover:text-white"
            >
              خطوات الاستخدام
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm text-slate-300 hover:text-white"
            >
              الأسعار والخصومات
            </a>
            <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
              {user ? (
                <Button
                  asChild
                  className="w-full gradient-accent border-0 text-accent-foreground font-heading font-bold"
                >
                  <Link to="/tests">الذهاب للاختبارات</Link>
                </Button>
              ) : (
                <>
                  <Button
                    asChild
                    className="w-full gradient-accent border-0 text-accent-foreground font-heading font-bold"
                  >
                    <Link to="/register">إنشاء حساب</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full border-white/15 bg-white/5 text-white hover:bg-white/10"
                  >
                    <Link to="/login">تسجيل الدخول</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Hero: Simple overview of what the website is */}
      <section id="about" className="py-16 md:py-24 border-b border-white/10">
        <div className="container mx-auto px-6 max-w-3xl text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white p-2.5 shadow-md">
            <img
              src="/logo-pic-nobg.png"
              alt="خطى للتدريب والاستشارات"
              className="h-full w-full object-contain"
            />
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-white leading-tight">
            منصة لإصدار شهادات ساعات التعليم المهني المستمر (CPE) عبر اختبارات قصيرة
          </h1>

          <p className="mt-6 text-base md:text-lg text-slate-300 leading-relaxed">
            موقع <strong className="text-white">خطى للتدريب والاستشارات</strong> يساعد المحاسبين
            والمراجعين على كسب ساعات التعليم المستمر (لشهادات CIA وCMA وCPA وCFE وCISA) عن طريق
            الإجابة عن اختبارات إلكترونية مباشرة دون الحاجة لمشاهدة محاضرات طويلة. يمكنك تقديم أي
            اختبار مجاناً، والدفع يكون فقط بعد اجتياز الاختبار لإصدار شهادتك.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              asChild
              className="gradient-accent border-0 text-accent-foreground px-8 py-6 text-base font-heading font-bold w-full sm:w-auto"
            >
              <Link to={user ? '/tests' : '/register'}>
                ابدأ الآن مجاناً <ArrowLeft className="mr-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="border-white/15 bg-white/5 text-white hover:bg-white/10 px-8 py-6 text-base w-full sm:w-auto"
            >
              <Link to="/trial">جرّب اختباراً تجريبياً</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Step-by-Step Flows */}
      <section id="flows" className="py-16 md:py-20 border-b border-white/10">
        <div className="container mx-auto px-6 max-w-5xl space-y-14">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-white">
              خطوات استخدام الموقع (جميع المسارات)
            </h2>
            <p className="mt-3 text-slate-300 text-sm md:text-base">
              يعمل الموقع وفق مسارين بسيطين: إما اختيار اختبار واحد على حدة، أو تجميع عدة اختبارات
              في حزمة واحدة للحصول على خصم.
            </p>
          </div>

          {/* Flow 1: Single Test Flow */}
          <div className="space-y-5">
            <div className="border-b border-white/10 pb-3">
              <h3 className="text-xl font-heading font-bold text-white">
                ١. مسار الاختبار الفردي (اختبار واحد في كل مرة)
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                إذا كنت تريد تقديم اختبار واحد فقط وإصدار شهادته مباشرة:
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {individualFlowSteps.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.step}
                    className="rounded-xl border border-white/10 bg-[#0d1526] p-5 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-heading font-bold text-accent bg-accent/10 px-3 py-1 rounded-full">
                        الخطوة {item.step}
                      </span>
                      <Icon className="h-5 w-5 text-slate-300" />
                    </div>
                    <h4 className="text-base font-heading font-bold text-white">{item.title}</h4>
                    <p className="text-sm text-slate-300 leading-relaxed">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Flow 2: Bundle Flow */}
          <div className="space-y-5">
            <div className="border-b border-white/10 pb-3">
              <h3 className="text-xl font-heading font-bold text-white">
                ٢. مسار حزمة الاختبارات (عدة اختبارات بخصم حتى 30%)
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                إذا كنت تحتاج إلى ساعات كثيرة وتريد توفير التكلفة:
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {bundleFlowSteps.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.step}
                    className="rounded-xl border border-white/10 bg-[#0d1526] p-5 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-heading font-bold text-secondary bg-secondary/10 px-3 py-1 rounded-full">
                        الخطوة {item.step}
                      </span>
                      <Icon className="h-5 w-5 text-slate-300" />
                    </div>
                    <h4 className="text-base font-heading font-bold text-white">{item.title}</h4>
                    <p className="text-sm text-slate-300 leading-relaxed">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Flow 3: Certificate Customization & Verification */}
          <div className="space-y-5">
            <div className="border-b border-white/10 pb-3">
              <h3 className="text-xl font-heading font-bold text-white">
                ٣. بعد الدفع: إدارة الشهادة والتحقق منها
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                بمجرد إتمام الدفع، تظهر شهاداتك في صفحة (شهاداتي) ويمكنك:
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {certificateFlowSteps.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="rounded-xl border border-white/10 bg-[#0d1526] p-5 flex items-start gap-4"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5 border border-white/10">
                      <Icon className="h-5 w-5 text-accent" />
                    </div>
                    <div className="space-y-1.5">
                      <h4 className="text-base font-heading font-bold text-white">{item.title}</h4>
                      <p className="text-sm text-slate-300 leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Simple Pricing & Test Sizes */}
      <section id="pricing" className="py-16 md:py-20 border-b border-white/10">
        <div className="container mx-auto px-6 max-w-5xl space-y-10">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-white">
              أحجام الاختبارات والأسعار
            </h2>
            <p className="mt-3 text-slate-300 text-sm md:text-base">
              أسعار ثابتة واضحة ومحددة لكل اختبار، وتتوفر الاختبارات بثلاثة أحجام تناسب احتياجك:
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {testSizes.map((tier) => (
              <div
                key={tier.name}
                className="rounded-xl border border-white/10 bg-[#0d1526] p-6 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-heading font-bold text-white">{tier.name}</h3>
                  <span className="text-xs font-bold bg-white/10 text-white px-2.5 py-1 rounded-full">
                    {tier.hours} ساعات معتمدة
                  </span>
                </div>

                <div className="text-3xl font-heading font-bold text-accent">${tier.price}</div>

                <ul className="space-y-2 pt-3 border-t border-white/10 text-sm text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-secondary shrink-0" />
                    عدد الأسئلة: {tier.questions} سؤالاً
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-secondary shrink-0" />
                    المدة التقريبية: {tier.duration} دقيقة
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-secondary shrink-0" />
                    الدفع بعد اجتياز الاختبار فقط
                  </li>
                </ul>
              </div>
            ))}
          </div>

          {/* Bundle Discounts Notice */}
          <div className="rounded-xl border border-white/10 bg-[#0d1526] p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center md:text-right">
              <h4 className="text-base font-heading font-bold text-white">
                خصومات الحزم التلقائية
              </h4>
              <p className="text-sm text-slate-300">
                عند تجميع عدة اختبارات في حزمة واحدة، يحسب الموقع الخصم تلقائياً حسب إجمالي الساعات:
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {DISCOUNT_TIERS.map((d) => (
                <span
                  key={d.minHours}
                  className="rounded-lg border border-secondary/30 bg-secondary/10 px-4 py-2 text-sm font-heading font-bold text-secondary"
                >
                  {d.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#060a12] py-10">
        <div className="container mx-auto px-6 max-w-5xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white p-1.5 shadow-sm">
              <img
                src="/logo-pic-nobg.png"
                alt="خطى للتدريب والاستشارات"
                className="h-full w-full object-contain"
              />
            </div>
            <span className="text-lg font-heading font-bold text-sidebar-foreground">
              خطى للتدريب والاستشارات
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-sm text-slate-400">
            <a href="#about" className="hover:text-white transition-colors">
              عن الموقع
            </a>
            <a href="#flows" className="hover:text-white transition-colors">
              خطوات الاستخدام
            </a>
            <a href="#pricing" className="hover:text-white transition-colors">
              الأسعار
            </a>
            <Link to="/trial" className="hover:text-white transition-colors">
              الاختبار التجريبي
            </Link>
          </div>

          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} خطى للتدريب والاستشارات. جميع الحقوق محفوظة.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
