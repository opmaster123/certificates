import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Award,
  BookOpen,
  Calculator,
  Check,
  ChevronLeft,
  Download,
  HelpCircle,
  RefreshCw,
  Sparkles,
  User,
  Loader2,
} from "lucide-react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardLayout from "@/components/DashboardLayout";
import CertificateTemplate from "@/components/CertificateTemplate";

// Quiz Data
const quizQuestions = [
  {
    id: 1,
    question:
      "أي مما يلي يعد الهدف الرئيسي للتدقيق الداخلي وفقاً للمعايير الدولية؟",
    options: [
      "إعداد البيانات المالية الختامية للشركة",
      "إضافة قيمة للمؤسسة وتحسين عملياتها ومساعدتها في تحقيق أهدافها",
      "تصميم وتنفيذ أنظمة الرقابة الداخلية بشكل مباشر",
      "كشف وتتبع كافة حالات الاحتيال والسرقة وتطبيق العقوبات",
    ],
    answerIndex: 1,
    explanation:
      "الهدف الرئيسي للتدقيق الداخلي هو نشاط مستقل وموضوعي، يقدم تأكيداً وخدمات استشارية بهدف إضافة قيمة للمؤسسة وتحسين عملياتها.",
  },
  {
    id: 2,
    question:
      "في سياق إدارة المخاطر، ماذا يعني مصطلح 'الخطر المتبقي' (Residual Risk)؟",
    options: [
      "الخطر الموجود قبل اتخاذ أي إجراءات رقابية",
      "الخطر الذي تم التخلص منه نهائياً عن طريق التأمين",
      "الخطر المتبقي بعد استجابة الإدارة للمخاطر وتطبيق الضوابط الرقابية",
      "الخطر المرتبط حصرياً بالأصول المالية السائلة للشركة",
    ],
    answerIndex: 2,
    explanation:
      "الخطر المتبقي هو الخطر الذي يتبقى بعد اتخاذ الإدارة للإجراءات والتدابير لتقليل احتمالية أو تأثير الخطر (الضوابط الرقابية).",
  },
  {
    id: 3,
    question:
      "ما هي الجهة المسؤولة عن إصدار شهادة المدقق الداخلي المعتمد (CIA)؟",
    options: [
      "جمعية المحاسبين القانونيين المعتمدين (ACCA)",
      "معهد المحاسبين الإداريين (IMA)",
      "معهد المدققين الداخليين الدولي (IIA)",
      "مجلس معايير المحاسبة الدولية (IASB)",
    ],
    answerIndex: 2,
    explanation:
      "معهد المدققين الداخليين الدولي (IIA) هو الجهة العالمية المانحة لشهادة المدقق الداخلي المعتمد (CIA).",
  },
];

