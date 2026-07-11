import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Award,
  FileText,
  BookOpen,
  User,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";

const navItems = [
  // { icon: LayoutDashboard, label: "لوحة التحكم", path: "/dashboard" },
  // { icon: Award, label: "شهاداتي", path: "/certifications" },
  { icon: FileText, label: "الاختبارات", path: "/tests" },
  { icon: BookOpen, label: "شهاداتي", path: "/certificates" },
  // { icon: Sparkles, label: "جرب المنصة", path: "/trial" },
  { icon: User, label: "الملف", path: "/profile" },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  const userName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();
  const userInitials =
    `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase();

  return (
    <div className="flex min-h-screen bg-background" dir="rtl">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-64 transform gradient-hero transition-transform duration-300 lg:relative lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex items-center justify-between p-5 border-b border-sidebar-border">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-accent">
                <Award className="h-5 w-5 text-accent-foreground" />
              </div>
              <span className="text-lg font-heading font-bold text-sidebar-foreground">
                خطى للتدريب والاستشارات
              </span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-sidebar-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User */}
          <div className="p-5 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={userName}
                  className="h-10 w-10 rounded-full object-cover border border-sidebar-accent"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground font-heading font-bold">
                  {userInitials}
                </div>
              )}
              <div>
                <div className="text-sm font-semibold text-sidebar-foreground">
                  {userName}
                </div>
                <div className="text-xs text-sidebar-foreground/60">
                  {user?.jobTitle}
                </div>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-3 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors ${
                    isActive
                      ? "bg-sidebar-accent text-sidebar-primary font-semibold"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* CPE Progress Mini */}
          <div className="p-4 mx-3 mb-3 rounded-xl bg-sidebar-accent/30">
            <div className="flex justify-between text-xs text-sidebar-foreground/70 mb-1">
              <span>تقدم الساعات</span>
              <span>٤٥/٨٠</span>
            </div>
            <div className="h-2 rounded-full bg-sidebar-accent">
              <div
                className="h-2 rounded-full bg-accent"
                style={{ width: "56%" }}
              />
            </div>
            <p className="text-[10px] text-sidebar-foreground/50 mt-1">
              ١٢٠ يوم حتى التجديد
            </p>
          </div>

          {/* Logout */}
          <div className="p-3 border-t border-sidebar-border">
            <button
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
            >
              <LogOut className="h-5 w-5" />
              تسجيل الخروج
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex flex-1 flex-col">
        {/* Top Bar - to be removed*/}
        <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-border bg-background/80 backdrop-blur-md px-4 py-3 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-foreground"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث عن اختبارات، شهادات..."
                className="pr-10 bg-muted/50 border-0"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-0.5 -left-0.5 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center">
                ٣
              </span>
            </Button>
            <div className="hidden sm:flex h-9 w-9 items-center justify-center rounded-full gradient-primary text-primary-foreground font-heading font-bold text-sm">
              {userInitials}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6">{children}</main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-md lg:hidden">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors min-w-[56px] ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <item.icon
                  className={`h-5 w-5 ${isActive ? "text-primary" : ""}`}
                />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default DashboardLayout;
