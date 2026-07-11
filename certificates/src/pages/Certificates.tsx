import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Download, Eye, Pencil, QrCode, Award, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/DashboardLayout";
import { certificatesService } from "@/services/certificates";

const chipFilters = ["CIA", "CMA", "CPA", "CFE", "CISA"];

const getCertStyles = (certType: string) => {
  switch (certType) {
    case "CIA":
      return {
        badge: "bg-amber-500/10 text-amber-600 border-amber-500/20",
        glow: "hover:shadow-[0_0_25px_rgba(245,158,11,0.2)] hover:border-amber-500/30",
        headerBg: "bg-gradient-to-br from-amber-950 via-amber-900 to-black",
      };
    case "CMA":
      return {
        badge: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
        glow: "hover:shadow-[0_0_25px_rgba(16,185,129,0.2)] hover:border-emerald-500/30",
        headerBg: "bg-gradient-to-br from-emerald-950 via-emerald-900 to-black",
      };
    case "CPA":
      return {
        badge: "bg-blue-500/10 text-blue-600 border-blue-500/20",
        glow: "hover:shadow-[0_0_25px_rgba(59,130,246,0.2)] hover:border-blue-500/30",
        headerBg: "bg-gradient-to-br from-blue-950 via-blue-900 to-black",
      };
    case "CFE":
      return {
        badge: "bg-rose-500/10 text-rose-600 border-rose-500/20",
        glow: "hover:shadow-[0_0_25px_rgba(244,63,94,0.2)] hover:border-rose-500/30",
        headerBg: "bg-gradient-to-br from-rose-950 via-rose-900 to-black",
      };
    case "CISA":
      return {
        badge: "bg-purple-500/10 text-purple-600 border-purple-500/20",
        glow: "hover:shadow-[0_0_25px_rgba(168,85,247,0.2)] hover:border-purple-500/30",
        headerBg: "bg-gradient-to-br from-purple-950 via-purple-900 to-black",
      };
    default:
      return {
        badge: "bg-slate-500/10 text-slate-600 border-slate-500/20",
        glow: "hover:shadow-[0_0_25px_rgba(148,163,184,0.2)] hover:border-slate-500/30",
        headerBg: "bg-gradient-to-br from-slate-950 via-slate-900 to-black",
      };
  }
};

