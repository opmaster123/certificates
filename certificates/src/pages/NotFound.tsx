import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Award, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary">
          <Award className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="text-7xl font-heading font-bold text-primary">٤٠٤</h1>
        <p className="mt-4 text-xl font-heading font-bold text-foreground">الصفحة غير موجودة</p>
        <p className="mt-2 text-muted-foreground">عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.</p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild className="gradient-primary border-0 text-primary-foreground hover:opacity-90">
            <Link to="/"><Home className="ml-2 h-4 w-4" /> الصفحة الرئيسية</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/dashboard"><ArrowLeft className="ml-2 h-4 w-4" /> لوحة التحكم</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
