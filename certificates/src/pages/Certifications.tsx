import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { BookOpen, CheckCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DashboardLayout from "@/components/DashboardLayout";

const tracks = [
  {
    id: "cia",
    name: "CIA - المدقق الداخلي المعتمد",
    desc: "برنامج شامل في التدقيق الداخلي يغطي أساسيات التدقيق والرقابة وإدارة المخاطر والحوكمة",
    tests: 15,
    hours: 20,
    passing: "٧٠%",
    progress: 45,
    status: "in-progress" as const,
  },
  {
    id: "cma",
    name: "CMA - المحاسب الإداري المعتمد",
    desc: "برنامج متخصص في المحاسبة الإدارية والتحليل المالي واتخاذ القرارات الاستراتيجية",
    tests: 12,
    hours: 18,
    passing: "٧٥%",
    progress: 20,
    status: "in-progress" as const,
  },
  {
    id: "cpa",
    name: "CPA - المحاسب القانوني المعتمد",
    desc: "برنامج شامل في المحاسبة القانونية والمراجعة والضرائب والتشريعات المالية",
    tests: 10,
    hours: 15,
    passing: "٨٠%",
    progress: 0,
    status: "not-started" as const,
  },
  {
    id: "acca",
    name: "ACCA - جمعية المحاسبين القانونيين المعتمدين",
    desc: "برنامج دولي في المحاسبة والمالية معترف به عالمياً",
    tests: 8,
    hours: 12,
    passing: "٧٠%",
    progress: 100,
    status: "completed" as const,
  },
];

const Certifications = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            اختر مسار الشهادة
          </h1>
          <p className="mt-1 text-muted-foreground">
            حدد المسار المهني الذي تريد تطويره
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <Select>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="جميع الشهادات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الشهادات</SelectItem>
              <SelectItem value="cia">CIA</SelectItem>
              <SelectItem value="cma">CMA</SelectItem>
              <SelectItem value="cpa">CPA</SelectItem>
              <SelectItem value="acca">ACCA</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="أي مستوى" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">أي مستوى</SelectItem>
              <SelectItem value="easy">سهل</SelectItem>
              <SelectItem value="medium">متوسط</SelectItem>
              <SelectItem value="hard">صعب</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="بحث عن مسار..." className="pr-10" />
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid gap-5 md:grid-cols-2"
        >
          {tracks.map((track) => (
            <div
              key={track.id}
              className="rounded-xl border border-border bg-card overflow-hidden card-hover"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  {track.status === "completed" && (
                    <Badge className="bg-success/10 text-success border-0">
                      <CheckCircle className="h-3 w-3 ml-1" /> مكتمل
                    </Badge>
                  )}
                  {track.status === "in-progress" && (
                    <Badge className="bg-accent/10 text-accent border-0">
                      قيد التقدم
                    </Badge>
                  )}
                </div>
                <h3 className="font-heading font-bold text-card-foreground text-lg">
                  {track.name}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                  {track.desc}
                </p>

                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-lg bg-muted/50 p-2">
                    <div className="text-lg font-heading font-bold text-card-foreground">
                      {track.tests}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      اختبار
                    </div>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2">
                    <div className="text-lg font-heading font-bold text-card-foreground">
                      {track.hours}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      ساعة CPE
                    </div>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2">
                    <div className="text-lg font-heading font-bold text-card-foreground">
                      {track.passing}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      درجة النجاح
                    </div>
                  </div>
                </div>

                {track.progress > 0 && (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>التقدم</span>
                      <span>{track.progress}%</span>
                    </div>
                    <Progress value={track.progress} className="h-2" />
                  </div>
                )}
              </div>

              <div className="border-t border-border p-4">
                <Button
                  asChild
                  className={`w-full ${track.status === "completed" ? "" : "gradient-primary border-0 text-primary-foreground hover:opacity-90"}`}
                  variant={track.status === "completed" ? "outline" : "default"}
                >
                  <Link to="/tests">
                    {track.status === "not-started"
                      ? "ابدأ المسار"
                      : track.status === "in-progress"
                        ? "أكمل المسار"
                        : "عرض الشهادات"}
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Certifications;