export default function Trial() {
  // Tab control
  const [activeTab, setActiveTab] = useState("quiz");

  // Quiz State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  // Certificate Preview State
  const [studentName, setStudentName] = useState("أحمد محمد");
  const [certType, setCertType] = useState("CIA");
  const [courseTitle, setCourseTitle] = useState(
    "تقييم المخاطر والحوكمة المؤسسية",
  );
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleDownloadPDF = async () => {
    const element = document.getElementById("certificate-container");
    if (!element) {
      toast.error("لم يتم العثور على قالب الشهادة.");
      return;
    }

    setIsGeneratingPDF(true);
    toast.info("جاري توليد ملف الـ PDF بجودة عالية...");

    try {
      const imgData = await toPng(element, {
        quality: 1.0,
        pixelRatio: 5,
        cacheBust: true,
      });

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = 297;
      const pdfHeight = 210;

      pdf.addImage(
        imgData,
        "PNG",
        0,
        0,
        pdfWidth,
        pdfHeight,
        undefined,
        "NONE",
      );
      pdf.save("cpe-certificate.pdf");
      toast.success("تم تحميل الشهادة بنجاح!");
    } catch (error) {
      console.error("PDF generation failed:", error);
      toast.error("فشل في توليد ملف الـ PDF. يرجى المحاولة لاحقاً.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // CPE Calculator State
  const [calcCert, setCalcCert] = useState("CIA");
  const [completedHours, setCompletedHours] = useState(15);
  const totalRequiredHours =
    calcCert === "CPA" ? 40 : calcCert === "CMA" ? 30 : 40;

  // Handlers for Quiz
  const handleOptionSelect = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
  };

  const handleAnswerSubmit = () => {
    if (selectedOption === null || isAnswered) return;

    setIsAnswered(true);
    if (selectedOption === quizQuestions[currentQuestionIndex].answerIndex) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    setSelectedOption(null);
    setIsAnswered(false);
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      setQuizFinished(true);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setQuizFinished(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-accent animate-pulse" />
              جرب المنصة التفاعلية
            </h1>
            <p className="mt-1 text-muted-foreground">
              استمتع بتجربة تفاعلية سريعة لاختبار معلوماتك، حساب ساعات التعليم
              المستمر، ومعاينة شهاداتك المعتمدة.
            </p>
          </div>
        </div>

        {/* Tab system */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid grid-cols-3 w-full max-w-xl mx-auto bg-muted/60 p-1 rounded-xl">
            <TabsTrigger
              value="quiz"
              className="rounded-lg gap-2 text-xs md:text-sm py-2"
            >
              <HelpCircle className="h-4 w-4" />
              اختبار تجريبي
            </TabsTrigger>
            <TabsTrigger
              value="certificate"
              className="rounded-lg gap-2 text-xs md:text-sm py-2"
            >
              <Award className="h-4 w-4" />
              معاينة الشهادة
            </TabsTrigger>
            <TabsTrigger
              value="calculator"
              className="rounded-lg gap-2 text-xs md:text-sm py-2"
            >
              <Calculator className="h-4 w-4" />
              حاسبة الساعات
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: QUIZ */}
          <TabsContent value="quiz">
            <Card className="border border-border/80 bg-card shadow-lg max-w-2xl mx-auto overflow-hidden">
              <CardHeader className="border-b border-border/60 bg-muted/20">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl">اختبار سريع تفاعلي</CardTitle>
                  {!quizFinished && (
                    <Badge variant="outline" className="px-3 py-1 text-xs">
                      سؤال {currentQuestionIndex + 1} من {quizQuestions.length}
                    </Badge>
                  )}
                </div>
                <CardDescription>
                  اختبر مدى استعدادك للاختبارات الحقيقية عبر هذا النموذج السريع
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <AnimatePresence mode="wait">
                  {!quizFinished ? (
                    <motion.div
                      key={currentQuestionIndex}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-6"
                    >
                      <h3 className="text-lg font-semibold text-foreground leading-relaxed">
                        {quizQuestions[currentQuestionIndex].question}
                      </h3>

                      <div className="space-y-3">
                        {quizQuestions[currentQuestionIndex].options.map(
                          (option, idx) => {
                            let optionClass =
                              "border-border/80 hover:bg-muted/40 text-foreground";
                            if (selectedOption === idx) {
                              optionClass =
                                "border-primary bg-primary/5 text-primary ring-1 ring-primary";
                            }
                            if (isAnswered) {
                              const isCorrect =
                                idx ===
                                quizQuestions[currentQuestionIndex].answerIndex;
                              const isSelected = idx === selectedOption;
                              if (isCorrect) {
                                optionClass =
                                  "border-success bg-success/10 text-success font-semibold ring-1 ring-success";
                              } else if (isSelected) {
                                optionClass =
                                  "border-destructive bg-destructive/10 text-destructive ring-1 ring-destructive";
                              } else {
                                optionClass =
                                  "opacity-50 border-border text-foreground";
                              }
                            }

                            return (
                              <button
                                key={idx}
                                onClick={() => handleOptionSelect(idx)}
                                disabled={isAnswered}
                                className={`w-full text-right p-4 rounded-xl border-2 transition-all flex items-center justify-between ${optionClass}`}
                              >
                                <span className="text-sm md:text-base">
                                  {option}
                                </span>
                                {isAnswered &&
                                  idx ===
                                    quizQuestions[currentQuestionIndex]
                                      .answerIndex && (
                                    <Check className="h-5 w-5 text-success flex-shrink-0 mr-2" />
                                  )}
                              </button>
                            );
                          },
                        )}
                      </div>

                      {/* Explanation */}
                      {isAnswered && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 rounded-xl bg-muted/60 border border-border/80 text-sm text-muted-foreground space-y-1"
                        >
                          <strong className="text-foreground block mb-1">
                            توضيح الإجابة:
                          </strong>
                          {quizQuestions[currentQuestionIndex].explanation}
                        </motion.div>
                      )}

                      {/* Action buttons */}
                      <div className="flex gap-3 justify-end pt-2">
                        {!isAnswered ? (
                          <Button
                            onClick={handleAnswerSubmit}
                            disabled={selectedOption === null}
                            className="gradient-primary text-primary-foreground px-6 py-2"
                          >
                            تأكيد الإجابة
                          </Button>
                        ) : (
                          <Button
                            onClick={handleNextQuestion}
                            className="gradient-accent text-accent-foreground px-6 py-2 gap-2"
                          >
                            {currentQuestionIndex < quizQuestions.length - 1
                              ? "السؤال التالي"
                              : "عرض النتيجة"}
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-8 space-y-6"
                    >
                      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-accent/10">
                        <Award className="h-10 w-10 text-accent" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-2xl font-bold text-foreground">
                          اكتمل الاختبار التجريبي!
                        </h3>
                        <p className="text-muted-foreground">
                          لقد أجبت بشكل صحيح على {score} من أصل{" "}
                          {quizQuestions.length} أسئلة
                        </p>
                      </div>

                      <div className="max-w-xs mx-auto p-4 rounded-xl bg-muted/40 border border-border">
                        <div className="text-sm text-muted-foreground">
                          النسبة المئوية
                        </div>
                        <div className="text-3xl font-bold text-foreground">
                          {Math.round((score / quizQuestions.length) * 100)}%
                        </div>
                      </div>

                      <div className="flex justify-center gap-3 pt-4">
                        <Button
                          variant="outline"
                          onClick={resetQuiz}
                          className="gap-2"
                        >
                          <RefreshCw className="h-4 w-4" />
                          إعادة المحاولة
                        </Button>
                        <Button
                          className="gradient-primary text-primary-foreground"
                          onClick={() => setActiveTab("certificate")}
                        >
                          انتقل لمعاينة شهادتك
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: CERTIFICATE PREVIEW */}
          <TabsContent value="certificate">
            <div className="grid gap-8 lg:grid-cols-5 max-w-5xl mx-auto items-start">
              {/* Form Input */}
              <Card className="lg:col-span-2 border border-border shadow-md">
                <CardHeader>
                  <CardTitle>تخصيص الشهادة</CardTitle>
                  <CardDescription>
                    أدخل اسمك واختر نوع الدورة لتوليد شهادة رقمية فورية
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">
                      اسم الطالب
                    </label>
                    <div className="relative">
                      <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        placeholder="أحمد محمد"
                        className="pr-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">
                      نوع الاعتماد
                    </label>
                    <div className="flex gap-2">
                      {["CIA", "CMA", "CPA"].map((type) => (
                        <button
                          key={type}
                          onClick={() => setCertType(type)}
                          className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                            certType === type
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background text-muted-foreground border-border hover:bg-muted/40"
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">
                      موضوع الشهادة
                    </label>
                    <select
                      value={courseTitle}
                      onChange={(e) => setCourseTitle(e.target.value)}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="تقييم المخاطر والحوكمة المؤسسية">
                        تقييم المخاطر والحوكمة المؤسسية
                      </option>
                      <option value="المعايير المهنية للتدقيق الداخلي">
                        المعايير المهنية للتدقيق الداخلي
                      </option>
                      <option value="التخطيط المالي والرقابة الداخلية">
                        التخطيط المالي والرقابة الداخلية
                      </option>
                      <option value="السلوك المهني والنزاهة المالية">
                        السلوك المهني والنزاهة المالية
                      </option>
                    </select>
                  </div>

                  <Button
                    onClick={handleDownloadPDF}
                    disabled={isGeneratingPDF}
                    className="w-full gradient-primary text-primary-foreground gap-2 mt-2"
                  >
                    {isGeneratingPDF ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    <span>
                      {isGeneratingPDF
                        ? "جاري التنزيل..."
                        : "تحميل شهادتك الرقمية"}
                    </span>
                  </Button>
                </CardContent>
              </Card>

              <div className="lg:col-span-3 flex justify-center">
                <CertificateTemplate
                  studentName={studentName}
                  certType={certType}
                  courseTitle={courseTitle}
                />
              </div>
            </div>
          </TabsContent>

          {/* TAB 3: CPE CALCULATOR */}
          <TabsContent value="calculator">
            <Card className="border border-border shadow-lg max-w-xl mx-auto">
              <CardHeader>
                <CardTitle className="text-xl">
                  حاسبة ساعات CPE الذكية
                </CardTitle>
                <CardDescription>
                  اختر نوع شهادتك المهنية وحدد الساعات الحالية لترى المتبقي لك
                  وخطة التغطية المقترحة
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Cert selector */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">
                    الشهادة الحالية
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {["CIA", "CMA", "CPA"].map((cert) => (
                      <button
                        key={cert}
                        onClick={() => setCalcCert(cert)}
                        className={`p-3 rounded-xl border text-center font-bold transition-all ${
                          calcCert === cert
                            ? "bg-primary/10 border-primary text-primary"
                            : "bg-background border-border hover:bg-muted/40 text-muted-foreground"
                        }`}
                      >
                        {cert}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hours Slider Input */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-foreground">
                      الساعات المنجزة حالياً
                    </span>
                    <span className="bg-primary/10 px-3 py-1 rounded-full text-primary font-bold">
                      {completedHours} ساعة
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={totalRequiredHours}
                    value={completedHours}
                    onChange={(e) => setCompletedHours(Number(e.target.value))}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0 ساعة</span>
                    <span>المطلوب: {totalRequiredHours} ساعة سنوياً</span>
                  </div>
                </div>

                {/* Dynamic calculation results */}
                <div className="p-5 rounded-2xl bg-muted/40 border border-border/80 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      نسبة إنجاز المتطلبات
                    </span>
                    <span className="text-sm font-bold text-foreground">
                      {Math.round((completedHours / totalRequiredHours) * 100)}%
                    </span>
                  </div>
                  <Progress
                    value={(completedHours / totalRequiredHours) * 100}
                    className="h-3.5"
                  />

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/60">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-success">
                        {completedHours}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        الساعات المنجزة
                      </div>
                    </div>
                    <div className="text-center border-r border-border/60">
                      <div className="text-2xl font-bold text-amber-600">
                        {Math.max(0, totalRequiredHours - completedHours)}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        الساعات المتبقية
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recommendation plan */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-foreground">
                    الخطة المقترحة لاستكمال ساعاتك:
                  </h4>
                  <div className="space-y-2.5">
                    {completedHours >= totalRequiredHours ? (
                      <div className="p-3.5 rounded-xl border border-success/35 bg-success/5 text-success text-center text-sm font-medium flex items-center justify-center gap-2">
                        <Check className="h-5 w-5" />
                        تهانينا! لقد استكملت جميع الساعات المطلوبة لشهادتك
                        المهنية لهذا العام.
                      </div>
                    ) : (
                      <>
                        <div className="p-3 rounded-lg border border-border bg-card flex justify-between items-center text-sm">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4.5 w-4.5 text-primary" />
                            <div>
                              <div className="font-semibold text-foreground">
                                دورة أساسيات الحوكمة
                              </div>
                              <div className="text-xs text-muted-foreground">
                                تمنحك 1.5 ساعة CPE
                              </div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                          >
                            ابدأ الآن
                          </Button>
                        </div>

                        <div className="p-3 rounded-lg border border-border bg-card flex justify-between items-center text-sm">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4.5 w-4.5 text-primary" />
                            <div>
                              <div className="font-semibold text-foreground">
                                اختبار تقييم المخاطر
                              </div>
                              <div className="text-xs text-muted-foreground">
                                يمنحك 2.0 ساعة CPE
                              </div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                          >
                            ابدأ الآن
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
