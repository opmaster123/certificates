import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { toast } from "sonner";
import { certificatesService } from "@/services/certificates";
import { Certificate } from "@shared/dtos-and-types/certificate";

export type CertificateTemplateProps = Partial<Certificate>;

const ENGLISH_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function getOrdinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

function formatEnglishDate(dateStr?: string | null): string {
  if (!dateStr) return "";

  let year: number;
  let monthIndex: number;
  let day: number;

  const parts = dateStr.includes("/") ? dateStr.split("/") : dateStr.split("-");
  if (parts.length === 3) {
    year = parseInt(parts[0], 10);
    monthIndex = parseInt(parts[1], 10) - 1;
    day = parseInt(parts[2].split("T")[0], 10);
  } else {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    year = d.getFullYear();
    monthIndex = d.getMonth();
    day = d.getDate();
  }

  const month = ENGLISH_MONTHS[monthIndex];
  if (!month || isNaN(day) || isNaN(year)) return dateStr;

  return `${month} ${day}${getOrdinalSuffix(day)}, ${year}`;
}

export function CertificateTemplate({
  id = "certificate-container",
  studentName,
  certType,
  courseTitle,
  englishTitle,
  arabicTitle,
  startDate,
  endDate,
  issueDate,
  certificateNumber,
  hours,
}: CertificateTemplateProps) {
  const titleText = `"${englishTitle || courseTitle}"`;

  const getTitleFontSize = (text: string) => {
    const len = text.length;
    if (len > 50) return "text-xs md:text-sm";
    if (len > 35) return "text-sm md:text-base";
    return "text-base md:text-lg";
  };

  const fontSizeClass = getTitleFontSize(titleText);
  const formattedStartDate = formatEnglishDate(startDate);
  const formattedEndDate = formatEnglishDate(endDate);

  const origin =
    typeof window !== "undefined" && window.location.origin
      ? window.location.origin
      : "http://localhost:5173";
  const certificateUrl = `${origin}/certificate/${encodeURIComponent(certificateNumber || "")}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(certificateUrl)}`;

  return (
    <motion.div
      id={id}
      dir="ltr"
      initial={{ rotateY: 10, rotateX: 5, scale: 0.98, opacity: 0 }}
      animate={{ rotateY: 0, rotateX: 0, scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100 }}
      className="w-full max-w-2xl aspect-[1.414/1] rounded-none border-[10px] border-amber-800/20 bg-stone-50 p-8 md:p-12 shadow-2xl relative flex flex-col justify-between overflow-hidden mx-auto text-left"
      style={{
        backgroundImage: "radial-gradient(circle at center, #ffffff 0%, #faf8f5 100%)",
        boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25), inset 0 0 100px rgba(139,92,26,0.03)",
      }}
    >
      {/* Elegant classic borders */}
      <div className="absolute inset-5 border border-amber-900/10 pointer-events-none" />
      <div className="absolute inset-6 border-[3px] border-amber-800/15 pointer-events-none" />

      {/* Corner ornaments */}
      <div className="absolute top-8 right-8 w-10 h-10 border-t-2 border-r-2 border-amber-700/30 pointer-events-none" />
      <div className="absolute top-8 left-8 w-10 h-10 border-t-2 border-l-2 border-amber-700/30 pointer-events-none" />
      <div className="absolute bottom-8 right-8 w-10 h-10 border-b-2 border-r-2 border-amber-700/30 pointer-events-none" />
      <div className="absolute bottom-8 left-8 w-10 h-10 border-b-2 border-l-2 border-amber-700/30 pointer-events-none" />

      {/* Top Header */}
      <div className="flex justify-between items-center z-10 w-full px-2">
        {/* Left Side: English Version (Big Text + English Slogan) */}
        <div className="flex items-center gap-3">
          <span className="font-serif text-xl md:text-2xl font-black text-amber-900 tracking-wider">
            Khutta
          </span>
          <span className="text-stone-700 font-bold text-xs md:text-sm border-l border-stone-300 pl-3">
            For Training & Consulting
          </span>
        </div>

        {/* Right Side: Arabic Version (Big Text Placeholder + Arabic Slogan) */}
        <div className="flex items-center gap-3" dir="rtl">
          <span className="font-heading text-xl md:text-2xl font-black text-amber-900 tracking-wide">
            خطى
          </span>
          <span className="text-stone-700 font-bold text-xs md:text-sm border-r border-stone-300 pr-3">
            للتدريب والاستشارات
          </span>
        </div>
      </div>

      {/* Content Body (English) */}
      <div className="text-center my-auto space-y-6 z-10">
        <h2 className="font-serif text-lg md:text-2xl font-extrabold text-primary tracking-wider uppercase">
          Certificate of Completion
        </h2>

        <div>
          <p className="text-stone-400 text-xs md:text-sm italic -mt-5">
            This certificate is proudly awarded to
          </p>
          <h3 className="font-heading font-bold text-amber-950 text-2xl md:text-3xl border-b-2 border-amber-900/15 inline-block px-12 tracking-wide">
            {studentName}
          </h3>
        </div>

        <p className="text-stone-600 text-xs md:text-sm max-w-xl mx-auto leading-relaxed">
          in recognition of their efforts in completing the training program
          <br />
          <strong
            className={`text-amber-900 font-serif font-bold block mt-1.5 mb-1.5 truncate max-w-[550px] mx-auto ${fontSizeClass}`}
          >
            {titleText}
          </strong>
          spanning from <span className="font-semibold text-stone-800">{formattedStartDate}</span>{" "}
          to <span className="font-semibold text-stone-800">{formattedEndDate}</span>, with a total
          training duration of <span className="font-semibold text-stone-800">{hours} hours</span>.
        </p>
      </div>

      {/* Footer Seal & Signature */}
      <div className="flex justify-between items-end border-t border-stone-200/80 pt-6 text-stone-600 z-10 mt-2">
        {/* Left column: Date of Issue & Training Period */}
        <div className="w-1/3 text-left space-y-1 translate-y-1">
          <div>
            <div className="text-[9px] text-stone-400">Date of Issue</div>
            <div className="text-xs font-mono text-stone-800 font-bold">{issueDate || "-"}</div>
          </div>
          <div>
            <div className="text-[9px] text-stone-400">Training Period</div>
            <div className="text-[10px] font-mono text-stone-600">
              {startDate} - {endDate}
            </div>
          </div>
        </div>

        {/* Center column: QR code */}
        <div className="w-1/3 flex flex-col items-center justify-center">
          <img
            src={qrCodeUrl}
            alt="QR Code Verification"
            crossOrigin="anonymous"
            className="w-[85px] h-[85px] border border-stone-200 rounded p-0.5 bg-white shadow-sm -mt-4"
          />
        </div>

        {/* Right column: Certificate Number */}
        <div className="w-1/3 text-right space-y-0.5 translate-y-3">
          <div className="text-[10px] text-stone-400">Certificate Number</div>
          <div className="text-xs font-mono text-stone-700 font-bold">{certificateNumber}</div>
        </div>
      </div>
    </motion.div>
  );
}

