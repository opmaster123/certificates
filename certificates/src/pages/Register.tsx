import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Award,
  ChevronLeft,
  ChevronRight,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { authService } from "@/services/auth";

const stepLabels = ["الحساب", "التفاصيل المهنية"];

const Register = () => {
  const [step, setStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [employer, setEmployer] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const ENGLISH_NAME_REGEX = /^[A-Za-z\s'-]+$/;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 1) {
      if (
        !firstName.trim() ||
        !lastName.trim() ||
        !email ||
        !password ||
        !confirmPassword
      ) {
        toast.error("يرجى ملء جميع الحقول المطلوبة");
        return;
      }
      if (!ENGLISH_NAME_REGEX.test(firstName.trim())) {
        toast.error("الاسم الأول يجب أن يكون بالأحرف الإنجليزية فقط");
        return;
      }
      if (!ENGLISH_NAME_REGEX.test(lastName.trim())) {
        toast.error("اسم العائلة يجب أن يكون بالأحرف الإنجليزية فقط");
        return;
      }
      if (password !== confirmPassword) {
        toast.error("كلمتا المرور غير متطابقتين");
        return;
      }
      setStep(1);
    } else {
      if (!jobTitle) {
        toast.error("المسمى الوظيفي مطلوب");
        return;
      }

      setLoading(true);
      try {
        await authService.register({
          email,
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          jobTitle,
          company: employer || undefined,
          experienceYears: experienceYears
            ? Number(experienceYears)
            : undefined,
        });
        const user = await authService.getMe();

        login(user);
        toast.success("تم إنشاء حسابك بنجاح! مرحباً بك");
      } catch (err: any) {
        toast.error(err.message || "فشل إنشاء الحساب، يرجى المحاولة مرة أخرى");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Branding Side */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 h-72 w-72 rounded-full bg-accent blur-[100px]" />
          <div className="absolute bottom-40 left-10 h-96 w-96 rounded-full bg-secondary blur-[120px]" />
        </div>
        <div className="relative text-center max-w-md">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl gradient-accent shadow-xl">
            <Award className="h-10 w-10 text-accent-foreground" />
          </div>
          <h1 className="text-4xl font-heading font-bold text-primary-foreground">
            انضم إلينا اليوم
          </h1>
          <p className="mt-4 text-lg text-primary-foreground/70">
            سجل الآن وابدأ في كسب ساعات التعليم المهني المستمر بسرعة وكفاءة
          </p>
          <div className="mt-12 grid grid-cols-3 gap-4">
            {[
              { value: "١٥ دقيقة", label: "لكل ساعة معتمدة" },
              { value: "+٣٠٠", label: "تقييم متاح" },
              { value: "٩٨%", label: "رضا المستخدمين" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-primary-foreground/10 bg-primary-foreground/5 p-4"
              >
                <div className="text-xl font-heading font-bold text-accent">
                  {s.value}
                </div>
                <div className="mt-1 text-xs text-primary-foreground/60">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Side */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden flex items-center gap-2 justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary">
              <Award className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-heading font-bold text-foreground">
              CPE منصة
            </span>
          </div>

          <h2 className="text-2xl font-heading font-bold text-foreground">
            إنشاء حساب جديد
          </h2>
          <p className="mt-2 text-muted-foreground">
            أدخل بياناتك لإنشاء حسابك
          </p>

          {/* Step Indicator */}
          <div className="mt-6 flex items-center justify-between">
            {stepLabels.map((label, i) => (
              <div key={label} className="flex items-center gap-2 flex-1">
                <div className="flex flex-col items-center gap-1 flex-1">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all ${
                      i < step
                        ? "bg-success text-success-foreground"
                        : i === step
                          ? "gradient-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {i < step ? <Check className="h-4 w-4" /> : i + 1}
                  </div>
                  <span
                    className={`text-xs ${i === step ? "text-foreground font-semibold" : "text-muted-foreground"}`}
                  >
                    {label}
                  </span>
                </div>
                {i < 1 && (
                  <div
                    className={`h-0.5 w-full mt-[-18px] ${i < step ? "bg-success" : "bg-border"}`}
                  />
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-6">
            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div
                  key="step0"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="first-name">الاسم الأول</Label>
                      <Input
                        id="first-name"
                        placeholder="الاسم الأول"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last-name">اسم العائلة</Label>
                      <Input
                        id="last-name"
                        placeholder="اسم العائلة"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-email">البريد الإلكتروني</Label>
                    <Input
                      id="reg-email"
                      type="email"
                      placeholder="example@email.com"
                      className="text-left"
                      dir="ltr"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password">كلمة المرور</Label>
                    <div className="relative">
                      <Input
                        id="reg-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-10 text-left"
                        dir="ltr"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">تأكيد كلمة المرور</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="••••••••"
                      className="text-left"
                      dir="ltr"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    {confirmPassword && confirmPassword !== password && (
                      <p className="text-xs text-destructive">
                        كلمتا المرور غير متطابقتين
                      </p>
                    )}
                  </div>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="job-title">المسمى الوظيفي</Label>
                    <Input
                      id="job-title"
                      placeholder="مثال: مدقق داخلي أول"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employer">جهة العمل / الشركة</Label>
                    <Input
                      id="employer"
                      placeholder="اسم الشركة أو المنظمة"
                      value={employer}
                      onChange={(e) => setEmployer(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="exp-years">إجمالي سنوات الخبرة</Label>
                    <Input
                      id="exp-years"
                      type="number"
                      min="0"
                      max="60"
                      placeholder="مثال: 5"
                      value={experienceYears}
                      onChange={(e) => setExperienceYears(e.target.value)}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation */}
            <div className="mt-6 flex gap-3">
              {step > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  className="flex-1"
                  disabled={loading}
                >
                  <ChevronRight className="ml-1 h-4 w-4" /> السابق
                </Button>
              )}
              <Button
                type="submit"
                className="flex-1 gradient-primary border-0 text-primary-foreground hover:opacity-90 py-5"
                disabled={loading}
              >
                {step < 1 ? (
                  <>
                    التالي <ChevronLeft className="mr-1 h-4 w-4" />
                  </>
                ) : loading ? (
                  "جاري إنشاء الحساب..."
                ) : (
                  "إنشاء الحساب"
                )}
              </Button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            لديك حساب بالفعل؟
            <Link
              to="/login"
              className="font-semibold text-primary hover:underline"
            >
              تسجيل الدخول
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
