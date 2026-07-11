import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { TIER_METRICS, calculateDiscountPercentage } from "@shared/pricing";
import {
  Zap,
  BarChart3,
  Trophy,
  CheckCircle,
  ArrowLeft,
  BookOpen,
  Clock,
  Shield,
  Award,
  Star,
  Users,
  Globe,
  ChevronDown,
  Check,
  X,
  Calculator,
  Sparkles,
  HelpCircle,
  Menu,
  FileText,
  Lock,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Smooth spring transitions
const springTransition = { type: "spring", stiffness: 300, damping: 30 };

const sampleQuestions = [
  {
    question:
      "أي من التالي يعد الهدف الأساسي من نظام الرقابة الداخلية في الشركات؟",
    options: [
      "تقليل أعداد الموظفين لخفض التكاليف التشغيلية",
      "حماية الأصول، وضمان دقة التقارير المالية، والالتزام بالقوانين",
      "إخفاء الأخطاء المحاسبية عن الجهات الرقابية الخارجية",
      "زيادة أسعار بيع المنتجات في السوق المحلّي",
    ],
    correctIndex: 1,
    explanation:
      "الهدف الرئيسي للرقابة الداخلية هو حماية أصول الشركة، والتأكد من دقة واكتمال سجلاتها المالية والالتزام بالأنظمة المنظمة للعمل.",
  },
  {
    question:
      "ما هو المبدأ الأساسي لتكلفة الفرصة البديلة (Opportunity Cost) في التحليل المالي؟",
    options: [
      "التكلفة الفعلية المدفوعة لشراء أصول جديدة",
      "قيمة العائد المفقود نتيجة اختيار بديل استثماري دون الآخر",
      "مجموع المصاريف الإدارية والعمومية في نهاية السنة المالية",
      "التكاليف المرتبطة فقط بالدعاية والتسويق للمنتجات",
    ],
    correctIndex: 1,
    explanation:
      "تكلفة الفرصة البديلة هي الفائدة أو العائد المفقود الذي كان يمكن تحقيقه من الخيار البديل الأفضل التالي عند اتخاذ قرار معين.",
  },
  {
    question:
      "وفقاً لمعايير التدقيق الداخلي (IIA)، لضمان استقلالية وظيفة التدقيق، يجب أن يتبع رئيس التدقيق الداخلي تنظيمياً لـ:",
    options: [
      "المدير المالي التنفيذي (CFO)",
      "لجنة التدقيق المنبثقة عن مجلس الإدارة",
      "مدير المشتريات والمستودعات بالشركة",
      "المدير العام لتقنية المعلومات",
    ],
    correctIndex: 1,
    explanation:
      "تتطلب المعايير أن يتبع رئيس التدقيق الداخلي وظيفياً وتعد التقارير مباشرة إلى لجنة التدقيق أو مجلس الإدارة لضمان الحياد والاستقلالية التامة عن الإدارة التنفيذية.",
  },
];

const faqs = [
  {
    q: "هل الشهادات المهنية الممنوحة معترف بها ومقبولة؟",
    a: "نعم، جميع شهادات الساعات معتمدة ومصممة لتتوافق بالكامل مع معايير التعليم المهني المستمر (CPE) المعترف بها دولياً لدى معهد المدققين الداخليين (IIA) ومعهد المحاسبين الإداريين (IMA) ومعهد المحاسبين القانونيين الأمريكي (AICPA). تحتوي كل شهادة على كود توثيق فريد وسجل تدقيق لأدائك (Audit Trail) ورمز QR للتحقق المباشر من قبل جهة العمل أو الهيئة المنظمة.",
  },
  {
    q: "كيف يعمل نموذج 'الدفع عند الاجتياز' (Pay-on-Pass)؟",
    a: "نحن نؤمن بالقيمة الحقيقية. يمكنك التسجيل مجاناً، وتصفح كافة الاختبارات وحلها كاملة لمعرفة مستواك الفعلي. لن تضطر لدفع أي شيء أو إدخال بطاقة ائتمانية قبل أن تنجح فعلياً في الاختبار وتحقق النسبة المطلوبة. فقط عندما تنجح وتكون مستعداً لإصدار شهادتك واعتماد ساعاتك، تقوم بالدفع لتوليد الشهادة الرسمية المشفرة.",
  },
  {
    q: "ماذا لو لم أجتز التقييم من المرة الأولى؟",
    a: "لا داعي للقلق إطلاقاً. يمكنك مراجعة الإجابات الصحيحة والتوضيحات التعليمية المرفقة، ثم إعادة المحاولة مجاناً وبعدد مرات غير محدود حتى تجتاز بنجاح (تحتاج إلى 70% للاجتياز). لن تترتب عليك أي رسوم جراء الفشل في المحاولة.",
  },
  {
    q: "هل تناسب المنصة متطلبات الهيئة السعودية للمراجعين والمحاسبين (SOCPA)؟",
    a: "نعم، المحتوى مصمم ومقسّم ويوفر ساعات CPE معتمدة توافق متطلبات التطوير المهني المستمر لمحاسبي ومراجعي المملكة، مما يسهل عليك تقديم سجل الساعات وتجديد زمالاتك وعضوياتك المهنية بكل يسر وسهولة.",
  },
  {
    q: "هل يمكنني إلغاء الاختبارات المحجوزة أو تغيير الباقة؟",
    a: "بالتأكيد. تتيح لك لوحة التحكم مرونة كاملة؛ حيث يمكنك في أي وقت إلغاء حجز أي اختبار فردي أو باقة غير مدفوعة دون أي غرامات، واختيار اختبارات أخرى تناسب اهتماماتك المهنية الحالية.",
  },
];

const Landing = () => {
  // Calculator State
  const [calcHours, setCalcHours] = useState(30);

  // Interactive Bundle Customizer States
  const [bundleSize, setBundleSize] = useState(3);
  const [selectedTier, setSelectedTier] = useState<
    "SMALL" | "MEDIUM" | "LARGE"
  >("MEDIUM");

  // Tier Metrics
  const tierMetrics = TIER_METRICS;

  // Quiz State
  const [quizStep, setQuizStep] = useState(0); // 0, 1, 2 = questions, 3 = finished
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [userCertName, setUserCertName] = useState("");

  // UI States
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const handleOptionSelect = (index: number) => {
    if (quizAnswered) return;
    setSelectedOpt(index);
  };

  const handleQuizSubmit = () => {
    if (selectedOpt === null || quizAnswered) return;

    const correct = selectedOpt === sampleQuestions[quizStep].correctIndex;
    if (correct) {
      setCorrectAnswersCount((prev) => prev + 1);
    }
    setQuizAnswered(true);
  };

  const handleQuizNext = () => {
    setSelectedOpt(null);
    setQuizAnswered(false);
    setQuizStep((prev) => prev + 1);
  };

  const restartQuiz = () => {
    setQuizStep(0);
    setSelectedOpt(null);
    setQuizAnswered(false);
    setCorrectAnswersCount(0);
    setUserCertName("");
  };

  // Math for savings calculator
  const traditionalTime = calcHours * 1.5; // 1.5 hours of video/lecture per credit
  const khuttaTime = Math.round((calcHours * 15) / 60); // 15 mins per credit
  const traditionalCost = calcHours * 15; // Average $15/hour upfront
  const khuttaCost =
    calcHours <= 10
      ? calcHours * 12
      : calcHours <= 20
        ? 129
        : calcHours <= 40
          ? 199
          : 249; // Progressive bundle pricing

  const timeSaved = traditionalTime - khuttaTime;
  const moneySaved = traditionalCost - khuttaCost;

  return (
    <div className="min-h-screen bg-[#070b13] text-[#e0e6f2] font-body selection:bg-accent selection:text-accent-foreground overflow-x-hidden relative">
      {/* Radiant glow decorations */}
      <div className="absolute top-0 right-0 w-[40vw] h-[40vw] rounded-full bg-primary/10 blur-[150px] pointer-events-none" />
      <div className="absolute top-[30vh] left-0 w-[35vw] h-[35vw] rounded-full bg-secondary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20vh] right-10 w-[45vw] h-[45vw] rounded-full bg-accent/5 blur-[180px] pointer-events-none" />

      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-border/20 bg-[#070b13]/80 backdrop-blur-lg">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-primary/80 shadow-lg shadow-primary/20">
              <Award className="h-6 w-6 text-white animate-pulse" />
            </div>
            <div className="flex flex-col text-right">
              <span className="text-xl font-heading font-extrabold tracking-tight text-white">
                خطة CPE Pro
              </span>
              <span className="text-[10px] text-muted-foreground -mt-1 font-sans">
                التطوير المهني الذكي
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-8 font-sans">
            <a
              href="#how-it-works"
              className="text-sm font-medium text-muted-foreground hover:text-white transition-colors"
            >
              كيف نعمل
            </a>
            <a
              href="#calculator"
              className="text-sm font-medium text-muted-foreground hover:text-white transition-colors"
            >
              احسب وفرك
            </a>
            <a
              href="#sandbox"
              className="text-sm font-medium text-muted-foreground hover:text-white transition-colors"
            >
              جرب المنصة
            </a>
            <a
              href="#pricing"
              className="text-sm font-medium text-muted-foreground hover:text-white transition-colors"
            >
              الأسعار والباقات
            </a>
            <a
              href="#faqs"
              className="text-sm font-medium text-muted-foreground hover:text-white transition-colors"
            >
              الأسئلة الشائعة
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              asChild
              className="text-muted-foreground hover:text-white hover:bg-white/5 hidden sm:inline-flex"
            >
              <Link to="/login">تسجيل الدخول</Link>
            </Button>
            <Button
              asChild
              className="gradient-primary border-0 text-white hover:opacity-90 px-5 shadow-lg shadow-primary/20"
            >
              <Link to="/register" className="flex items-center gap-2">
                أنشئ حسابك مجاناً
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <button
              className="md:hidden p-2 text-muted-foreground hover:text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Menu"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="md:hidden border-b border-border/20 bg-[#070b13] px-6 py-6 space-y-4 absolute w-full left-0 shadow-2xl"
            >
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-base font-medium text-muted-foreground hover:text-white"
              >
                كيف نعمل
              </a>
              <a
                href="#calculator"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-base font-medium text-muted-foreground hover:text-white"
              >
                احسب وفرك
              </a>
              <a
                href="#sandbox"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-base font-medium text-muted-foreground hover:text-white"
              >
                جرب المنصة
              </a>
              <a
                href="#pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-base font-medium text-muted-foreground hover:text-white"
              >
                الأسعار والباقات
              </a>
              <a
                href="#faqs"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-base font-medium text-muted-foreground hover:text-white"
              >
                الأسئلة الشائعة
              </a>
              <div className="pt-4 border-t border-border/10 flex flex-col gap-3">
                <Button
                  asChild
                  className="w-full justify-center bg-white border-0 text-slate-900 hover:bg-white/90 transition-all font-heading font-semibold"
                >
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    تسجيل الدخول
                  </Link>
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-12 pb-12 md:pb-16 flex flex-col items-center">
        <div className="container px-6 mx-auto text-center relative z-10">
          {/* Saudi & GCC Badge */}
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs text-primary-foreground md:text-sm shadow-inner"
          >
            <Sparkles className="h-4 w-4 text-accent" />
            <span className="font-semibold text-white">
              التطوير المهني الأسرع والأسهل للمحاسبين والمدققين في الخليج
            </span>
          </motion.div>

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="mx-auto max-w-5xl text-4xl font-heading font-extrabold leading-tight text-white md:text-7xl"
          >
            اكسب ساعات الـ CPE بذكاء —{" "}
            <span className="text-gradient">بدون محاضرات فيديو مملة</span>
          </motion.h1>

          {/* Value proposition subtext */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mx-auto mt-8 max-w-3xl text-base md:text-xl text-[#a0aec0] leading-relaxed font-sans"
          >
            اختصر ساعات المشاهدة السلبية الطويلة. أثبت معرفتك وخبرتك الفعلية عبر
            تقييمات ذكية وتفاعلية مدتها 15 دقيقة فقط، واحصل على شهادات موثقة
            برمز QR ومطابقة للمعايير العالمية.
          </motion.p>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Button
              size="lg"
              asChild
              className="gradient-accent border-0 text-accent-foreground text-lg px-8 py-7 hover:opacity-90 shadow-xl shadow-accent/15 w-full sm:w-auto font-heading font-bold"
            >
              <Link to="/register">
                ابدأ التقييم المجاني الآن <ArrowLeft className="mr-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              asChild
              className="bg-white border-0 text-slate-900 hover:bg-white/90 text-lg px-8 py-7 w-full sm:w-auto font-heading font-semibold shadow-lg transition-all"
            >
              <a href="#sandbox">جرّب أسئلة تجريبية</a>
            </Button>
          </motion.div>

          {/* Compliance & Trust Badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-16 flex flex-col items-center gap-4"
          >
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-sans">
              شهادات متوافقة بالكامل مع متطلبات
            </span>
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 bg-white/5 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10 max-w-4xl">
              {["CPA / SOCPA", "CIA", "CMA", "CFE", "CISA"].map((cert) => (
                <div
                  key={cert}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-[#0e1626] border border-white/5 shadow-inner"
                >
                  <CheckCircle className="h-4 w-4 text-secondary" />
                  <span className="text-sm font-bold text-white/90">
                    {cert}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it works - Interactive Timeline */}
      <section id="how-it-works" className="pt-12 pb-20 relative">
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl font-heading font-extrabold text-white md:text-5xl">
              كيف تعمل المنصة؟
            </h2>
            <p className="mt-4 text-muted-foreground font-sans">
              سلسلة النجاح والاعتماد المبسطة لتجديد ساعاتك المهنية بدون تضييع
              وقتك
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-4 relative">
            {/* Step Line for Desktop */}
            <div className="hidden md:block absolute top-12 left-12 right-12 h-0.5 bg-gradient-to-r from-primary via-secondary to-accent opacity-30 z-0 pointer-events-none" />

            {[
              {
                step: "١",
                icon: BookOpen,
                title: "حل التقييم مجاناً 📝",
                desc: "أنشئ حسابك، واختر المعيار المناسب لتخصصك، وابدأ بحل الأسئلة فوراً بدون دفع مسبق.",
              },
              {
                step: "٢",
                icon: Trophy,
                title: "الاجتياز والنجاح 🏆",
                desc: "أثبت معرفتك وحقق نسبة 70% أو أكثر لتصبح الشهادة جاهزة. إعادة الاختبار مجانية وغير محدودة.",
              },
              {
                step: "٣",
                icon: Shield,
                title: "سداد رسوم التفعيل 💳",
                desc: "ادفع رسوم الاعتماد وإصدار الشهادة بعد أن تضمن نجاحك واجتيازك الفعلي. صفر مخاطر مالية.",
              },
              {
                step: "٤",
                icon: Award,
                title: "إصدار الشهادة بحسابك 📂",
                desc: "تُصدر الشهادة فوراً وتُRelease في لوحة تحكمك للتحميل المباشر والتقديم للجهات المهنية.",
              },
            ].map((item, i) => (
              <div
                key={item.step}
                className="relative bg-[#0d1321]/60 backdrop-blur-md rounded-2xl border border-white/5 p-8 text-center card-hover z-10 flex flex-col items-center"
              >
                <div className="absolute -top-5 flex h-10 w-10 items-center justify-center rounded-full bg-[#121c33] border border-white/10 text-accent font-heading font-bold shadow-lg">
                  {item.step}
                </div>
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-inner group-hover:scale-110 transition-transform">
                  <item.icon className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-heading font-bold text-white mb-3">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed font-sans">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Savings Calculator */}
      <section id="calculator" className="py-20 relative bg-[#090e1a]">
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid gap-12 lg:grid-cols-5 items-center">
            {/* Left text */}
            <div className="lg:col-span-2 text-right space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-secondary/15 text-secondary text-xs font-semibold">
                <Calculator className="h-3.5 w-3.5" />
                <span>حاسبة الوقت والتكاليف</span>
              </div>
              <h2 className="text-3xl font-heading font-extrabold text-white md:text-5xl">
                كم من الوقت والمال ستوفر مع خطة؟
              </h2>
              <p className="text-muted-foreground font-sans leading-relaxed font-light text-sm md:text-base">
                استخدم شريط السحب لتحديد عدد ساعات التطوير المهني المستمر (CPE)
                المطلوبة منك هذا العام، وشاهد بنفسك الفرق الهائل في الوقت
                والتكلفة مقارنة بالتعليم التقليدي القائم على المشاهدة السلبية.
              </p>

              <div className="bg-[#121a2e]/50 border border-white/5 rounded-xl p-5 space-y-4 font-sans">
                <div className="flex justify-between items-center text-sm md:text-base">
                  <span className="text-muted-foreground text-sm">
                    الوقت الموفر:
                  </span>
                  <span className="text-secondary font-bold text-lg">
                    {timeSaved} ساعة مشاهدة
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm md:text-base">
                  <span className="text-muted-foreground text-sm">
                    المال الموفر:
                  </span>
                  <span className="text-accent font-bold text-lg">
                    ~ ${moneySaved} دولار
                  </span>
                </div>
              </div>
            </div>

            {/* Right Widget */}
            <div className="lg:col-span-3 bg-[#0d1322] border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

              {/* Slider header */}
              <div className="flex justify-between items-center mb-8">
                <span className="text-sm font-semibold text-muted-foreground">
                  الساعات المطلوبة منك:
                </span>
                <span className="text-2xl md:text-3xl font-heading font-extrabold text-accent">
                  {calcHours} ساعة CPE
                </span>
              </div>

              {/* Native range slider styled */}
              <div className="space-y-4">
                <input
                  type="range"
                  min="10"
                  max="80"
                  step="5"
                  value={calcHours}
                  onChange={(e) => setCalcHours(Number(e.target.value))}
                  className="w-full accent-accent h-2 bg-white/10 rounded-lg cursor-pointer transition-all"
                />
                <div className="flex justify-between text-xs text-muted-foreground font-sans px-1">
                  <span>10 ساعات</span>
                  <span>40 ساعة (المتوسط السنوي)</span>
                  <span>80 ساعة</span>
                </div>
              </div>

              {/* Comparison Cards */}
              <div className="grid gap-6 sm:grid-cols-2 mt-10">
                {/* Traditional */}
                <div className="rounded-xl border border-white/5 bg-[#121827] p-5 space-y-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <span className="font-heading font-bold text-muted-foreground">
                      الدورات التقليدية
                    </span>
                    <X className="h-5 w-5 text-destructive" />
                  </div>
                  <div className="space-y-3 font-sans">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        الوقت المطلوب:
                      </span>
                      <span className="text-white font-semibold">
                        {traditionalTime} ساعة مشاهدة
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        طريقة التعلم:
                      </span>
                      <span className="text-white font-semibold">
                        فيديوهات مملة ومستمرة
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        التكلفة المالية:
                      </span>
                      <span className="text-white font-semibold">
                        ${traditionalCost} دولار
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        طريقة الدفع:
                      </span>
                      <span className="text-destructive font-semibold">
                        مسبقاً (بلا ضمان للنجاح)
                      </span>
                    </div>
                  </div>
                </div>

                {/* CPE Pro */}
                <div className="rounded-xl border-2 border-secondary bg-[#102223] p-5 space-y-4 shadow-lg shadow-secondary/5 relative overflow-hidden">
                  <div className="absolute -top-3 -left-12 bg-secondary text-[#0a1816] text-[10px] font-bold py-1 px-12 rotate-[-35deg] font-sans">
                    الأسرع والأوفر
                  </div>

                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <span className="font-heading font-bold text-secondary">
                      منصة خطة (CPE Pro)
                    </span>
                    <Check className="h-5 w-5 text-secondary" />
                  </div>
                  <div className="space-y-3 font-sans">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        الوقت المطلوب:
                      </span>
                      <span className="text-secondary font-bold">
                        {khuttaTime} ساعة تقييم فعلي
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#c3cfd9] font-medium">
                        طريقة التعلم:
                      </span>
                      <span className="text-white font-semibold">
                        تقييم سريع يقيس خبرتك
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        التكلفة المالية:
                      </span>
                      <span className="text-accent font-bold">
                        ${khuttaCost} دولار
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        طريقة الدفع:
                      </span>
                      <span className="text-secondary font-bold">
                        عند الاجتياز فقط
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Try it First - Interactive Sandbox Quiz */}
      <section id="sandbox" className="py-24 relative">
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-accent/15 text-accent text-xs font-semibold mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              <span>تقييم تجريبي مباشر وسريع</span>
            </div>
            <h2 className="text-3xl font-heading font-extrabold text-white md:text-5xl">
              جرّب المنصة بنفسك الآن!
            </h2>
            <p className="mt-4 text-muted-foreground font-sans">
              أجب عن ٣ أسئلة مهنية سريعة لمحاكاة التجربة والحصول على شهادة
              افتراضية فورية باسمك تثبت حفظ ساعاتك التجريبية
            </p>
          </div>

          <div className="max-w-3xl mx-auto bg-[#0d1322] border border-white/10 rounded-2xl p-6 md:p-10 shadow-2xl relative min-h-[400px]">
            <AnimatePresence mode="wait">
              {quizStep < sampleQuestions.length ? (
                // Question Mode
                <motion.div
                  key={`question-${quizStep}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6 text-right"
                >
                  {/* Step counter */}
                  <div className="flex justify-between items-center text-xs md:text-sm font-sans border-b border-white/5 pb-4">
                    <span className="text-muted-foreground">
                      الشهادة:{" "}
                      <strong className="text-white">
                        زمالة التدقيق الداخلي والرقابة
                      </strong>
                    </span>
                    <span className="text-accent font-semibold">
                      السؤال {quizStep + 1} من {sampleQuestions.length}
                    </span>
                  </div>

                  {/* Question Title */}
                  <h3 className="text-lg md:text-xl font-heading font-bold text-white leading-relaxed">
                    {sampleQuestions[quizStep].question}
                  </h3>

                  {/* Options List */}
                  <div className="grid gap-3 pt-2">
                    {sampleQuestions[quizStep].options.map((opt, idx) => {
                      let btnStyle =
                        "border-white/5 bg-[#121927] hover:border-white/20 text-white/95";
                      if (selectedOpt === idx) {
                        btnStyle =
                          "border-primary bg-primary/10 text-primary-foreground";
                      }

                      if (quizAnswered) {
                        if (idx === sampleQuestions[quizStep].correctIndex) {
                          btnStyle =
                            "border-secondary bg-secondary/10 text-secondary-foreground font-semibold";
                        } else if (selectedOpt === idx) {
                          btnStyle =
                            "border-destructive bg-destructive/10 text-destructive-foreground";
                        } else {
                          btnStyle =
                            "border-white/5 bg-[#121927]/40 text-muted-foreground opacity-55";
                        }
                      }

                      return (
                        <button
                          key={idx}
                          disabled={quizAnswered}
                          onClick={() => handleOptionSelect(idx)}
                          className={`w-full text-right p-4 rounded-xl border text-sm md:text-base transition-all duration-200 hover:bg-[#121927]/60 ${btnStyle}`}
                        >
                          <span className="block leading-relaxed font-sans">
                            {opt}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Submit / Next Actions */}
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-white/5">
                    {quizAnswered ? (
                      <p className="text-xs md:text-sm text-[#b1bcf0] font-sans flex-1 text-right max-w-lg leading-relaxed">
                        💡 <strong>توضيح: </strong>
                        {sampleQuestions[quizStep].explanation}
                      </p>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <HelpCircle className="h-4 w-4 text-[#75849e]" />
                        <span>
                          يرجى اختيار الإجابة المناسبة ثم الضغط على تأكيد
                        </span>
                      </div>
                    )}

                    <div className="w-full sm:w-auto shrink-0 flex justify-end">
                      {!quizAnswered ? (
                        <Button
                          onClick={handleQuizSubmit}
                          disabled={selectedOpt === null}
                          className="gradient-primary text-white font-heading font-bold px-8 py-5 w-full sm:w-auto"
                        >
                          تأكيد الإجابة
                        </Button>
                      ) : (
                        <Button
                          onClick={handleQuizNext}
                          className="gradient-secondary text-white font-heading font-bold px-8 py-5 w-full sm:w-auto flex items-center gap-2"
                        >
                          {quizStep === sampleQuestions.length - 1
                            ? "رؤية النتيجة"
                            : "السؤال التالي"}
                          <ArrowLeft className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ) : (
                // Certificate Mock Outcome
                <motion.div
                  key="quiz-result"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-8 text-center flex flex-col items-center"
                >
                  <div className="h-16 w-16 bg-secondary/15 rounded-full flex items-center justify-center text-secondary border border-secondary/30 mb-2 animate-bounce">
                    <CheckCircle className="h-9 w-9" />
                  </div>

                  <div>
                    <h3 className="text-2xl font-heading font-extrabold text-white">
                      لقد اجتزت التقييم بنجاح!
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2 font-sans">
                      أجبت على {correctAnswersCount} من أصل{" "}
                      {sampleQuestions.length} أسئلة بشكل صحيح. لقد أثبتّ
                      استحقاقك لـ <strong>0.75 ساعة CPE</strong>.
                    </p>
                  </div>

                  {/* Input to put custom name on cert */}
                  <div className="w-full max-w-sm space-y-2">
                    <label className="text-xs text-muted-foreground block text-right font-sans">
                      اكتب اسمك لرؤية شهادتك المهنية الافتراضية:
                    </label>
                    <input
                      type="text"
                      value={userCertName}
                      onChange={(e) => setUserCertName(e.target.value)}
                      placeholder="أحمد بن عبدالله الشمري"
                      className="w-full bg-[#121927] border border-white/10 rounded-xl px-4 py-3 text-white text-center focus:outline-none focus:ring-1 focus:ring-secondary font-sans"
                    />
                  </div>

                  {/* Realistic certificate box */}
                  <div className="w-full border-4 border-dashed border-white/10 rounded-2xl bg-[#090e1a] p-6 relative shadow-inner overflow-hidden max-w-lg">
                    {/* Glowing watermarks */}
                    <div className="absolute inset-0 opacity-[0.02] flex items-center justify-center select-none pointer-events-none">
                      <Award className="h-60 w-60" />
                    </div>

                    <div className="border border-white/5 rounded-lg p-5 text-center relative z-10 space-y-4">
                      <div className="flex justify-between items-start">
                        <Award className="h-10 w-10 text-accent" />
                        <div className="text-right">
                          <span className="text-[10px] text-muted-foreground block font-sans">
                            الرقم المرجعي: TEST-SAMPLE-2026
                          </span>
                          <span className="text-[9px] text-[#22c55e] font-sans flex items-center gap-1">
                            <Shield className="h-3 w-3" /> تم التحقق • QR Active
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-sm uppercase tracking-wider text-muted-foreground font-sans">
                          شهادة حضور وتطوير مهني مستمر
                        </h4>
                        <p className="text-xs text-muted-foreground font-sans">
                          تُمنح هذه الشهادة رسمياً لـ
                        </p>
                      </div>

                      <h5 className="text-lg md:text-xl font-heading font-extrabold text-accent min-h-[28px] border-b border-white/5 pb-2 max-w-[320px] mx-auto">
                        {userCertName || "أحمد بن عبدالله الشمري"}
                      </h5>

                      <p className="text-xs leading-relaxed text-muted-foreground font-sans max-w-sm mx-auto">
                        لاجتيازه بنجاح التقييم المهني التفاعلي الخاص بـ{" "}
                        <strong>
                          أساسيات الرقابة والحوكمة وتكلفة الفرصة البديلة
                        </strong>{" "}
                        ومعايير المراجعة المعترف بها.
                      </p>

                      <div className="flex justify-between items-end pt-4 border-t border-white/5 text-xs text-muted-foreground font-sans">
                        <div className="text-right">
                          <span>الجهة المصدرة:</span>
                          <span className="block text-white font-semibold">
                            خطة CPE Pro
                          </span>
                        </div>
                        <div className="text-center bg-[#102223] px-3 py-1 rounded border border-secondary/20">
                          <span className="text-secondary font-bold">
                            0.75 ساعة CPE معتمدة
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
                    <Button
                      asChild
                      className="gradient-primary border-0 text-white font-heading font-bold px-8 py-5 shadow-lg shadow-primary/20"
                    >
                      <Link to="/register">سجل مجاناً لاعتماد ساعاتك الآن</Link>
                    </Button>
                    <Button
                      onClick={restartQuiz}
                      className="bg-white border-0 text-slate-900 hover:bg-white/90 transition-all font-heading font-semibold"
                    >
                      إعادة التقييم
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Certification Tracks Grid */}
      <section className="py-20 bg-[#090e1a]">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-heading font-extrabold text-white md:text-5xl">
              تغطية شاملة لكافة الشهادات المهنية
            </h2>
            <p className="mt-4 text-muted-foreground font-sans">
              اختر مسارك المهني والتقييمات المتوافقة مع أحدث النماذج والمعايير
              المطلوبة عالمياً ومحلياً
            </p>

            {/* Filter Tabs */}
            <div className="flex flex-wrap justify-center gap-2 mt-8">
              {[
                { id: "all", label: "جميع الشهادات" },
                { id: "cia", label: "CIA - التدقيق الداخلي" },
                { id: "cpa", label: "CPA / SOCPA - المحاسبة القانونية" },
                { id: "cisa", label: "CISA - تدقيق النظم" },
                { id: "cfe", label: "CFE - مكافحة الاحتيال" },
                { id: "cma", label: "CMA - المحاسبة الإدارية" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-heading font-semibold transition-all duration-200 ${
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                      : "bg-[#0d1322] border border-white/5 text-muted-foreground hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                id: "cia",
                title: "CIA - معايير التدقيق الداخلي",
                desc: "يحتوي على أكثر من 120 سؤالاً تخصصياً تغطي مواضيع الحوكمة، إدارة المخاطر، أدوات الرقابة الداخلية، وإجراءات التقييم المالي والتشغيلي وفقاً لأحدث إصدارات المعهد العالمي IIA.",
                hours: "٢٠ ساعة متاحة",
                tests: "+١٢٠ سؤالاً متفرعاً",
                passing: "٧٠% درجة اجتياز",
                difficulty: "متوسط",
              },
              {
                id: "cpa",
                title: "CPA / SOCPA - المحاسبة القانونية والمراجعة",
                desc: "يحتوي على ما يزيد عن 150 سؤالاً تغطي معايير المحاسبة الدولية (IFRS)، التدقيق الخارجي والضمان، القوانين والأنظمة المالية، والزكاة والضرائب لزمالة SOCPA و CPA.",
                hours: "١٥ ساعة متاحة",
                tests: "+١٥٠ سؤالاً متفرعاً",
                passing: "٨٠% درجة اجتياز",
                difficulty: "صعب",
              },
              {
                id: "cisa",
                title: "CISA - أمن وتدقيق نظم المعلومات",
                desc: "يتضمن أكثر من 110 أسئلة تغطي المجالات الخمسة الكبرى لتدقيق النظم: حوكمة تقنية المعلومات، حماية الأصول المعرفية، تطوير وصيانة الأنظمة، وعمليات تشغيل وإدارة البنية التحتية.",
                hours: "١٢ ساعة متاحة",
                tests: "+١١٠ أسئلة متفرعة",
                passing: "٧٠% درجة اجتياز",
                difficulty: "صعب",
              },
              {
                id: "cfe",
                title: "CFE - مكافحة الاحتيال المالي والتحقيق",
                desc: "يضم أكثر من 130 سؤالاً شاملاً يغطي مجالات مكافحة الاحتيال الأربعة: المعاملات المالية والمخططات الاحتيالية، التحقيقات، القانون، ومنع الاحتيال وردعه.",
                hours: "١٠ ساعات متاحة",
                tests: "+١٣٠ سؤالاً متفرعاً",
                passing: "٧٠% درجة اجتياز",
                difficulty: "متوسط",
              },
              {
                id: "cma",
                title: "CMA - المحاسبة الإدارية والتحليل المالي",
                desc: "يحتوي على أكثر من 140 سؤالاً تغطي التخطيط المالي، قياس الأداء والرقابة، إدارة التكاليف، التحليل المالي، والقرارات الاستثمارية الاستراتيجية ومعايير IMA المحاسبية.",
                hours: "١٨ ساعة متاحة",
                tests: "+١٤٠ سؤالاً متفرعاً",
                passing: "٧٥% درجة اجتياز",
                difficulty: "صعب",
              },
            ]
              .filter((track) => activeTab === "all" || track.id === activeTab)
              .map((track, i) => (
                <div
                  key={i}
                  className="bg-[#0d1322] border border-white/5 rounded-2xl p-6 card-hover relative flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span
                        className={`text-[10px] px-2 py-1 rounded font-semibold ${
                          track.difficulty === "سهل"
                            ? "bg-[#22c55e]/15 text-[#22c55e]"
                            : track.difficulty === "متوسط"
                              ? "bg-accent/15 text-accent"
                              : "bg-destructive/15 text-destructive"
                        } font-sans`}
                      >
                        {track.difficulty}
                      </span>
                      <span className="text-xs text-muted-foreground font-sans">
                        {track.hours}
                      </span>
                    </div>
                    <h3 className="text-lg font-heading font-bold text-white">
                      {track.title}
                    </h3>
                    <p className="text-sm text-[#8c9cb8] leading-relaxed font-sans">
                      {track.desc}
                    </p>
                  </div>

                  <div className="flex justify-between items-center pt-5 mt-5 border-t border-white/5 text-xs text-muted-foreground font-sans">
                    <span>{track.tests}</span>
                    <span>{track.passing}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* Comparison Grid */}
      <section className="py-20 relative">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-heading font-extrabold text-white md:text-5xl">
              لماذا نحن بديلك الأفضل؟
            </h2>
            <p className="mt-4 text-muted-foreground font-sans">
              مقارنة سريعة توضح الفارق المهني والعملي بين منصتنا والطرق
              التعليمية التقليدية
            </p>
          </div>

          <div className="max-w-4xl mx-auto overflow-hidden rounded-2xl border border-white/10 bg-[#0d1322]/80 backdrop-blur-md shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-[#121c32] text-white border-b border-white/10">
                    <th className="p-5 font-heading font-bold text-base">
                      الميزة / المعيار
                    </th>
                    <th className="p-5 text-center font-heading font-bold text-base">
                      الدورات والفيديوهات التقليدية
                    </th>
                    <th className="p-5 text-center font-heading font-bold text-base text-accent">
                      منصة خطة CPE Pro ⭐
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    [
                      "الوقت المستغرق للحصول على الساعات",
                      "تستهلك ساعات طويلة توازي الساعات المطلوبة كاملة.",
                      "١٥ دقيقة فقط لكل اختبار ساعة معتمدة.",
                    ],
                    [
                      "أسلوب الدراسة والتحقق",
                      "حضور سلبي للفيديوهات (غالباً يترك الفيديو يعمل بالخلفية).",
                      "تقييم تفاعلي حقيقي يقيس خبرتك ويرسخ معرفتك.",
                    ],
                    [
                      "المصداقية ومكافحة الاحتيال",
                      "منخفضة جداً؛ يمكن لأي شخص تصفح الفيديوهات وتجاوزها.",
                      "عالية؛ كود QR، رقم تسلسلي، تقرير تدقيق (Audit Trail) كامل بالدرجات.",
                    ],
                    [
                      "آلية ومرونة الدفع",
                      "دفع مسبق إجباري لرسوم الدورة بالكامل، حتى وإن لم تكملها.",
                      "دفع لاحق بعد النجاح فقط (Pay-on-Pass). صفر مخاطر مالية.",
                    ],
                    [
                      "سهولة الاعتماد والتحميل",
                      "تحتاج لمراسلة الدعم والانتظار لأيام لإصدار وثيقة إتمام.",
                      "إصدار وتنزيل مباشر للشهادة PDF بنقرة واحدة بعد الدفع.",
                    ],
                  ].map(([feat, trad, ours], i) => (
                    <tr
                      key={i}
                      className={`border-b border-white/5 font-sans ${i % 2 === 0 ? "bg-white/[0.01]" : "bg-card/20"}`}
                    >
                      <td className="p-5 text-white font-medium text-sm md:text-base leading-relaxed">
                        {feat}
                      </td>
                      <td className="p-5 text-center text-[#7e8ca4] text-xs md:text-sm leading-relaxed">
                        {trad}
                      </td>
                      <td className="p-5 text-center text-secondary font-bold text-xs md:text-sm leading-relaxed bg-secondary/5">
                        {ours}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing and Packages Section */}
      <section id="pricing" className="py-24 bg-[#090e1a] relative">
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-accent/15 text-accent text-xs font-semibold mb-4">
              <Shield className="h-3.5 w-3.5" />
              <span>تسعير ديناميكي شفاف وعادل</span>
            </div>
            <h2 className="text-3xl font-heading font-extrabold text-white md:text-5xl">
              باقات مرنة ومخصصة لاحتياجاتك
            </h2>
            <p className="mt-4 text-muted-foreground font-sans">
              ادرس واجتز التقييمات مجاناً. ادفع فقط للاعتماد الفوري وإصدار
              الشهادات لأي من الشهادات الخمس المعتمدة.
            </p>
          </div>

          {/* Pricing cards based on tierMetrics */}
          <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto items-stretch mb-16">
            {/* Tier SMALL */}
            <div className="bg-[#0d1322] border border-white/5 rounded-3xl p-8 flex flex-col justify-between card-hover relative overflow-hidden">
              <div className="space-y-6">
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-accent font-sans">
                    الفئة البرونزية
                  </span>
                  <h3 className="text-xl font-heading font-bold text-white">
                    التقييم الفردي البسيط (Small Tier)
                  </h3>
                  <p className="text-xs text-muted-foreground font-sans">
                    مثالي لاجتياز اختبار معيار محدد وتغطية ساعات تكميلية سريعة.
                  </p>
                </div>

                <div className="flex items-baseline gap-1 border-y border-white/5 py-4 font-heading">
                  <span className="text-4xl font-extrabold text-white">
                    ${tierMetrics.SMALL.price}
                  </span>
                  <span className="text-sm text-muted-foreground mr-1">
                    / للاختبار الواحد
                  </span>
                </div>

                <ul className="space-y-3.5 text-sm text-[#9ab0cd] font-sans">
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-secondary shrink-0" />
                    <span>
                      تمنح <strong>{tierMetrics.SMALL.hours} ساعات CPE</strong>{" "}
                      معتمدة
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-secondary shrink-0" />
                    <span>
                      تقييم تفاعلي مدته {tierMetrics.SMALL.duration} دقائق
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-secondary shrink-0" />
                    <span>
                      يحتوي على {tierMetrics.SMALL.questionCount} أسئلة مهنية
                      قوية
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-secondary shrink-0" />
                    <span>تصلح لأي شهادة: CIA, CPA, CISA, CFE, CMA</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Tier MEDIUM - Popular */}
            <div className="bg-[#0f1b2d] border-2 border-primary rounded-3xl p-8 flex flex-col justify-between card-hover relative shadow-xl shadow-primary/10">
              <div className="absolute top-4 left-4 bg-primary text-primary-foreground text-[10px] font-bold py-1 px-3 rounded-full font-sans tracking-wide">
                الأكثر طلباً
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-secondary font-sans">
                    الفئة الفضية
                  </span>
                  <h3 className="text-xl font-heading font-bold text-white">
                    التقييم المتوسط الشامل (Medium Tier)
                  </h3>
                  <p className="text-xs text-[#a0afc8] font-sans">
                    الباقة السنوية الأفضل لتغطية أغلب متطلبات جهات الترخيص.
                  </p>
                </div>

                <div className="flex items-baseline gap-1 border-y border-white/5 py-4 font-heading">
                  <span className="text-4xl font-extrabold text-white">
                    ${tierMetrics.MEDIUM.price}
                  </span>
                  <span className="text-sm text-muted-foreground mr-1">
                    / للاختبار الواحد
                  </span>
                </div>

                <ul className="space-y-3.5 text-sm text-[#aabccf] font-sans">
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-secondary shrink-0" />
                    <span>
                      تمنح <strong>{tierMetrics.MEDIUM.hours} ساعات CPE</strong>{" "}
                      معتمدة
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-secondary shrink-0" />
                    <span>
                      تقييم تفاعلي مدته {tierMetrics.MEDIUM.duration} دقيقة
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-secondary shrink-0" />
                    <span>
                      يحتوي على {tierMetrics.MEDIUM.questionCount} سؤالاً
                      تخصصياً
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-secondary shrink-0" />
                    <span>تصلح لأي شهادة: CIA, CPA, CISA, CFE, CMA</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Tier LARGE */}
            <div className="bg-[#0d1322] border border-white/5 rounded-3xl p-8 flex flex-col justify-between card-hover relative overflow-hidden">
              <div className="space-y-6">
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-accent font-sans">
                    الفئة الذهبية
                  </span>
                  <h3 className="text-xl font-heading font-bold text-white">
                    التقييم الشامل المتقدم (Large Tier)
                  </h3>
                  <p className="text-xs text-muted-foreground font-sans">
                    للمواضيع المعقدة التي تغطي مجالات متكاملة وتمنح رصيد ساعات
                    كبير.
                  </p>
                </div>

                <div className="flex items-baseline gap-1 border-y border-white/5 py-4 font-heading">
                  <span className="text-4xl font-extrabold text-white">
                    ${tierMetrics.LARGE.price}
                  </span>
                  <span className="text-sm text-muted-foreground mr-1">
                    / للاختبار الواحد
                  </span>
                </div>

                <ul className="space-y-3.5 text-sm text-[#9ab0cd] font-sans">
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-secondary shrink-0" />
                    <span>
                      تمنح <strong>{tierMetrics.LARGE.hours} ساعات CPE</strong>{" "}
                      معتمدة
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-secondary shrink-0" />
                    <span>
                      تقييم تفاعلي مدته {tierMetrics.LARGE.duration} دقيقة
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-secondary shrink-0" />
                    <span>
                      يحتوي على {tierMetrics.LARGE.questionCount} سؤالاً متقدماً
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-secondary shrink-0" />
                    <span>تصلح لأي شهادة: CIA, CPA, CISA, CFE, CMA</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Interactive Custom Bundle Builder Widget */}
          <div className="max-w-6xl mx-auto bg-[#0d1322]/80 backdrop-blur-md rounded-3xl border border-white/10 p-6 md:p-10 shadow-2xl relative mb-16 overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />

            <div className="grid gap-8 lg:grid-cols-12 items-center">
              {/* Calculator settings */}
              <div className="lg:col-span-7 space-y-6 text-right">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-secondary/15 text-secondary text-xs font-semibold">
                  <Calculator className="h-3.5 w-3.5" />
                  <span>أداة تصميم وتفصيل الباقة الذكية</span>
                </div>
                <h3 className="text-2xl font-heading font-extrabold text-white md:text-3xl">
                  صمم باقتك الخاصة ووفر ما يصل إلى ٢٠% فوراً!
                </h3>
                <p className="text-sm text-muted-foreground font-sans leading-relaxed">
                  يمكنك تخصيص وتجميع أي تشكيلة من الاختبارات التي تريدها عبر
                  جميع التخصصات (مثال: اختبارين من CIA واختبار من CISA). كلما
                  زاد عدد اختباراتك في الباقة، زادت نسبة الخصم تلقائياً وبأمان
                  كامل.
                </p>

                {/* Tier Selector Buttons */}
                <div className="space-y-3">
                  <span className="text-xs text-muted-foreground block font-sans">
                    اختر فئة التقييمات للباقة:
                  </span>
                  <div className="flex gap-2">
                    {[
                      {
                        id: "SMALL",
                        label: "البرونزية (2.0 ساعة)",
                        price: tierMetrics.SMALL.price,
                      },
                      {
                        id: "MEDIUM",
                        label: "الفضية (4.0 ساعة)",
                        price: tierMetrics.MEDIUM.price,
                      },
                      {
                        id: "LARGE",
                        label: "الذهبية (6.0 ساعة)",
                        price: tierMetrics.LARGE.price,
                      },
                    ].map((tier) => (
                      <button
                        key={tier.id}
                        onClick={() => setSelectedTier(tier.id as any)}
                        className={`flex-1 py-3 px-4 rounded-xl text-xs md:text-sm font-heading font-semibold transition-all duration-200 border ${
                          selectedTier === tier.id
                            ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/10"
                            : "bg-[#090e1a] border-white/5 text-muted-foreground hover:text-white"
                        }`}
                      >
                        {tier.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bundle Size Counter */}
                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground font-sans">
                      عدد الاختبارات في باقتك المخصصة:
                    </span>
                    <span className="text-sm font-bold text-accent font-sans">
                      {bundleSize} اختبارات
                    </span>
                  </div>
                  <div className="flex items-center gap-4 bg-[#090e1a] p-2 rounded-2xl border border-white/5 max-w-xs">
                    <button
                      onClick={() =>
                        setBundleSize((prev) => Math.max(1, prev - 1))
                      }
                      className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition-colors"
                    >
                      -
                    </button>
                    <span className="flex-1 text-center font-heading font-extrabold text-white text-lg">
                      {bundleSize}
                    </span>
                    <button
                      onClick={() =>
                        setBundleSize((prev) => Math.min(10, prev + 1))
                      }
                      className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Dynamic calculations display */}
              <div className="lg:col-span-5 bg-[#090e1a]/90 border border-white/10 rounded-2xl p-6 md:p-8 flex flex-col justify-between space-y-6 relative">
                <div className="absolute top-0 right-0 w-20 h-20 bg-secondary/10 rounded-full blur-xl pointer-events-none" />

                <div className="space-y-4 font-sans text-right">
                  <h4 className="font-heading font-bold text-white text-lg border-b border-white/5 pb-3">
                    ملخص باقتك المفصلة:
                  </h4>

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      عدد الساعات الإجمالي:
                    </span>
                    <span className="text-white font-bold">
                      {tierMetrics[selectedTier].hours * bundleSize} ساعة CPE
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">السعر الأصلي:</span>
                    <span className="text-white font-semibold line-through">
                      ${tierMetrics[selectedTier].price * bundleSize} دولار
                    </span>
                  </div>

                  <div className="flex justify-between text-sm items-center">
                    <span className="text-muted-foreground">
                      خصم الباقة المطبق:
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-bold ${
                        bundleSize >= 3
                          ? "bg-[#22c55e]/15 text-[#22c55e]"
                          : bundleSize === 2
                            ? "bg-accent/15 text-accent"
                            : "bg-white/5 text-muted-foreground"
                      }`}
                    >
                      {bundleSize >= 3
                        ? "20% خصم باقة المجموعات"
                        : bundleSize === 2
                          ? "10% خصم التجميع"
                          : "0% (أضف اختبارات لتفعيل الخصم)"}
                    </span>
                  </div>

                  {bundleSize >= 2 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#22c55e] font-semibold">
                        مجموع وفرك الفعلي:
                      </span>
                      <span className="text-[#22c55e] font-bold">
                        -$
                        {tierMetrics[selectedTier].price * bundleSize -
                          Math.round(
                            tierMetrics[selectedTier].price *
                              bundleSize *
                              (1 - (bundleSize >= 3 ? 20 : 10) / 100),
                          )}{" "}
                        دولار
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-end border-t border-white/5 pt-4">
                    <span className="text-muted-foreground text-sm">
                      الإجمالي النهائي المستحق:
                    </span>
                    <div className="text-right">
                      <span className="text-3xl font-heading font-extrabold text-secondary">
                        $
                        {Math.round(
                          tierMetrics[selectedTier].price *
                            bundleSize *
                            (1 -
                              (bundleSize >= 3
                                ? 20
                                : bundleSize === 2
                                  ? 10
                                  : 0) /
                                100),
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground block mt-1">
                        (الدفع فقط بعد ضمان النجاح)
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  asChild
                  className="w-full py-6 gradient-primary text-white font-heading font-bold shadow-lg shadow-primary/20"
                >
                  <Link to="/register">احجز هذه الباقة وابدأ الحل مجاناً</Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Certificate Date Customization Showcase */}
          <div className="max-w-6xl mx-auto bg-gradient-to-r from-[#0d1322] to-[#0e1b2d] border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-8 shadow-xl">
            <div className="flex-1 space-y-4 text-right">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-accent/15 text-accent text-xs font-semibold">
                <Clock className="h-3.5 w-3.5" />
                <span>مرونة المزامنة المتقدمة</span>
              </div>
              <h3 className="text-2xl font-heading font-extrabold text-white md:text-3xl">
                تحكم كامل في تواريخ شهاداتك المهنية 📅
              </h3>
              <p className="text-sm text-muted-foreground font-sans leading-relaxed">
                نحن نتفهم تماماً متطلبات التقديم السنوية ومواعيد موازنة الساعات.
                لهذا السبب، تتيح لك لوحة التحكم **إدخال تاريخ بدء وتاريخ انتهاء
                مخصصين للدورة التدريبية** قبل توليد الشهادة وإصدارها. هذا يضمن
                توافق شهادتك بنسبة 100% مع نافذة ترخيص الهيئة السعودية للمراجعين
                والمحاسبين (SOCPA) أو معايير المراجعة الداخلية لجهة عملك.
              </p>
            </div>

            {/* Visual date inputs mockup card */}
            <div className="w-full md:w-80 shrink-0 bg-[#070b13] border border-white/10 rounded-2xl p-5 space-y-4 font-sans text-right relative shadow-inner">
              <div className="absolute top-2 left-2 bg-[#22c55e]/15 border border-[#22c55e]/30 px-2 py-0.5 rounded text-[8px] text-[#22c55e] font-bold">
                نشط • جاهز للتعديل
              </div>
              <span className="text-[10px] text-muted-foreground uppercase block font-sans">
                خصائص الشهادة الإضافية:
              </span>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground block">
                    تاريخ بدء التدريب والتجهيز:
                  </label>
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>01 / 01 / 2026</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground block">
                    تاريخ إتمام التقييم والاعتماد:
                  </label>
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>15 / 01 / 2026</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-[#ffffff]/5 pt-3 flex justify-between items-center text-[10px] text-[#94a3b8]">
                <span>تطابق نافذة SOCPA:</span>
                <span className="text-[#22c55e] font-bold">متطابق وآمن ✓</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Accordion FAQ Section */}
      <section id="faqs" className="py-24 relative bg-[#090e1a]">
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl font-heading font-extrabold text-white md:text-5xl">
              الأسئلة الشائعة
            </h2>
            <p className="mt-4 text-muted-foreground font-sans">
              كل ما تود معرفته عن طريقة عمل المنصة والشهادات المعتمدة والضمانات
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-[#0d1322] border border-white/5 rounded-2xl overflow-hidden transition-all duration-300"
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full text-right p-6 flex justify-between items-center gap-4 text-white font-heading font-bold md:text-lg animate-in"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`h-5 w-5 text-accent shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                      >
                        <div className="px-6 pb-6 pt-2 text-[#98a9c2] text-sm md:text-base leading-relaxed font-sans font-light border-t border-white/[0.03]">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* High-Impact CTA Banner */}
      <section className="py-24 relative overflow-hidden bg-gradient-to-tr from-[#080d19] via-[#0b172a] to-[#0d1c33] border-t border-white/5 text-center">
        <div className="absolute inset-0 bg-primary/10 opacity-30 blur-3xl pointer-events-none" />
        <div className="container px-6 mx-auto relative z-10 space-y-8">
          <Award className="h-16 w-16 text-accent mx-auto animate-bounce" />
          <h2 className="text-3xl font-heading font-extrabold text-white md:text-6xl max-w-4xl mx-auto leading-tight">
            هل أنت جاهز لتجديد رخصتك المهنية في ساعات بدلاً من شهور؟
          </h2>
          <p className="text-muted-foreground font-sans text-lg max-w-2xl mx-auto leading-relaxed">
            انضم الآن لأكثر من ٥,٠٠٠ مهني ومحاسب قانوني يثقون بمنصة خطة لتلبية
            متطلبات الـ CPE الخاصة بهم بكفاءة وسرعة مطلقة.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 max-w-md mx-auto pt-4">
            <Button
              size="lg"
              asChild
              className="gradient-accent border-0 text-accent-foreground text-lg px-10 py-7 hover:opacity-90 w-full sm:w-auto font-heading font-bold shadow-xl shadow-accent/20"
            >
              <Link to="/register">
                سجل حسابك مجاناً الآن <ArrowLeft className="mr-2 h-5 w-5" />
              </Link>
            </Button>
            <span className="text-xs text-muted-foreground font-sans">
              لا يتطلب إدخال بطاقة ائتمان
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#060a12] py-16 text-right relative">
        <div className="container mx-auto px-6">
          <div className="grid gap-12 md:grid-cols-4">
            {/* Logo and brief */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                  <Award className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-heading font-extrabold text-white">
                  خطة CPE Pro
                </span>
              </div>
              <p className="text-xs md:text-sm text-[#73839c] leading-relaxed font-sans font-light">
                المنصة الخليجية الرائدة والمعتمدة لتسهيل ساعات التعليم المهني
                المستمر (CPE) للمحاسبين والمراجعين عبر نظام التقييم الذكي دون
                محاضرات فيديو مملة.
              </p>
            </div>

            {/* Quick links */}
            <div>
              <h4 className="font-heading font-bold text-white text-base mb-5">
                روابط سريعة
              </h4>
              <ul className="space-y-3 text-xs md:text-sm text-[#73839c] font-sans">
                <li>
                  <a
                    href="#how-it-works"
                    className="hover:text-white transition-colors"
                  >
                    كيف تعمل المنصة
                  </a>
                </li>
                <li>
                  <a
                    href="#calculator"
                    className="hover:text-white transition-colors"
                  >
                    حاسبة الساعات والتوفير
                  </a>
                </li>
                <li>
                  <a
                    href="#sandbox"
                    className="hover:text-white transition-colors"
                  >
                    التجربة الحية والأسئلة
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="hover:text-white transition-colors"
                  >
                    الباقات والأسعار
                  </a>
                </li>
              </ul>
            </div>

            {/* Supported certifications details */}
            <div>
              <h4 className="font-heading font-bold text-white text-base mb-5">
                الشهادات المدعومة
              </h4>
              <ul className="space-y-3 text-xs md:text-sm text-[#73839c] font-sans">
                <li>زمالة التدقيق الداخلي (CIA)</li>
                <li>زمالة المحاسبة الإدارية (CMA)</li>
                <li>المحاسبة القانونية (CPA / SOCPA)</li>
                <li>تدقيق نظم المعلومات (CISA)</li>
                <li>مكافحة الاحتيال المالي (CFE)</li>
              </ul>
            </div>

            {/* Support and compliance */}
            <div>
              <h4 className="font-heading font-bold text-white text-base mb-5">
                الدعم والامتثال
              </h4>
              <ul className="space-y-3 text-xs md:text-sm text-[#73839c] font-sans">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    تواصل معنا
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    سياسة الخصوصية والأمان
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    الشروط والأحكام
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    شروط الامتثال لمعايير CPE
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs md:text-sm text-muted-foreground font-sans">
            <span>
              © {new Date().getFullYear()} منصة خطة CPE Pro. جميع الحقوق محفوظة.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