export default function CertificateView() {
  const { identifier } = useParams<{ identifier: string }>();
  const navigate = useNavigate();
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const loadedCertCodeRef = useRef<{ id?: string; code?: string } | null>(null);

  useEffect(() => {
    if (!identifier) {
      toast.error("لم يتم العثور على رمز الشهادة.");
      navigate(-1);
      return;
    }

    if (
      loadedCertCodeRef.current &&
      (loadedCertCodeRef.current.id === identifier ||
        loadedCertCodeRef.current.code === identifier)
    ) {
      return;
    }

    setLoading(true);
    certificatesService.getCertificateByIdentifier(identifier).then((data) => {
      setLoading(false);
      if (!data) {
        navigate(-1);
        return;
      }
      setCertificate(data);
      const targetCode = data.formattedCertificateNumber || data.certificateNumber;
      loadedCertCodeRef.current = {
        id: data.id,
        code: targetCode,
      };
      if (targetCode && identifier !== targetCode) {
        navigate(`/certificate/${targetCode}`, { replace: true });
      }
    });
  }, [identifier, navigate]);

  const handleDownloadPDF = async () => {
    const element = document.getElementById("certificate-container");
    if (!element) {
      toast.error("لم يتم العثور على قالب الشهادة.");
      return;
    }

    setIsGenerating(true);
    toast.info("جاري توليد ملف الـ PDF بجودة عالية...");

    try {
      // Use html-to-image to capture the exact browser rendering of RTL/Arabic text
      const imgData = await toPng(element, {
        quality: 1.0,
        pixelRatio: 5,
        cacheBust: true,
      });

      // Set up jsPDF for A4 Landscape orientation
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = 297; // A4 landscape width
      const pdfHeight = 210; // A4 landscape height

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight, undefined, "NONE");
      const exportName = certificate?.formattedCertificateNumber || certificate?.certificateNumber || identifier || "print";
      pdf.save(`cpe-certificate-${exportName}.pdf`);
      toast.success("تم تحميل الشهادة بنجاح!");
    } catch (error) {
      console.error("PDF generation failed:", error);
      toast.error("فشل في توليد ملف الـ PDF. يرجى المحاولة لاحقاً.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading || !certificate) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center text-white space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        <span className="text-stone-300 font-sans">جاري تحميل الشهادة...</span>
      </div>
    );
  }

  // Guard: User cannot access/view certificate UI if startDate, endDate or issueDate is null
  if (!certificate.startDate || !certificate.endDate || !certificate.issueDate) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center p-4 text-center" dir="rtl">
        <div className="w-full max-w-md bg-stone-900 border border-amber-500/30 rounded-2xl p-8 space-y-6 shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Loader2 className="h-8 w-8 text-amber-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-heading font-bold text-white">
              التواريخ غير محددة بعد
            </h2>
            <p className="text-sm text-stone-300 leading-relaxed font-sans">
              لا يمكن استعراض أو تحميل هذه الشهادة قبل تحديد تاريخ البدء وتاريخ الانتهاء للبرنامج التدريبي. يرجى التوجه إلى مكتبة الشهادات وتحديد التواريخ.
            </p>
          </div>
          <Button
            onClick={() => navigate("/certificates")}
            className="w-full gradient-primary border-0 text-primary-foreground font-heading font-bold py-6 rounded-xl"
          >
            الذهاب إلى مكتبة الشهادات لتحديد التواريخ
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center p-4 md:p-8 space-y-6">
      {/* Action Header */}
      <div className="w-full max-w-2xl flex justify-between items-center text-white">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-stone-400 hover:text-white transition-colors bg-transparent border-0 cursor-pointer"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
          <span>رجوع</span>
        </button>
        <Button
          onClick={handleDownloadPDF}
          disabled={isGenerating}
          variant="outline"
          className="border-stone-800 bg-stone-900 text-stone-300 hover:bg-stone-850 hover:text-white gap-2 transition-all"
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
          ) : (
            <Download className="h-4 w-4 text-amber-500" />
          )}
          <span>{isGenerating ? "جاري التجهيز..." : "تحميل الشهادة PDF"}</span>
        </Button>
      </div>

      {/* Centered Certificate Preview */}
      <div className="w-full max-w-2xl">
        <CertificateTemplate
          studentName={certificate.studentName}
          certType={certificate.certType}
          courseTitle={certificate.courseTitle}
          englishTitle={certificate.englishTitle}
          arabicTitle={certificate.arabicTitle}
          startDate={certificate.startDate}
          endDate={certificate.endDate}
          issueDate={certificate.issueDate}
          certificateNumber={certificate.formattedCertificateNumber || certificate.certificateNumber || certificate.id}
          hours={certificate.hours}
        />
      </div>
    </div>
  );
}
