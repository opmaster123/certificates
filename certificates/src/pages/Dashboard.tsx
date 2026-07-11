import { motion } from "framer-motion";
import type { Easing } from "framer-motion";
import { Link } from "react-router-dom";
import {
  FileText,
  BookOpen,
  BarChart3,
  User,
  Clock,
  CheckCircle,
  XCircle,
  Play,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/use-auth";

const fadeIn = {
  hidden: { opacity: 0, y: 15 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" as Easing },
  }),
};

// Circular progress component
const CircularProgress = ({
  value,
  max,
  size = 140,
}: {
  value: number;
  max: number;
  size?: number;
}) => {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (value / max) * circumference;
  const percentage = Math.round((value / max) * 100);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--secondary))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-heading font-bold text-foreground">
          {percentage}%
        </span>
        <span className="text-xs text-muted-foreground">
          {value}/{max} ساعة
        </span>
      </div>
    </div>
  );
};

const recentActivity = [
  {
    name: "أساسيات تقييم المخاطر",
    date: "٢٠٢٦/٠٢/٢٨",
    score: "٨٥%",
    hours: "١.٠",
    status: "passed",
  },
  {
    name: "الحوكمة المؤسسية",
    date: "٢٠٢٦/٠٢/٢٥",
    score: "٩٢%",
    hours: "١.٥",
    status: "passed",
  },
  {
    name: "التدقيق الداخلي المتقدم",
    date: "٢٠٢٦/٠٢/٢٠",
    score: "٦٥%",
    hours: "٠",
    status: "failed",
  },
  {
    name: "إدارة الجودة الشاملة",
    date: "٢٠٢٦/٠٢/١٥",
    score: "—",
    hours: "—",
    status: "in-progress",
  },
];

const recommendedTests = [
  {
    title: "الرقابة الداخلية",
    cert: "CIA",
    hours: "١.٠",
    difficulty: "سهل",
    color: "bg-secondary/10 text-secondary",
  },
  {
    title: "التحليل المالي",
    cert: "CMA",
    hours: "١.٥",
    difficulty: "متوسط",
    color: "bg-accent/10 text-accent",
  },
  {
    title: "إدارة المشاريع",
    cert: "CIA",
    hours: "٢.٠",
    difficulty: "صعب",
    color: "bg-destructive/10 text-destructive",
  },
  {
    title: "أخلاقيات المهنة",
    cert: "CPA",
    hours: "١.٠",
    difficulty: "سهل",
    color: "bg-primary/10 text-primary",
  },
];

