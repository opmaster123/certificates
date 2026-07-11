import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Download, Eye, Pencil, QrCode, Award, X, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/DashboardLayout";
import { certificatesService } from "@/services/certificates";
import { paymentsService } from "@/services/payments";
import { useAuth } from "@/hooks/use-auth";
import type { Certificate } from "@shared/dtos-and-types";
import { CertificateDateModal } from "@/components/CustomDatePicker";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import JSZip from "jszip";
import { CertificateTemplate } from "./CertificateView";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

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
        badge: "bg-purple-500/10 text-purple-600 border-purple-500/20",
        glow: "hover:shadow-[0_0_25px_rgba(168,85,247,0.2)] hover:border-purple-500/30",
        headerBg: "bg-gradient-to-br from-purple-950 via-purple-900 to-black",
      };
    case "CISA":
      return {
        badge: "bg-rose-500/10 text-rose-600 border-rose-500/20",
        glow: "hover:shadow-[0_0_25px_rgba(244,63,94,0.2)] hover:border-rose-500/30",
        headerBg: "bg-gradient-to-br from-rose-950 via-rose-900 to-black",
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
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { refreshUser } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeChips, setActiveChips] = useState<Set<string>>(new Set());
  const [selectedCertForEdit, setSelectedCertForEdit] = useState<Certificate | null>(null);
  const [unassignedCount, setUnassignedCount] = useState<number>(0);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [printCertificate, setPrintCertificate] = useState<Certificate | null>(null);

  // Handle Paymob redirect callback
  useEffect(() => {
    const txId = searchParams.get("id") || searchParams.get("transaction_id");
    const isSuccess = searchParams.get("success") === "true";

    if (txId && isSuccess) {
      const confirmPaymentOnRedirect = async () => {
        try {
          const res = await paymentsService.confirm({
            transactionId: txId,
          });
          if (res?.success) {
            toast({
              title: "تم الدفع وتفعيل الشهادات بنجاح!",
              description: `تم إصدار ${res.count} شهادات واحتساب ساعات الـ CPE في حسابك بنجاح.`,
            });
            await refreshUser();
            await fetchCertificates(1, true);
          }
        } catch {
          // Ignore error silently
        } finally {
          setSearchParams({}, { replace: true });
        }
      };

      confirmPaymentOnRedirect();
    }
  }, [searchParams]);

  const fetchCertificates = async (pageToFetch: number, isInitial = false) => {
    if (isInitial) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    const certParam = Array.from(activeChips).join(",");
    const res = await certificatesService.getMyCertificates({
      page: pageToFetch,
      cert: certParam || undefined,
    });

    const data: Certificate[] = res?.items || res?.data || (Array.isArray(res) ? res : []);
    const more = res?.hasMore ?? false;
    if (res?.unassignedCount !== undefined) {
      setUnassignedCount(res.unassignedCount);
    } else {
      const missingCount = data.filter((c) => !c.startDate || !c.endDate || !c.issueDate).length;
      setUnassignedCount(missingCount);
    }

    if (isInitial) {
      setCertificates(data);
    } else {
      setCertificates((prev) => {
        const existingIds = new Set(prev.map((c) => c.id));
        const newItems = data.filter((c) => !existingIds.has(c.id));
        return [...prev, ...newItems];
      });
    }

    setHasMore(more);
    setPage(pageToFetch);
    setLoading(false);
    setLoadingMore(false);
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

  const openEditModal = (cert: Certificate) => {
    if (cert.startDate && cert.endDate && cert.issueDate) {
      toast({
        title: "التواريخ مثبتة",
        description: "تم تثبيت تواريخ هذه الشهادة مسبقاً ولا يمكن تعديلها نهائياً.",
      });
      return;
    }
    setSelectedCertForEdit(cert);
  };

  const hasAnyCertWithoutDates =
    unassignedCount > 0 ||
    (certificates.length > 0 &&
      certificates.some((c) => !c.startDate || !c.endDate || !c.issueDate));

  const isDownloadDisabled =
    isDownloadingAll ||
    loading ||
    certificates.length === 0 ||
    hasAnyCertWithoutDates;

  const handleDownloadAll = async () => {
    if (isDownloadDisabled) return;

    if (hasAnyCertWithoutDates) {
      toast({
        title: "تحديد التواريخ مطلوب",
        description: "يجب تحديد وتثبيت تواريخ البدء والانتهاء لجميع الشهادات أولاً لتتمكن من تحميل الكل.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsDownloadingAll(true);
      setDownloadProgress({ current: 0, total: 0 });

      // Fetch all user acquired certificates (matching current filters if any)
      const certParam = activeChips.size > 0 ? Array.from(activeChips).join(",") : undefined;
      const allCerts = await certificatesService.getAllMyCertificates(certParam);

      if (!allCerts || allCerts.length === 0) {
        toast({
          title: "لا توجد شهادات",
          description: "لم يتم العثور على شهادات مصدرة في حسابك للتحميل.",
          variant: "destructive",
        });
        setIsDownloadingAll(false);
        setDownloadProgress(null);
        return;
      }

      const hasUnassignedInBulk = allCerts.some(
        (c) => !c.startDate || !c.endDate || !c.issueDate,
      );
      if (hasUnassignedInBulk) {
        toast({
          title: "تحديد التواريخ مطلوب",
          description:
            "يوجد شهادات لم يتم تحديد تواريخها بعد. يجب تحديد تواريخ جميع الشهادات لتفعيل التحميل.",
          variant: "destructive",
        });
        setIsDownloadingAll(false);
        setDownloadProgress(null);
        return;
      }

      const total = allCerts.length;
      setDownloadProgress({ current: 0, total });

      const zip = new JSZip();
      const pdfWidth = 297;
      const pdfHeight = 210;

      for (let i = 0; i < total; i++) {
        const cert = allCerts[i];
        setDownloadProgress({ current: i + 1, total });
        setPrintCertificate(cert);

        // Allow React state & DOM to render the certificate template
        await new Promise((resolve) => setTimeout(resolve, 300));

        const element = document.getElementById("certificate-bulk-print-target");
        if (element) {
          try {
            const imgData = await toPng(element, {
              quality: 0.98,
              pixelRatio: 3,
              cacheBust: true,
              imagePlaceholder:
                "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
            });

            // Create individual single-page PDF for THIS specific certificate
            const singlePdf = new jsPDF({
              orientation: "landscape",
              unit: "mm",
              format: "a4",
            });
            singlePdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight, undefined, "NONE");

            const rawNumber = cert.formattedCertificateNumber || cert.certificateNumber || cert.id;
            const certCode = rawNumber.replace(/[/\\?%*:|"<>]/g, "_");
            const certType = (cert.certType || "CPE").replace(/[/\\?%*:|"<>]/g, "_");
            const singlePdfName = `cpe-certificate-${certType}-${certCode}.pdf`;

            const pdfBlob = singlePdf.output("blob");
            zip.file(singlePdfName, pdfBlob);
          } catch {
            // Keep going if a single certificate rendering issues a warning
          }
        }
      }

      // Generate the ZIP folder containing all individual certificate PDFs
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const dateStr = new Date().toISOString().split("T")[0];
      const zipFileName = `khutta-cpe-certificates-${dateStr}.zip`;

      const downloadUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = zipFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      toast({
        title: "تم التحميل بنجاح!",
        description: `تم تنزيل مجلد يحتوي على ${total} شهادة بصيغة PDF مستقلة.`,
      });
    } catch {
      toast({
        title: "خطأ في التحميل",
        description: "حدث خطأ غير متوقع أثناء تجهيز الشهادات للتحميل. يرجى المحاولة لاحقاً.",
        variant: "destructive",
      });
    } finally {
      setIsDownloadingAll(false);
      setDownloadProgress(null);
      setPrintCertificate(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 text-right" dir="rtl">
        <div data-tour="certificates-header" className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">
              مكتبة الشهادات
            </h1>
            <p className="mt-1 text-muted-foreground">
              جميع شهاداتك المعتمدة في مكان واحد
            </p>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-block">
                  <Button
                    onClick={handleDownloadAll}
                    disabled={isDownloadDisabled}
                    className={`gradient-primary border-0 text-primary-foreground font-heading font-medium shadow-md shadow-primary/20 ${
                      isDownloadDisabled && !isDownloadingAll
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:opacity-90"
                    }`}
                  >
                    {isDownloadingAll ? (
                      <>
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        {downloadProgress && downloadProgress.total > 0
                          ? `جاري التحميل... (${downloadProgress.current}/${downloadProgress.total})`
                          : "جاري التحضير..."}
                      </>
                    ) : hasAnyCertWithoutDates && certificates.length > 0 ? (
                      <>
                        <Lock className="ml-2 h-4 w-4" /> تحميل الكل
                      </>
                    ) : (
                      <>
                        <Download className="ml-2 h-4 w-4" /> تحميل الكل
                      </>
                    )}
                  </Button>
                </span>
              </TooltipTrigger>
              {hasAnyCertWithoutDates && certificates.length > 0 && (
                <TooltipContent side="bottom" className="text-right max-w-xs font-sans text-xs">
                  <p>يجب تحديد تواريخ البدء والانتهاء لجميع الشهادات أولاً لتفعيل ميزة تحميل الكل.</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
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
            certificates.map((cert, index) => {
              const styles = getCertStyles(cert.certType);
              const hasDates = !!cert.startDate && !!cert.endDate && !!cert.issueDate;
              return (
                <div
                  key={cert.id}
                  data-tour={index === 0 ? "cert-card-first" : undefined}
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
                        {cert.certType}
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
                        {cert.certType}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-sans flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        {cert.hours} ساعة معتمدة
                      </span>
                    </div>

                    <h3 className="font-heading font-bold text-card-foreground text-base mb-4 group-hover:text-primary transition-colors">
                      {cert.arabicTitle || cert.courseTitle || cert.englishTitle}
                    </h3>

                    {/* Grid-based metadata layout */}
                    <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/40 border border-border/60 text-[11px]">
                      <div className="space-y-1">
                        <span className="text-muted-foreground block">
                          رقم الشهادة
                        </span>
                        <span className="font-mono font-medium text-foreground">
                          {cert.formattedCertificateNumber || cert.certificateNumber || cert.id}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground block">
                          تاريخ الإصدار
                        </span>
                        {cert.issueDate ? (
                          <span className="font-medium text-foreground font-mono text-[10px] block">
                            {cert.issueDate}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                      <div className="col-span-2 space-y-1 pt-1 border-t border-border/40">
                        <span className="text-muted-foreground block">
                          الفترة التدريبية
                        </span>
                        {cert.startDate && cert.endDate ? (
                          <span className="font-medium text-foreground font-mono text-[10px] block">
                            {cert.startDate} - {cert.endDate}
                          </span>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[9px] px-1.5 py-0 border-amber-500/30 text-amber-600 bg-amber-500/10 font-sans"
                          >
                            بانتظار تحديد التواريخ
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div
                      data-tour={index === 0 ? "cert-actions-group" : undefined}
                      className="mt-5 flex gap-2"
                    >
                      <Button
                        size="sm"
                        variant={hasDates ? "outline" : "ghost"}
                        disabled={!hasDates}
                        onClick={() =>
                          navigate(
                            `/certificate/${cert.formattedCertificateNumber || cert.certificateNumber || cert.id}`,
                          )
                        }
                        className={`flex-1 transition-all ${
                          hasDates
                            ? "hover:bg-primary hover:text-primary-foreground hover:border-primary font-bold"
                            : "opacity-40 cursor-not-allowed text-muted-foreground"
                        }`}
                      >
                        <Eye className="ml-1 h-3.5 w-3.5" /> عرض
                      </Button>

                      <Button
                        data-tour={index === 0 ? "cert-dates-btn" : undefined}
                        size="sm"
                        variant="outline"
                        disabled={hasDates}
                        onClick={() => openEditModal(cert)}
                        className={`flex-1 transition-all ${
                          hasDates
                            ? "border-border/50 text-muted-foreground opacity-60 cursor-not-allowed"
                            : "border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground font-bold"
                        }`}
                      >
                        {hasDates ? (
                          <>
                            <Lock className="ml-1 h-3.5 w-3.5" /> التواريخ مثبتة
                          </>
                        ) : (
                          <>
                            <Pencil className="ml-1 h-3.5 w-3.5" /> تحديد التواريخ
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-16 text-muted-foreground bg-card border border-border rounded-xl space-y-3">
              <Award className="mx-auto h-12 w-12 text-muted-foreground/40" />
              <p className="text-base font-semibold text-foreground">لا توجد لديك شهادات مصدرة حالياً</p>
              <p className="text-sm font-sans text-muted-foreground">
                {activeChips.size > 0
                  ? "لا توجد شهادات مطابقة للتصنيفات المحددة."
                  : "لم يتم إصدار أي شهادات بعد. قم بإكمال اختباراتك ودفع الرسوم لتظهر شهاداتك هنا."}
              </p>
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

        {/* Edit Dates Modal */}
        <CertificateDateModal
          certificate={selectedCertForEdit}
          open={!!selectedCertForEdit}
          onOpenChange={(open) => !open && setSelectedCertForEdit(null)}
          onSuccess={(updated) => {
            setCertificates((prev) =>
              prev.map((c) =>
                c.id === updated.id
                  ? {
                      ...c,
                      startDate: updated.startDate,
                      endDate: updated.endDate,
                      issueDate: updated.issueDate,
                    }
                  : c,
              ),
            );
            setUnassignedCount((prev) => Math.max(0, prev - 1));
          }}
        />

        {/* Bulk Download Progress Modal */}
        <Dialog open={isDownloadingAll}>
          <DialogContent
            className="sm:max-w-md text-right"
            dir="rtl"
            onInteractOutside={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-foreground font-heading">
                <Download className="h-5 w-5 text-primary animate-bounce" />
                جاري تجهيز وتنزيل جميع الشهادات
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-sm">
                يتم الآن إنشاء وتجهيز ملف PDF مستقل لكل شهادة من شهاداتك المعتمدة...
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Progress
                value={
                  downloadProgress && downloadProgress.total > 0
                    ? (downloadProgress.current / downloadProgress.total) * 100
                    : 0
                }
              />
              <div className="flex justify-between items-center text-xs text-muted-foreground font-sans">
                <span>
                  {downloadProgress && downloadProgress.total > 0
                    ? `جاري تحويل الشهادة ${downloadProgress.current} من ${downloadProgress.total} إلى PDF...`
                    : "جاري تجهيز الشهادات..."}
                </span>
                <span>
                  {downloadProgress && downloadProgress.total > 0
                    ? `${Math.round((downloadProgress.current / downloadProgress.total) * 100)}%`
                    : "0%"}
                </span>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Hidden Bulk Print Rendering Container */}
        {printCertificate && (
          <div
            aria-hidden="true"
            style={{
              position: "fixed",
              left: "-9999px",
              top: 0,
              width: "672px",
              zIndex: -100,
              pointerEvents: "none",
            }}
          >
            <div className="w-full max-w-2xl">
              <CertificateTemplate
                id="certificate-bulk-print-target"
                studentName={printCertificate.studentName}
                certType={printCertificate.certType}
                courseTitle={printCertificate.courseTitle}
                englishTitle={printCertificate.englishTitle}
                arabicTitle={printCertificate.arabicTitle}
                startDate={printCertificate.startDate}
                endDate={printCertificate.endDate}
                issueDate={printCertificate.issueDate}
                certificateNumber={
                  printCertificate.formattedCertificateNumber ||
                  printCertificate.certificateNumber ||
                  printCertificate.id
                }
                hours={printCertificate.hours}
                animate={false}
              />
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Certificates;