const Certificates = () => {
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeChips, setActiveChips] = useState<Set<string>>(new Set());

  const fetchCertificates = async (pageToFetch: number, isInitial = false) => {
    if (isInitial) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const certParam = Array.from(activeChips).join(",");
      const res = await certificatesService.getMyCertificates({
        page: pageToFetch,
        cert: certParam || undefined,
      });

      const data = res.items || res.data || (Array.isArray(res) ? res : []);
      const more = res.hasMore ?? false;

      // Map backend properties to UI properties
      const mapped = data.map((cert: any) => ({
        id:
          cert.formattedCertificateNumber ||
          cert.certificateNumber ||
          cert.id,
        title: cert.courseTitle,
        englishTitle: cert.englishTitle,
        arabicTitle: cert.arabicTitle,
        cert: cert.certType,
        date: cert.issueDate,
        hours: cert.hours,
      }));

      if (isInitial) {
        setCertificates(mapped);
      } else {
        setCertificates((prev) => {
          const existingIds = new Set(prev.map((c: any) => c.id));
          const newItems = mapped.filter((c: any) => !existingIds.has(c.id));
          return [...prev, ...newItems];
        });
      }

      setHasMore(more);
      setPage(pageToFetch);
    } catch (err) {
      console.error("Error loading certificates:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchCertificates(1, true);
  }, [activeChips]);

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;
    fetchCertificates(page + 1, false);
  };

  const toggleChip = (chip: string) => {
    setActiveChips((prev) => {
      const next = new Set(prev);
      next.has(chip) ? next.delete(chip) : next.add(chip);
      return next;
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">
              مكتبة الشهادات
            </h1>
            <p className="mt-1 text-muted-foreground">
              جميع شهاداتك المعتمدة في مكان واحد
            </p>
          </div>
          <Button className="gradient-primary border-0 text-primary-foreground hover:opacity-90">
            <Download className="ml-2 h-4 w-4" /> تحميل الكل
          </Button>
        </div>

        {/* Chip Filters */}
        <div className="flex flex-wrap gap-2">
          {chipFilters.map((chip) => (
            <button
              key={chip}
              onClick={() => toggleChip(chip)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all border duration-200 ${
                activeChips.has(chip)
                  ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/15"
                  : "bg-card text-muted-foreground border-border hover:border-primary/50"
              }`}
            >
              {chip}
              {activeChips.has(chip) && <X className="inline h-3 w-3 mr-1.5" />}
            </button>
          ))}
          {activeChips.size > 0 && (
            <button
              onClick={() => setActiveChips(new Set())}
              className="text-sm text-destructive hover:underline px-2 transition-all"
            >
              مسح الكل
            </button>
          )}
        </div>

        {/* Certificates Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-card overflow-hidden animate-pulse"
              >
                {/* Header Skeleton */}
                <div className="bg-muted/80 h-40 flex items-center justify-center relative border-b border-border/40">
                  <div className="absolute top-4 left-4 bg-muted-foreground/15 h-7 w-7 rounded-lg" />
                  <div className="h-16 w-16 rounded-2xl bg-muted-foreground/15" />
                </div>
                {/* Info Body Skeleton */}
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-5 w-12 rounded bg-muted-foreground/20" />
                    <div className="h-4 w-20 rounded bg-muted-foreground/20" />
                  </div>
                  <div className="h-6 w-3/4 rounded bg-muted-foreground/20" />
                  {/* Metadata Grid Skeleton */}
                  <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/40 border border-border/40">
                    <div className="space-y-2">
                      <div className="h-3 w-10 rounded bg-muted-foreground/15" />
                      <div className="h-4 w-16 rounded bg-muted-foreground/15" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 w-10 rounded bg-muted-foreground/15" />
                      <div className="h-4 w-16 rounded bg-muted-foreground/15" />
                    </div>
                  </div>
                  {/* Action Buttons Skeleton */}
                  <div className="flex gap-2">
                    <div className="flex-1 h-9 rounded bg-muted-foreground/15" />
                    <div className="flex-1 h-9 rounded bg-muted-foreground/15" />
                  </div>
                </div>
              </div>
            ))
          ) : certificates.length > 0 ? (
            certificates.map((cert) => {
              const styles = getCertStyles(cert.cert);
              return (
                <div
                  key={cert.id}
                  className={`group rounded-xl border border-border bg-card overflow-hidden transition-all duration-300 transform hover:-translate-y-1.5 ${styles.glow}`}
                >
                  {/* Glassmorphic Floating Badge Header */}
                  <div
                    className={`relative ${styles.headerBg} p-6 h-40 flex items-center justify-center overflow-hidden border-b border-border/40`}
                  >
                    {/* Decorative Mesh Circles */}
                    <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-white/20 blur-xl pointer-events-none" />
                    <div className="absolute -left-8 -bottom-8 w-24 h-24 rounded-full bg-black/20 blur-xl pointer-events-none" />

                    {/* Subtle inner boundary frame */}
                    <div className="absolute inset-2.5 border border-white/10 rounded-xl pointer-events-none" />

                    {/* Verification QR Container in top-left */}
                    <div className="absolute top-4 left-4 bg-white/10 p-1.5 rounded-lg border border-white/10 backdrop-blur-sm shadow-sm">
                      <QrCode className="h-4 w-4 text-white/70 group-hover:text-white transition-colors" />
                    </div>

                    {/* Floating Glassmorphic Badge */}
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-white/25 bg-white/10 backdrop-blur-md shadow-lg shadow-black/10 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                      <Award className="absolute -top-2.5 -right-2.5 h-6 w-6 text-yellow-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]" />
                      <span className="font-heading font-black text-white text-lg tracking-wider">
                        {cert.cert}
                      </span>
                    </div>

                    <span className="absolute bottom-3 right-4 text-[9px] uppercase tracking-widest text-white/70 font-semibold">
                      عضوية معتمدة
                    </span>
                  </div>

                  {/* Info Body */}
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="outline" className={`${styles.badge}`}>
                        {cert.cert}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-sans flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        {cert.hours} ساعة معتمدة
                      </span>
                    </div>

                    <h3 className="font-heading font-bold text-card-foreground text-base mb-4 group-hover:text-primary transition-colors">
                      {cert.arabicTitle || cert.title}
                    </h3>

                    {/* Grid-based metadata layout */}
                    <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/40 border border-border/60 text-[11px]">
                      <div className="space-y-1">
                        <span className="text-muted-foreground block">
                          رقم الشهادة
                        </span>
                        <span className="font-mono font-medium text-foreground">
                          {cert.id}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground block">
                          تاريخ الإصدار
                        </span>
                        <span className="font-medium text-foreground">
                          {cert.date}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-5 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/certificate/${cert.id}`)}
                        className="flex-1 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
                      >
                        <Eye className="ml-1 h-3.5 w-3.5" /> عرض
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
                      >
                        <Pencil className="ml-1 h-3.5 w-3.5" /> تعديل
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-12 text-muted-foreground bg-card border border-border rounded-xl">
              لا توجد شهادات مطابقة للفلاتر المحددة.
            </div>
          )}
        </motion.div>

        {/* Show More Button */}
        {hasMore && !loading && (
          <div className="flex justify-center pt-8 pb-4">
            <Button
              onClick={handleLoadMore}
              disabled={loadingMore}
              variant="outline"
              className="px-8 py-6 rounded-xl border-primary/30 hover:border-primary text-primary hover:bg-primary/5 font-heading font-bold text-sm shadow-sm transition-all duration-200"
            >
              {loadingMore ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span>جاري تحميل المزيد...</span>
                </div>
              ) : (
                <span>أظهر المزيد</span>
              )}
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Certificates;
