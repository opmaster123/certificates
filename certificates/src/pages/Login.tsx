import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { authService } from "@/services/auth";

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    setLoading(true);
    const res = await authService.login({ email, password });
    if (res) {
      const user = await authService.getMe();
      if (user) {
        login(user);
        toast.success("تم تسجيل الدخول بنجاح! مرحباً بك");
        navigate("/tests", { replace: true });
      }
    }
    setLoading(false);
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
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-white p-3 shadow-xl">
            <img
              src="/logo-pic-nobg.png"
              alt="خطى للتدريب والاستشارات"
              className="h-full w-full object-contain"
            />
          </div>
          <div className="mb-4">
            <span className="text-lg font-heading font-bold text-sidebar-foreground">
              خطى للتدريب والاستشارات
            </span>
          </div>
          <h1 className="text-4xl font-heading font-bold text-primary-foreground">
            مرحباً بعودتك
          </h1>
          <p className="mt-4 text-lg text-primary-foreground/70">
            أكمل رحلتك في التطوير المهني واحصل على ساعات التعليم المستمر
          </p>
        </div>
      </div>

      {/* Form Side */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden flex items-center gap-3 justify-center">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white p-1.5 shadow-sm border border-border">
              <img
                src="/logo-pic-nobg.png"
                alt="خطى للتدريب والاستشارات"
                className="h-full w-full object-contain"
              />
            </div>
            <span className="text-lg font-heading font-bold text-foreground">
              خطى للتدريب والاستشارات
            </span>
          </div>

          <h2 className="text-2xl font-heading font-bold text-foreground">
            تسجيل الدخول
          </h2>
          <p className="mt-2 text-muted-foreground">
            أدخل بياناتك للوصول إلى حسابك
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-left"
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">كلمة المرور</Label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  نسيت كلمة المرور؟
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 text-left"
                  dir="ltr"
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

            <div className="flex items-center gap-2">
              <Checkbox id="remember" />
              <Label
                htmlFor="remember"
                className="text-sm text-muted-foreground cursor-pointer"
              >
                تذكرني
              </Label>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full gradient-primary border-0 text-primary-foreground hover:opacity-90 py-5"
            >
              {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            ليس لديك حساب؟{" "}
            <Link
              to="/register"
              className="font-semibold text-primary hover:underline"
            >
              سجل الآن
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
