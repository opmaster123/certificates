import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import CertificateTemplate from "@/components/CertificateTemplate";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { toast } from "sonner";
import { certificatesService } from "@/services/certificates";
import { Certificate } from "@shared/dtos-and-types/certificate";

export default function CertificateView() {
  const { identifier } = useParams<{ identifier: string }>();
  const navigate = useNavigate();
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!identifier) {
      toast.error("لم يتم العثور على رمز الشهادة.");
      navigate(-1);
      return;
    }

    setLoading(true);
    certificatesService.getCertificateByIdentifier(identifier)
      .then((data) => {
        setCertificate(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading certificate:", err);
        toast.error("الشهادة المطلوبة غير موجودة أو انتهت صلاحيتها.");
        navigate(-1); // Navigate back to the previous page
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
      pdf.save(`cpe-certificate-${identifier || "print"}.pdf`);
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
          issueDate={certificate.issueDate}
          certificateNumber={certificate.formattedCertificateNumber || certificate.certificateNumber || certificate.id}
          hours={certificate.hours}
        />
      </div>
    </div>
  );
}
