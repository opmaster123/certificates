import { Award } from "lucide-react";
import { motion } from "framer-motion";

interface CertificateTemplateProps {
  id?: string;
  studentName?: string;
  certType?: string;
  courseTitle?: string;
  englishTitle?: string;
  arabicTitle?: string;
  issueDate?: string;
  certificateNumber?: string;
  authorityName?: string;
  hours?: string;
}

export default function CertificateTemplate({
  id = "certificate-container",
  studentName = "ahmed mohammed",
  certType = "CIA",
  courseTitle = "Interim financial reporting",
  englishTitle = "Interim financial reporting",
  arabicTitle = "التقارير المالية المرحلية",
  issueDate = "2026/06/05",
  certificateNumber = "CPE-9942-X",
  authorityName = "CPE Platform",
  hours = "30",
}: CertificateTemplateProps) {
  const titleText = `"${englishTitle || courseTitle}"`;
  
  const getTitleFontSize = (text: string) => {
    const len = text.length;
    if (len > 50) return "text-xs md:text-sm";
    if (len > 35) return "text-sm md:text-base";
    return "text-base md:text-lg";
  };

  const fontSizeClass = getTitleFontSize(titleText);

  return (
    <motion.div
      id={id}
      dir="ltr"
      initial={{ rotateY: 10, rotateX: 5, scale: 0.98, opacity: 0 }}
      animate={{ rotateY: 0, rotateX: 0, scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100 }}
      className="w-full max-w-2xl aspect-[1.414/1] rounded-none border-[10px] border-amber-800/20 bg-stone-50 p-8 md:p-12 shadow-2xl relative flex flex-col justify-between overflow-hidden mx-auto text-left"
      style={{
        backgroundImage:
          "radial-gradient(circle at center, #ffffff 0%, #faf8f5 100%)",
        boxShadow:
          "0 25px 50px -12px rgba(0,0,0,0.25), inset 0 0 100px rgba(139,92,26,0.03)",
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
          <strong className={`text-amber-900 font-serif font-bold block mt-1.5 mb-1.5 truncate max-w-[550px] mx-auto ${fontSizeClass}`}>
            {titleText}
          </strong>
          spanning from{" "}
          <span className="font-semibold text-stone-800">January 5th, 2026</span> to{" "}
          <span className="font-semibold text-stone-800">January 15th, 2026</span>, with
          a total training duration of{" "}
          <span className="font-semibold text-stone-800">{hours} hours</span>.
        </p>
      </div>

      {/* Footer Seal & Signature */}
      <div className="flex justify-between items-end border-t border-stone-200/80 pt-6 text-stone-600 z-10 mt-2">
        {/* Left column: Issue Date */}
        <div className="w-1/3 text-left space-y-0.5 translate-y-3">
          <div className="text-[10px] text-stone-400">Date of Issue</div>
          <div className="text-xs font-mono text-stone-700 font-bold">
            {issueDate}
          </div>
        </div>

        {/* Center column: QR code*/}
        <div className="w-1/3 flex flex-col items-center justify-center">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=https://cpe-platform.com/verify/${certificateNumber}`}
            alt="QR Code Verification"
            className="h-15 w-15 border border-stone-200 rounded p-0.5 bg-white shadow-sm -mt-4"
          />
        </div>

        {/* Right column: Certificate Number */}
        <div className="w-1/3 text-right space-y-0.5 translate-y-3">
          <div className="text-[10px] text-stone-400">Certificate Number</div>
          <div className="text-xs font-mono text-stone-700 font-bold">
            {certificateNumber}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
