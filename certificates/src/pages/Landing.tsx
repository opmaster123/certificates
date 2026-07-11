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
      className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-emerald-500 selection:text-white"
      dir="rtl"
    >
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-emerald-100/80 bg-white/90 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white p-1.5 shadow-sm border border-emerald-100">
              <img
                src="/logo-pic-nobg.png"
                alt="خطى للتدريب والاستشارات"
                className="h-full w-full object-contain"
              />
            </div>
            <span className="text-lg font-heading font-bold text-emerald-950">
              خطى للتدريب والاستشارات
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a
              href="#about"
              className="text-sm font-medium text-slate-600 hover:text-emerald-700 transition-colors"
            >
              عن الموقع
            </a>
            <a
              href="#flows"
              className="text-sm font-medium text-slate-600 hover:text-emerald-700 transition-colors"
            >
              خطوات الاستخدام
            </a>
            <a
              href="#pricing"
              className="text-sm font-medium text-slate-600 hover:text-emerald-700 transition-colors"
            >
              الأسعار والخصومات
            </a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <Button
                asChild
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-heading font-bold shadow-sm shadow-emerald-600/20"
              >
                <Link to="/tests">الذهاب للاختبارات</Link>
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  asChild
                  className="text-emerald-800 hover:text-emerald-900 hover:bg-emerald-50 font-medium"
                >
                  <Link to="/login">تسجيل الدخول</Link>
                </Button>
                <Button
                  asChild
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-heading font-bold shadow-sm shadow-emerald-600/20"
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
            className="md:hidden p-2 text-slate-600 hover:text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-emerald-100 bg-white/95 px-6 py-4 space-y-3 shadow-lg">
            <a
              href="#about"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm text-slate-700 hover:text-emerald-700 font-medium"
            >
              عن الموقع
            </a>
            <a
              href="#flows"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm text-slate-700 hover:text-emerald-700 font-medium"
            >
              خطوات الاستخدام
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm text-slate-700 hover:text-emerald-700 font-medium"
            >
              الأسعار والخصومات
            </a>
            <div className="pt-3 border-t border-emerald-100 flex flex-col gap-2">
              {user ? (
                <Button
                  asChild
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-heading font-bold"
                >
                  <Link to="/tests">الذهاب للاختبارات</Link>
                </Button>
              ) : (
                <>
                  <Button
                    asChild
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-heading font-bold"
                  >
                    <Link to="/register">إنشاء حساب</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-50"
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
      <section id="about" className="relative py-16 md:py-24 border-b border-emerald-100/80 bg-gradient-to-b from-emerald-50/70 via-slate-50/40 to-white overflow-hidden">
        {/* Soft Ambient Glow */}
        <div className="absolute top-1/4 right-1/2 translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="container mx-auto px-6 max-w-3xl text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white p-2.5 shadow-md border border-emerald-100">
            <img
              src="/logo-pic-nobg.png"
              alt="خطى للتدريب والاستشارات"
              className="h-full w-full object-contain"
            />
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-slate-900 leading-tight">
            منصة لإصدار شهادات ساعات التعليم المهني المستمر (CPE) عبر اختبارات قصيرة
          </h1>

          <p className="mt-6 text-base md:text-lg text-slate-600 leading-relaxed">
            موقع <strong className="text-emerald-900 font-bold">خطى للتدريب والاستشارات</strong> يساعد المحاسبين
            والمراجعين على كسب ساعات التعليم المستمر (لشهادات CIA وCMA وCPA وCFE وCISA) عن طريق
            الإجابة عن اختبارات إلكترونية مباشرة دون الحاجة لمشاهدة محاضرات طويلة. يمكنك تقديم أي
            اختبار مجاناً، والدفع يكون فقط بعد اجتياز الاختبار لإصدار شهادتك.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              asChild
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 px-8 py-6 text-base font-heading font-bold w-full sm:w-auto transition-all"
            >
              <Link to={user ? '/tests' : '/register'}>
                ابدأ الآن مجاناً <ArrowLeft className="mr-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-50 hover:border-emerald-300 px-8 py-6 text-base w-full sm:w-auto shadow-sm transition-all"
            >
              <Link to="/trial">جرّب اختباراً تجريبياً</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Step-by-Step Flows */}
      <section id="flows" className="py-16 md:py-20 border-b border-emerald-100/80 bg-white">
        <div className="container mx-auto px-6 max-w-5xl space-y-14">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-slate-900">
              خطوات استخدام الموقع (جميع المسارات)
            </h2>
            <p className="mt-3 text-slate-600 text-sm md:text-base">
              يعمل الموقع وفق مسارين بسيطين: إما اختيار اختبار واحد على حدة، أو تجميع عدة اختبارات
              في حزمة واحدة للحصول على خصم.
            </p>
          </div>

          {/* Flow 1: Single Test Flow */}
          <div className="space-y-5">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="text-xl font-heading font-bold text-slate-900">
                ١. مسار الاختبار الفردي (اختبار واحد في كل مرة)
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                إذا كنت تريد تقديم اختبار واحد فقط وإصدار شهادته مباشرة:
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {individualFlowSteps.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.step}
                    className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-5 space-y-3 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-heading font-bold text-emerald-800 bg-emerald-100/80 border border-emerald-200/70 px-3 py-1 rounded-full">
                        الخطوة {item.step}
                      </span>
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-emerald-100 text-emerald-600 shadow-xs">
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                    </div>
                    <h4 className="text-base font-heading font-bold text-slate-900">{item.title}</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Flow 2: Bundle Flow */}
          <div className="space-y-5">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="text-xl font-heading font-bold text-slate-900">
                ٢. مسار حزمة الاختبارات (عدة اختبارات بخصم حتى 30%)
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                إذا كنت تحتاج إلى ساعات كثيرة وتريد توفير التكلفة:
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {bundleFlowSteps.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.step}
                    className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-5 space-y-3 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-heading font-bold text-emerald-800 bg-emerald-100/80 border border-emerald-200/70 px-3 py-1 rounded-full">
                        الخطوة {item.step}
                      </span>
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-emerald-100 text-emerald-600 shadow-xs">
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                    </div>
                    <h4 className="text-base font-heading font-bold text-slate-900">{item.title}</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Flow 3: Certificate Customization & Verification */}
          <div className="space-y-5">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="text-xl font-heading font-bold text-slate-900">
                ٣. بعد الدفع: إدارة الشهادة والتحقق منها
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                بمجرد إتمام الدفع، تظهر شهاداتك في صفحة (شهاداتي) ويمكنك:
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {certificateFlowSteps.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-5 flex items-start gap-4 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all duration-200"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white border border-emerald-100 text-emerald-600 shadow-xs">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="space-y-1.5">
                      <h4 className="text-base font-heading font-bold text-slate-900">{item.title}</h4>
                      <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Simple Pricing & Test Sizes */}
      <section id="pricing" className="py-16 md:py-20 border-b border-emerald-100/80 bg-slate-50/80">
        <div className="container mx-auto px-6 max-w-5xl space-y-10">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-slate-900">
              أحجام الاختبارات والأسعار
            </h2>
            <p className="mt-3 text-slate-600 text-sm md:text-base">
              أسعار ثابتة واضحة ومحددة لكل اختبار، وتتوفر الاختبارات بثلاثة أحجام تناسب احتياجك:
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {testSizes.map((tier) => (
              <div
                key={tier.name}
                className="rounded-2xl border border-emerald-100 bg-white p-6 space-y-4 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-heading font-bold text-slate-900">{tier.name}</h3>
                  <span className="text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2.5 py-1 rounded-full">
                    {tier.hours} ساعات معتمدة
                  </span>
                </div>

                <div className="text-3xl font-heading font-black text-emerald-600">${tier.price}</div>

                <ul className="space-y-2.5 pt-3 border-t border-slate-100 text-sm text-slate-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>عدد الأسئلة: <strong className="text-slate-800">{tier.questions}</strong> سؤالاً</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>المدة التقريبية: <strong className="text-slate-800">{tier.duration}</strong> دقيقة</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>الدفع بعد اجتياز الاختبار فقط</span>
                  </li>
                </ul>
              </div>
            ))}
          </div>

          {/* Bundle Discounts Notice */}
          <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50 via-emerald-100/40 to-emerald-50 p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="space-y-1 text-center md:text-right">
              <h4 className="text-base font-heading font-bold text-emerald-950">
                خصومات الحزم التلقائية
              </h4>
              <p className="text-sm text-emerald-800/80">
                عند تجميع عدة اختبارات في حزمة واحدة، يحسب الموقع الخصم تلقائياً حسب إجمالي الساعات:
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {DISCOUNT_TIERS.map((d) => (
                <span
                  key={d.minHours}
                  className="rounded-xl border border-emerald-300 bg-white px-4 py-2 text-sm font-heading font-bold text-emerald-800 shadow-xs"
                >
                  {d.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-emerald-100 py-10">
        <div className="container mx-auto px-6 max-w-5xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white p-1.5 shadow-sm border border-emerald-100">
              <img
                src="/logo-pic-nobg.png"
                alt="خطى للتدريب والاستشارات"
                className="h-full w-full object-contain"
              />
            </div>
            <span className="text-lg font-heading font-bold text-emerald-950">
              خطى للتدريب والاستشارات
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-sm text-slate-600">
            <a href="#about" className="hover:text-emerald-700 transition-colors">
              عن الموقع
            </a>
            <a href="#flows" className="hover:text-emerald-700 transition-colors">
              خطوات الاستخدام
            </a>
            <a href="#pricing" className="hover:text-emerald-700 transition-colors">
              الأسعار
            </a>
            <Link to="/trial" className="hover:text-emerald-700 transition-colors">
              الاختبار التجريبي
            </Link>
          </div>

          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} خطى للتدريب والاستشارات. جميع الحقوق محفوظة.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