const Dashboard = () => {
  const { user } = useAuth();
  const name = user ? user.firstName : "أحمد";
  const totalCpeHours = user ? user.totalCpeHours : 45;
  const certCount = user ? user.earnedCertificates?.length || 0 : 12;

  const stats = [
    {
      icon: Clock,
      label: "الساعات المكتسبة",
      value: `${totalCpeHours}`,
      sub: "من ٨٠ ساعة",
      trend: "+٣ هذا الشهر",
    },
    {
      icon: CheckCircle,
      label: "اختبارات ناجحة",
      value: `${certCount}`,
      sub: `من ${certCount} محاولة`,
      trend: "١٠٠% نسبة النجاح",
    },
    {
      icon: FileText,
      label: "شهادات صادرة",
      value: `${certCount}`,
      sub: "شهادة معتمدة",
      trend: "+٢ هذا الشهر",
    },
    {
      icon: TrendingUp,
      label: "أيام حتى التجديد",
      value: "١٢٠",
      sub: "يوم متبقي",
      trend: "٣٠ يونيو ٢٠٢٦",
    },
  ];

  return (
    <DashboardLayout>
      <motion.div initial="hidden" animate="visible" className="space-y-6">
        {/* Welcome */}
        <motion.div
          variants={fadeIn}
          custom={0}
          className="rounded-xl gradient-primary p-6 text-primary-foreground"
        >
          <h1 className="text-2xl font-heading font-bold">
            مرحباً بعودتك، {name}! 👋
          </h1>
          <p className="mt-1 text-primary-foreground/70">
            ١ مارس ٢٠٢٦ • أكمل تقدمك في ساعات التعليم المهني المستمر
          </p>
        </motion.div>

        {/* Stats Row */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              variants={fadeIn}
              custom={i + 1}
              className="rounded-xl border border-border bg-card p-5 card-hover"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-heading font-bold text-card-foreground">
                    {stat.value}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {stat.sub} • {stat.trend}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* CPE Progress */}
          <motion.div
            variants={fadeIn}
            custom={5}
            className="rounded-xl border border-border bg-card p-6"
          >
            <h3 className="text-lg font-heading font-bold text-card-foreground">
              تقدم الساعات
            </h3>
            <div className="mt-6 flex flex-col items-center">
              <CircularProgress value={totalCpeHours} max={80} />
              <p className="mt-4 text-sm text-muted-foreground">
                الموعد النهائي للتجديد: ٣٠ يونيو ٢٠٢٦
              </p>
              <Button
                asChild
                className="mt-4 gradient-secondary border-0 text-secondary-foreground hover:opacity-90"
              >
                <Link to="/tests">أكمل التعلم</Link>
              </Button>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            variants={fadeIn}
            custom={6}
            className="rounded-xl border border-border bg-card p-6 lg:col-span-2"
          >
            <h3 className="text-lg font-heading font-bold text-card-foreground mb-4">
              إجراءات سريعة
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  icon: Play,
                  label: "ابدأ اختبار جديد",
                  desc: "اختر من الاختبارات المتاحة",
                  path: "/tests",
                  gradient: "gradient-primary",
                },
                {
                  icon: BookOpen,
                  label: "عرض الشهادات",
                  desc: "حمّل شهاداتك المعتمدة",
                  path: "/certificates",
                  gradient: "gradient-secondary",
                },
                {
                  icon: BarChart3,
                  label: "تتبع التقدم",
                  desc: "اطلع على تحليلاتك",
                  path: "/profile",
                  gradient: "gradient-accent",
                },
                {
                  icon: User,
                  label: "تحديث الملف",
                  desc: "عدّل بياناتك الشخصية",
                  path: "/profile",
                  gradient: "gradient-primary",
                },
              ].map((action) => (
                <Link
                  key={action.label}
                  to={action.path}
                  className="group flex items-center gap-3 rounded-xl border border-border p-4 card-hover"
                >
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${action.gradient} text-primary-foreground`}
                  >
                    <action.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-heading font-semibold text-card-foreground text-sm">
                      {action.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {action.desc}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Recent Activity */}
        <motion.div
          variants={fadeIn}
          custom={7}
          className="rounded-xl border border-border bg-card"
        >
          <div className="flex items-center justify-between p-6 pb-4">
            <h3 className="text-lg font-heading font-bold text-card-foreground">
              النشاط الأخير
            </h3>
            <Button variant="ghost" size="sm" className="text-primary">
              عرض الكل
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-t border-border text-xs text-muted-foreground">
                  <th className="px-6 py-3 text-right font-medium">الاختبار</th>
                  <th className="px-6 py-3 text-center font-medium">التاريخ</th>
                  <th className="px-6 py-3 text-center font-medium">الدرجة</th>
                  <th className="px-6 py-3 text-center font-medium">الساعات</th>
                  <th className="px-6 py-3 text-center font-medium">الحالة</th>
                  <th className="px-6 py-3 text-center font-medium">الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.map((item, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="px-6 py-4 text-sm font-medium text-card-foreground">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-muted-foreground">
                      {item.date}
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-semibold text-card-foreground">
                      {item.score}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-card-foreground">
                      {item.hours}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge
                        variant={
                          item.status === "passed"
                            ? "default"
                            : item.status === "failed"
                              ? "destructive"
                              : "secondary"
                        }
                        className={
                          item.status === "passed"
                            ? "bg-success/10 text-success border-0"
                            : ""
                        }
                      >
                        {item.status === "passed"
                          ? "ناجح"
                          : item.status === "failed"
                            ? "راسب"
                            : "قيد التنفيذ"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary text-xs"
                      >
                        {item.status === "passed"
                          ? "عرض"
                          : item.status === "failed"
                            ? "إعادة"
                            : "متابعة"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Recommended Tests */}
        <motion.div variants={fadeIn} custom={8}>
          <h3 className="text-lg font-heading font-bold text-foreground mb-4">
            اختبارات مقترحة لك
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {recommendedTests.map((test) => (
              <div
                key={test.title}
                className="rounded-xl border border-border bg-card p-5 card-hover"
              >
                <Badge className={`${test.color} border-0 mb-3`}>
                  {test.cert}
                </Badge>
                <h4 className="font-heading font-bold text-card-foreground">
                  {test.title}
                </h4>
                <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>📚 {test.hours} ساعة</span>
                  <span>🎯 {test.difficulty}</span>
                </div>
                <Button
                  asChild
                  size="sm"
                  className="mt-4 w-full gradient-primary border-0 text-primary-foreground hover:opacity-90"
                >
                  <Link to="/tests">ابدأ</Link>
                </Button>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
};

export default Dashboard;
