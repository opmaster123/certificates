import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, Link, useNavigate } from "react-router-dom";
import { testVariantsService } from "@/services/test-variants";
import {
  Clock,
  Flag,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  AlertTriangle,
  Award,
  Download,
  Share2,
  Loader2,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

type Phase = "pre" | "test" | "loading" | "result";

const TestTaking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("pre");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [honorCode, setHonorCode] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Check if test is blocked because of another active lock
  const [isBlocked, setIsBlocked] = useState(false);
  const [hasActiveBundle, setHasActiveBundle] = useState(false);
  const [blockMessage, setBlockMessage] = useState("");
  const [alreadyFinished, setAlreadyFinished] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [expirationTime, setExpirationTime] = useState<number | null>(null);
  const [lockChecked, setLockChecked] = useState(false);

  useEffect(() => {
    if (!id) return;
    const checkLockStatus = async () => {
      try {
        // 1. Check active individual test lock
        const indLock = await testVariantsService.getActiveIndividualTest();
        if (indLock) {
          const isCurrentTest = indLock.testVariantId === id;
          if (isCurrentTest) {
            setAlreadyFinished(true);
            setPhase("result");
            setLockChecked(true);
            return;
          } else {
            setIsBlocked(true);
            setBlockMessage(
              "لديك اختبار فردي مكتمل وغير مدفوع. يرجى إتمام الدفع أو إلغاؤه للتمكن من تقديم هذا الاختبار.",
            );
            setLockChecked(true);
            return;
          }
        }

        // 2. Check active bundle lock
        const activeBundle = await testVariantsService.getActiveBundle();
        if (activeBundle) {
          setHasActiveBundle(true);
          const currentBundleTest = activeBundle.tests?.find(
            (t: any) => t.variantId === id,
          );
          if (!currentBundleTest) {
            setIsBlocked(true);
            setBlockMessage(
              "لديك باقة اختبارات نشطة ومحجوزة حالياً. هذا الاختبار ليس جزءاً من الباقة النشطة. يرجى إكمال باقتك الحالية أو إلغاؤها لتتمكن من تقديم هذا الاختبار.",
            );
          } else if (currentBundleTest.finished) {
            setAlreadyFinished(true);
            setPhase("result");
          }
        }
        setLockChecked(true);
      } catch (e) {
        console.error("Error checking lock status:", e);
        setLockChecked(true);
      }
    };
    checkLockStatus();
  }, [id]);

  // Dynamic state loaded from backend
  const [variant, setVariant] = useState<any | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(20 * 60);
  const [totalTime, setTotalTime] = useState(20 * 60);

  // Fetch variant details and questions
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    testVariantsService
      .getTestVariantById(id)
      .then((variantData) => {
        if (!variantData || !variantData.id) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        setVariant(variantData);
        setQuestions(
          Array.isArray(variantData?.questions) ? variantData.questions : [],
        );
        const durationSec = (variantData?.duration || 20) * 60;
        setTotalTime(durationSec);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching test variant data:", err);
        setNotFound(true);
        setLoading(false);
      });
  }, [id]);

  // Load draft from localStorage when locks are checked and variant details are loaded
  useEffect(() => {
    if (!id || !lockChecked || !variant) return;

    // If the test is already completed or blocked, do not restore any drafts!
    if (alreadyFinished || isBlocked) {
      const durationSec = (variant?.duration || 20) * 60;
      setTimeLeft(durationSec);
      return;
    }

    const savedDraft = localStorage.getItem(`test_draft_${id}`);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        
        // Validate draft schema to prevent malformed or hijacked data
        const isValidPhase = draft.phase === "pre" || draft.phase === "test" || draft.phase === "result";
        const isValidAnswers = draft.answers && typeof draft.answers === "object" && !Array.isArray(draft.answers);
        
        if (isValidPhase && isValidAnswers) {
          setPhase(draft.phase);
          setCurrentQ(typeof draft.currentQ === "number" ? draft.currentQ : 0);
          setAnswers(draft.answers);
          setFlagged(new Set(Array.isArray(draft.flagged) ? draft.flagged : []));
          setHonorCode(!!draft.honorCode);
          
          if (draft.expirationTime && typeof draft.expirationTime === "number") {
            setExpirationTime(draft.expirationTime);
            const remaining = Math.max(0, Math.floor((draft.expirationTime - Date.now()) / 1000));
            setTimeLeft(remaining);
          } else {
            setTimeLeft(draft.timeLeft !== undefined ? draft.timeLeft : (variant?.duration || 20) * 60);
          }
        } else {
          // Corrupted or invalid draft structure - remove it
          localStorage.removeItem(`test_draft_${id}`);
          const durationSec = (variant?.duration || 20) * 60;
          setTimeLeft(durationSec);
        }
      } catch (e) {
        console.error("Error parsing saved test draft:", e);
        try {
          localStorage.removeItem(`test_draft_${id}`);
        } catch {}
        const durationSec = (variant?.duration || 20) * 60;
        setTimeLeft(durationSec);
      }
    } else {
      const durationSec = (variant?.duration || 20) * 60;
      setTimeLeft(durationSec);
    }
  }, [id, lockChecked, alreadyFinished, isBlocked, variant]);

  // Save progress draft to localStorage
  useEffect(() => {
    if (!id || phase === "loading" || phase === "result") return;
    
    // Only save draft if they have started the test, checked honor code, or answered any questions
    if (phase === "test" || honorCode || Object.keys(answers).length > 0) {
      try {
        let currentExpiration = expirationTime;
        
        // Calculate expirationTime if they entered the active test phase
        if (phase === "test" && !currentExpiration) {
          currentExpiration = Date.now() + timeLeft * 1000;
          setExpirationTime(currentExpiration);
        }

        // Clear any old/previous test drafts to keep only the current one
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("test_draft_") && key !== `test_draft_${id}`) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((key) => {
          try {
            localStorage.removeItem(key);
          } catch {}
        });

        const draft = {
          phase,
          currentQ,
          answers,
          flagged: Array.from(flagged),
          timeLeft,
          honorCode,
          expirationTime: currentExpiration,
        };
        localStorage.setItem(`test_draft_${id}`, JSON.stringify(draft));
        
        // Update saving indicator timestamp in real-time
        if (phase === "test") {
          setLastSaved(new Date());
        }
      } catch (e) {
        console.error("Failed to save test draft to localStorage:", e);
      }
    }
  }, [id, phase, currentQ, answers, flagged, timeLeft, honorCode, expirationTime]);

  // Timer
  useEffect(() => {
    if (phase !== "test") return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setPhase("loading");
          setTimeout(() => setPhase("result"), 2000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);



  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const selectAnswer = (qIndex: number, value: number) => {
    setAnswers((prev) => ({ ...prev, [qIndex]: value }));
  };

  const toggleFlag = (qIndex: number) => {
    setFlagged((prev) => {
      const next = new Set(prev);
      next.has(qIndex) ? next.delete(qIndex) : next.add(qIndex);
      return next;
    });
  };

  // Grading logic: All questions are MCQ, and all options are correct
  // A question counts as correct if it has been answered by the user
  const score = Object.keys(answers).length;
  const totalGradable = questions.length;
  const passed =
    alreadyFinished ||
    (totalGradable > 0 ? score / totalGradable >= 0.7 : false);

  const handleSubmit = () => {
    setShowConfirm(false);
    setPhase("loading");
    setTimeout(() => setPhase("result"), 500);
  };

  // Save progress to database when passed
  useEffect(() => {
    if (phase === "result" && passed && id && !alreadyFinished) {
      const saveProgress = async () => {
        try {
          if (hasActiveBundle) {
            await testVariantsService.saveBundleProgress(id);
          } else {
            await testVariantsService.finishIndividualTest(id);
          }
          // Remove draft from localStorage after successfully saving progress
          localStorage.removeItem(`test_draft_${id}`);
        } catch (e) {
          console.error("Error saving progress to backend:", e);
        }
      };
      saveProgress();
    }
  }, [phase, passed, id, hasActiveBundle, alreadyFinished]);

  if (loading) {
    return (
      <div
        className="min-h-screen bg-background flex items-center justify-center p-4"
        dir="rtl"
      >
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div
        className="min-h-screen bg-background flex items-center justify-center p-4 text-right"
        dir="rtl"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center space-y-6"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="h-8 w-8" />
          </div>

          <div className="space-y-2 text-center">
            <h1 className="text-xl font-heading font-bold text-foreground">
              الاختبار غير موجود
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed font-sans font-medium">
              عذراً، لم نتمكن من العثور على هذا الاختبار. قد يكون المعرف غير
              صحيح أو تم حذف الاختبار.
            </p>
          </div>

          <Button
            asChild
            className="w-full gradient-primary border-0 text-primary-foreground hover:opacity-90 font-heading py-3 rounded-xl flex items-center justify-center font-bold"
          >
            <Link to="/tests">العودة إلى الاختبارات</Link>
          </Button>
        </motion.div>
      </div>
    );
  }

  if (isBlocked) {
    return (
      <div
        className="min-h-screen bg-background flex items-center justify-center p-4 text-right"
        dir="rtl"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center space-y-6"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive animate-pulse">
            <AlertTriangle className="h-8 w-8" />
          </div>

          <div className="space-y-2 text-center">
            <h1 className="text-xl font-heading font-bold text-foreground">
              الاختبار غير متاح حالياً
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed font-sans">
              {blockMessage}
            </p>
          </div>

          <Button
            asChild
            className="w-full gradient-primary border-0 text-primary-foreground hover:opacity-90 font-heading py-3 rounded-xl flex items-center justify-center"
          >
            <Link to="/tests">العودة إلى الاختبارات</Link>
          </Button>
        </motion.div>
      </div>
    );
  }

  // Pre-test Instructions
  if (phase === "pre") {
    return (
      <div
        className="min-h-screen bg-background flex items-center justify-center p-4 text-right"
        dir="rtl"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg rounded-2xl border border-border bg-card p-8"
        >
          <h1 className="text-2xl font-heading font-bold text-card-foreground">
            {variant?.test?.title || "اختبار التقييم"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {variant?.test?.desc}
          </p>

          <div className="mt-6 space-y-3 text-sm">
            {[
              ["إجمالي الأسئلة", `${questions.length} أسئلة`],
              ["المدة المقدرة", `${variant?.duration || 20} دقيقة`],
              ["ساعات CPE المستحقة", `${variant?.hours || 1.0} ساعة`],
              [
                "درجة النجاح المطلوبة",
                `٧٠% (${Math.ceil(totalGradable * 0.7)}/${totalGradable} صحيحة)`,
              ],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex justify-between py-2 border-b border-border"
              >
                <span className="text-muted-foreground">{label}</span>
                <span className="font-semibold text-card-foreground">
                  {value}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground space-y-2">
            <p>• اقرأ كل سؤال بعناية واختر الإجابة الأفضل</p>
            <p>• يمكنك التنقل بين الأسئلة بحرية وتعليمها للمراجعة اللاحقة</p>
            <p>• يتم حفظ تقدمك وإجاباتك تلقائياً كل 10 ثوانٍ</p>
          </div>

          {hasActiveBundle && (
            <div
              className="mt-4 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-xl p-3 flex gap-2.5 text-right font-sans text-xs leading-relaxed"
              dir="rtl"
            >
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
              <div>
                <span className="font-bold text-foreground block mb-0.5">
                  تنبيه الباقة النشطة
                </span>
                هذا الاختبار جزء من باقتك المؤكدة. إذا قمت بإلغاء الباقة لاحقاً،
                فستفقد كل التقدم المحرز في هذا الاختبار وسيتعين عليك إعادته من
                جديد.
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center gap-3 justify-start">
            <Checkbox
              id="honor"
              checked={honorCode}
              onCheckedChange={(v) => setHonorCode(!!v)}
              className="mt-0.5"
            />
            <label
              htmlFor="honor"
              className="text-sm text-muted-foreground cursor-pointer leading-relaxed"
            >
              أؤكد أنني سأكمل هذا الاختبار بأمانة دون مساعدة خارجية
            </label>
          </div>

          <div className="mt-6 flex gap-3">
            <Button asChild variant="outline" className="flex-1">
              <Link to="/tests">العودة</Link>
            </Button>
            <Button
              disabled={!honorCode}
              onClick={() => setPhase("test")}
              className="flex-1 gradient-primary border-0 text-primary-foreground hover:opacity-90"
            >
              ابدأ الاختبار
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Loading state for scoring
  if (phase === "loading") {
    return (
      <div
        className="min-h-screen bg-background flex items-center justify-center p-4"
        dir="rtl"
      >
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <h2 className="text-xl font-heading font-bold text-foreground">
            جارٍ حساب نتائجك...
          </h2>
          <p className="text-muted-foreground">لن يستغرق الأمر طويلاً</p>
        </div>
      </div>
    );
  }

  // Result phase
  if (phase === "result") {
    return (
      <div
        className="min-h-screen bg-background flex items-center justify-center p-4 text-center"
        dir="rtl"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-lg rounded-2xl border border-border bg-card p-8"
        >
          <div
            className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full ${passed ? "bg-success/10" : "bg-destructive/10"}`}
          >
            {passed ? (
              <CheckCircle className="h-10 w-10 text-success" />
            ) : (
              <AlertTriangle className="h-10 w-10 text-destructive" />
            )}
          </div>
          <h1 className="text-2xl font-heading font-bold text-card-foreground">
            {alreadyFinished
              ? "لقد اجتزت هذا الاختبار بنجاح! 🏆"
              : passed
                ? "تهانينا! 🎉"
                : "لم تجتز هذه المرة"}
          </h1>
          <p className="mt-2 text-4xl font-heading font-bold text-card-foreground">
            {alreadyFinished
              ? "مكتمل"
              : totalGradable > 0
                ? `${Math.round((score / totalGradable) * 100)}%`
                : "0%"}
          </p>
          <p className="text-muted-foreground">
            {alreadyFinished
              ? hasActiveBundle
                ? "تم إكمال هذا الاختبار كجزء من الباقة النشطة."
                : "الشهادة جاهزة وبانتظار إتمام عملية الدفع لتفعيلها وتنزيلها."
              : `${score}/${totalGradable} إجابات صحيحة • درجة النجاح: ٧٠%`}
          </p>
          {!alreadyFinished && passed && !hasActiveBundle && (
            <p className="text-muted-foreground mt-2 font-medium">
              الشهادة جاهزة وبانتظار إتمام عملية الدفع لتفعيلها وتنزيلها.
            </p>
          )}
          {!alreadyFinished && passed && hasActiveBundle && (
            <p className="text-muted-foreground mt-2 font-medium">
              لقد أكملت هذا الاختبار بنجاح كجزء من الباقة. يمكنك العودة لصفحة
              الاختبارات للمتابعة.
            </p>
          )}

          {/* Score breakdown */}
          {!alreadyFinished && (
            <div className="mt-4 rounded-lg bg-muted/50 p-4 space-y-2 text-sm text-right">
              <div className="flex justify-between text-muted-foreground">
                <span>أسئلة الاختيار المتعدد</span>
                <span className="font-semibold text-card-foreground">
                  {score}/{totalGradable}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>الوقت المستغرق</span>
                <span className="font-semibold text-card-foreground">
                  {formatTime(totalTime - timeLeft)}
                </span>
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3">
            {passed ? (
              <>
                {!hasActiveBundle ? (
                  <Button
                    onClick={() => navigate("/payment")}
                    className="gradient-primary border-0 text-primary-foreground hover:opacity-90 font-bold py-6 text-base rounded-xl flex items-center justify-center"
                  >
                    <Award className="ml-2 h-5 w-5 animate-pulse" /> ادفع الآن
                    لتفعيل وتحميل الشهادة المعتمدة
                  </Button>
                ) : (
                  <Button
                    asChild
                    className="gradient-primary border-0 text-primary-foreground hover:opacity-90 font-bold py-6 text-base rounded-xl flex items-center justify-center"
                  >
                    <Link to="/tests">العودة لصفحة الاختبارات للمتابعة</Link>
                  </Button>
                )}
              </>
            ) : (
              <Button
                className="gradient-primary border-0 text-primary-foreground hover:opacity-90"
                onClick={() => {
                  setPhase("pre");
                  setAnswers({});
                  setCurrentQ(0);
                  setHonorCode(false);
                  setTimeLeft(totalTime);
                  setFlagged(new Set());
                  setExpirationTime(null);
                  if (id) {
                    localStorage.removeItem(`test_draft_${id}`);
                  }
                }}
              >
                إعادة الاختبار
              </Button>
            )}
            {(!passed || !hasActiveBundle) && (
              <Button asChild variant="ghost">
                <Link to="/tests">العودة للاختبارات</Link>
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // Test-taking phase
  const q = questions[currentQ];
  const parsedOptions = (() => {
    if (!q) return [];
    try {
      return typeof q.options === "string"
        ? JSON.parse(q.options)
        : q.options || [];
    } catch {
      return [];
    }
  })();
  const isTimeLow = timeLeft < 120;

  return (
    <div className="min-h-screen bg-background text-right" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-border bg-card/80 backdrop-blur-md px-4 py-3">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="font-heading font-bold text-foreground text-sm md:text-base">
              {variant?.test?.title || "تقديم الاختبار"}
            </h2>
            <Badge variant="secondary">
              سؤال {currentQ + 1} من {questions.length}
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-1 text-sm font-mono font-bold ${isTimeLow ? "text-destructive animate-pulse" : "text-muted-foreground"}`}
            >
              <Clock className="h-4 w-4" />
              <span>{formatTime(timeLeft)}</span>
            </div>
            {lastSaved && (
              <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground">
                <Save className="h-3 w-3" /> تم الحفظ
              </div>
            )}
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setShowConfirm(true)}
            >
              تقديم الاختبار
            </Button>
          </div>
        </div>
        {/* Progress bar */}
        <div className="container mx-auto mt-2">
          <div className="flex gap-1">
            {questions.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i === currentQ
                    ? "gradient-primary"
                    : answers[i] !== undefined
                      ? "bg-success/50"
                      : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto flex gap-6 p-4 lg:p-6">
        {/* Question Area */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            {q && (
              <motion.div
                key={currentQ}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.25 }}
                className="rounded-xl border border-border bg-card p-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="outline">سؤال {currentQ + 1}</Badge>
                  <Badge className="bg-primary/10 text-primary border-0">
                    اختيار متعدد
                  </Badge>
                  {flagged.has(currentQ) && (
                    <Badge className="bg-accent/10 text-accent border-0">
                      <Flag className="h-3 w-3 ml-1" /> مُعلّم
                    </Badge>
                  )}
                </div>

                <h3 className="text-lg font-heading font-bold text-card-foreground leading-relaxed">
                  {q.text}
                </h3>

                <div className="mt-6 space-y-3">
                  {parsedOptions.map((opt: string, i: number) => {
                    const letters = ["أ", "ب", "ج", "د"];
                    const selected = answers[currentQ] === i;
                    return (
                      <button
                        key={i}
                        onClick={() => selectAnswer(currentQ, i)}
                        className={`w-full text-right flex items-center justify-between rounded-xl border-2 p-4 transition-all ${
                          selected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/30 hover:bg-muted/30"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                              selected
                                ? "gradient-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {letters[i]}
                          </span>
                          <span
                            className={`text-sm ${selected ? "font-semibold text-card-foreground" : "text-muted-foreground"}`}
                          >
                            {opt}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Navigation */}
                <div className="mt-6 flex items-center justify-between">
                  <Button
                    variant="outline"
                    disabled={currentQ === 0}
                    onClick={() => setCurrentQ((p) => p - 1)}
                  >
                    <ChevronRight className="ml-1 h-4 w-4" /> السابق
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => toggleFlag(currentQ)}
                    className={
                      flagged.has(currentQ)
                        ? "text-accent"
                        : "text-muted-foreground"
                    }
                  >
                    <Flag className="ml-1 h-4 w-4" />{" "}
                    {flagged.has(currentQ) ? "إزالة العلامة" : "علّم للمراجعة"}
                  </Button>
                  {currentQ < questions.length - 1 ? (
                    <Button
                      onClick={() => setCurrentQ((p) => p + 1)}
                      className="gradient-primary border-0 text-primary-foreground hover:opacity-90"
                    >
                      التالي <ChevronLeft className="mr-1 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={() => setShowConfirm(true)}
                      className="gradient-secondary border-0 text-secondary-foreground hover:opacity-90"
                    >
                      تقديم الاختبار
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Question Map - Desktop */}
        <div className="hidden lg:block w-60">
          <div className="sticky top-28 rounded-xl border border-border bg-card p-4 text-right">
            <h4 className="font-heading font-bold text-card-foreground mb-3">
              خريطة الأسئلة
            </h4>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentQ(i)}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold transition-colors ${
                    currentQ === i
                      ? "gradient-primary text-primary-foreground"
                      : answers[i] !== undefined
                        ? "bg-success/10 text-success"
                        : "bg-muted text-muted-foreground"
                  } ${flagged.has(i) ? "ring-2 ring-accent" : ""}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <div className="mt-4 space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-success/30" />
                <span>تمت الإجابة: {Object.keys(answers).length}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-muted" />
                <span>
                  بدون إجابة: {questions.length - Object.keys(answers).length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded ring-2 ring-accent" />
                <span>مُعلّم: {flagged.size}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="text-right" dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle className="font-heading text-right w-full">
              تأكيد تقديم الاختبار
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex justify-between py-2 border-b border-border">
              <span>أسئلة تمت الإجابة عليها</span>
              <span className="font-semibold text-foreground">
                {Object.keys(answers).length}/{questions.length}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span>أسئلة مُعلّمة</span>
              <span className="font-semibold text-foreground">
                {flagged.size}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span>الوقت المتبقي</span>
              <span className="font-semibold text-foreground">
                {formatTime(timeLeft)}
              </span>
            </div>
            {Object.keys(answers).length < questions.length && (
              <div className="rounded-lg bg-accent/10 p-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-accent" />
                <span className="text-accent text-xs">
                  لديك {questions.length - Object.keys(answers).length} أسئلة
                  بدون إجابة!
                </span>
              </div>
            )}
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              مراجعة الإجابات
            </Button>
            <Button
              onClick={handleSubmit}
              className="gradient-primary border-0 text-primary-foreground hover:opacity-90"
            >
              تقديم الاختبار
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TestTaking;
