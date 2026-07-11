import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  AlertTriangle,
  CheckCircle2,
  Info,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { certificatesService } from '@/services/certificates';
import type { Certificate } from '@shared/dtos-and-types';
import { cn } from '@/lib/utils';

const ARABIC_MONTHS = [
  'يناير (01)',
  'فبراير (02)',
  'مارس (03)',
  'أبريل (04)',
  'مايو (05)',
  'يونيو (06)',
  'يوليو (07)',
  'أغسطس (08)',
  'سبتمبر (09)',
  'أكتوبر (10)',
  'نوفمبر (11)',
  'ديسمبر (12)',
];

const ARABIC_MONTH_NAMES_SHORT = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
];

const WEEKDAYS = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

interface CustomDatePickerProps {
  label: string;
  value: string; // Format: YYYY-MM-DD
  onChange: (dateStr: string) => void;
  minDate?: string; // Format: YYYY-MM-DD
  maxDate?: string; // Format: YYYY-MM-DD
  placeholder?: string;
  helperText?: string;
  disabled?: boolean;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  label,
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = 'اضغط لاختيار التاريخ...',
  helperText,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Staged selection before confirming
  const [stagedDate, setStagedDate] = useState<string | null>(value || null);

  // Calendar browsing state (Month: 0-11, Year: number)
  const currentYear = new Date().getFullYear();
  const [viewYear, setViewYear] = useState<number>(currentYear);
  const [viewMonth, setViewMonth] = useState<number>(new Date().getMonth());

  // Initialize or reset browsing view when popover opens or value changes
  useEffect(() => {
    if (value) {
      const [y, m] = value.split('-').map(Number);
      setViewYear(y);
      setViewMonth(m - 1);
      setStagedDate(value);
    } else if (maxDate) {
      const [y, m] = maxDate.split('-').map(Number);
      setViewYear(y);
      setViewMonth(m - 1);
      setStagedDate(null);
    } else {
      const now = new Date();
      setViewYear(now.getFullYear());
      setViewMonth(now.getMonth());
      setStagedDate(null);
    }
  }, [value, maxDate, isOpen]);

  // Navigate months
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  // Check if a specific day is disabled according to minDate/maxDate
  const isDayDisabled = (day: number) => {
    const dMid = new Date(viewYear, viewMonth, day).getTime();

    if (minDate) {
      const [minY, minM, minD] = minDate.split('-').map(Number);
      const minMid = new Date(minY, minM - 1, minD).getTime();
      if (dMid < minMid) return true;
    }

    if (maxDate) {
      const [maxY, maxM, maxD] = maxDate.split('-').map(Number);
      const maxMid = new Date(maxY, maxM - 1, maxD).getTime();
      if (dMid > maxMid) return true;
    }

    return false;
  };

  // Generate grid days
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 is Sunday

  // Handle confirming staged date
  const handleConfirm = () => {
    if (stagedDate) {
      onChange(stagedDate);
      setIsOpen(false);
    }
  };

  // Handle canceling
  const handleCancel = () => {
    setStagedDate(value || null);
    setIsOpen(false);
  };

  // Human friendly display string for the button trigger
  const getDisplayValue = () => {
    if (!value) return null;
    const [y, m, d] = value.split('-').map(Number);
    const monthName = ARABIC_MONTH_NAMES_SHORT[m - 1] || '';
    return `${y}/${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')} (${d} ${monthName} ${y})`;
  };

  const getStagedDisplay = () => {
    if (!stagedDate) return null;
    const [y, m, d] = stagedDate.split('-').map(Number);
    const monthName = ARABIC_MONTH_NAMES_SHORT[m - 1] || '';
    return `${y}/${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')} (${d} ${monthName})`;
  };

  // Generate years list (e.g. from 2018 to currentYear + 1)
  const yearsList: number[] = [];
  for (let yr = currentYear; yr >= 2018; yr--) {
    yearsList.push(yr);
  }

  return (
    <div className="space-y-1.5 text-right font-sans">
      <label className="text-xs font-bold text-foreground block">{label}</label>

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              'w-full flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/40',
              value
                ? 'border-primary/40 bg-card text-foreground font-medium shadow-sm hover:border-primary'
                : 'border-border bg-card text-muted-foreground hover:border-border/80',
              disabled && 'opacity-50 cursor-not-allowed bg-muted'
            )}
            dir="rtl"
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <CalendarIcon className="h-4 w-4 text-primary shrink-0" />
              <span className="truncate text-xs sm:text-sm font-mono font-medium">
                {getDisplayValue() || placeholder}
              </span>
            </div>
            <span className="text-xs text-primary font-bold px-2.5 py-1 rounded-lg bg-primary/10 shrink-0">
              {value ? 'تغيير' : 'اختيار'}
            </span>
          </button>
        </PopoverTrigger>

        <PopoverContent
          className="z-[100] w-[360px] p-5 bg-card border border-border shadow-2xl rounded-2xl space-y-3.5 font-sans"
          align="start"
          sideOffset={8}
          dir="rtl"
        >
          {/* Calendar Header: Month/Year navigation without picking days */}
          <div className="flex items-center justify-between gap-1 pb-2 border-b border-border/50">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleNextMonth}
              title="الشهر التالي"
              className="h-8 w-8 rounded-lg hover:bg-muted"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Select Dropdowns for Month and Year */}
            <div className="flex items-center gap-1.5">
              <Select value={String(viewMonth)} onValueChange={(val) => setViewMonth(Number(val))}>
                <SelectTrigger className="h-8 text-xs font-bold px-2.5 rounded-lg border-border bg-muted/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[110] max-h-56">
                  {ARABIC_MONTHS.map((mo, idx) => (
                    <SelectItem key={idx} value={String(idx)} className="text-xs">
                      {mo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={String(viewYear)} onValueChange={(val) => setViewYear(Number(val))}>
                <SelectTrigger className="h-8 text-xs font-bold px-2.5 rounded-lg border-border bg-muted/30 font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[110] max-h-56">
                  {yearsList.map((yr) => (
                    <SelectItem key={yr} value={String(yr)} className="text-xs font-mono">
                      {yr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handlePrevMonth}
              title="الشهر السابق"
              className="h-8 w-8 rounded-lg hover:bg-muted"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEKDAYS.map((wd, i) => (
              <div key={i} className="text-[11px] font-bold text-muted-foreground py-1">
                {wd}
              </div>
            ))}
          </div>

          {/* Calendar Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Empty slots for days before 1st of month */}
            {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-8 w-8" />
            ))}

            {/* Month days */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(
                2,
                '0'
              )}-${String(dayNum).padStart(2, '0')}`;
              const disabledDay = isDayDisabled(dayNum);
              const isSelected = stagedDate === dateStr;

              return (
                <button
                  key={dayNum}
                  type="button"
                  disabled={disabledDay}
                  onClick={() => setStagedDate(dateStr)}
                  className={cn(
                    'h-8 w-8 rounded-lg text-xs font-medium transition-all flex items-center justify-center font-mono mx-auto',
                    isSelected
                      ? 'gradient-primary text-primary-foreground font-bold shadow-md scale-105 ring-2 ring-primary/40'
                      : disabledDay
                        ? 'text-muted-foreground/30 cursor-not-allowed bg-transparent'
                        : 'text-foreground hover:bg-primary/10 hover:text-primary active:scale-95'
                  )}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>

          {/* Confirmation & Footer */}
          <div className="pt-3 border-t border-border/50 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">اليوم المحدد:</span>
              <span
                className={cn(
                  'font-bold font-mono',
                  stagedDate ? 'text-primary' : 'text-muted-foreground italic text-[11px]'
                )}
              >
                {getStagedDisplay() || 'يرجى النقر على اليوم'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className="flex-1 h-9 rounded-xl text-xs font-bold"
              >
                <X className="h-3.5 w-3.5 ml-1" />
                إلغاء
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleConfirm}
                disabled={!stagedDate}
                className="flex-1 h-9 gradient-primary border-0 text-primary-foreground rounded-xl text-xs font-bold shadow-sm"
              >
                <Check className="h-3.5 w-3.5 ml-1" />
                تأكيد التاريخ
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {helperText && (
        <span className="text-[10px] text-muted-foreground block leading-tight">{helperText}</span>
      )}
    </div>
  );
};

interface CertificateDateModalProps {
  certificate: Certificate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (updated: Certificate) => void;
}

export const CertificateDateModal: React.FC<CertificateDateModalProps> = ({
  certificate,
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [isSubmittingDates, setIsSubmittingDates] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setEditStartDate('');
      setEditEndDate('');
      setDateError(null);
    }
  }, [open, certificate?.id]);

  // Date calculation logic
  const maxHours = parseInt(certificate?.hours || '4', 10);
  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const maxEndDate = new Date(todayMidnight.getTime() - 2 * 24 * 60 * 60 * 1000);
  const maxEndDateStr = maxEndDate.toISOString().split('T')[0];
  const todayFormatted = today.toISOString().split('T')[0].replace(/-/g, '/');

  // Dynamic input min/max bounds
  const startDateMaxBound = editEndDate
    ? new Date(new Date(editEndDate).getTime() - 1 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]
    : maxEndDateStr;

  const startDateMinBound = editEndDate
    ? new Date(new Date(editEndDate).getTime() - maxHours * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]
    : undefined;

  const endDateMinBound = editStartDate
    ? new Date(new Date(editStartDate).getTime() + 1 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]
    : undefined;

  const endDateMaxBound = editStartDate
    ? new Date(new Date(editStartDate).getTime() + maxHours * 24 * 60 * 60 * 1000).getTime() >
      maxEndDate.getTime()
      ? maxEndDateStr
      : new Date(new Date(editStartDate).getTime() + maxHours * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0]
    : maxEndDateStr;

  const handleStartDateChange = (val: string) => {
    setEditStartDate(val);
    setDateError(null);
    if (!val) return;

    const s = new Date(val);
    if (isNaN(s.getTime())) return;

    // Give max end date in the future (s + maxHours days, capped at today - 2 days)
    const targetEnd = new Date(s.getTime() + maxHours * 24 * 60 * 60 * 1000);
    const finalEnd = targetEnd.getTime() > maxEndDate.getTime() ? maxEndDate : targetEnd;

    if (finalEnd.getTime() >= s.getTime() + 1 * 24 * 60 * 60 * 1000) {
      const yr = finalEnd.getFullYear();
      const mo = String(finalEnd.getMonth() + 1).padStart(2, '0');
      const da = String(finalEnd.getDate()).padStart(2, '0');
      setEditEndDate(`${yr}-${mo}-${da}`);
    }
  };

  const handleEndDateChange = (val: string) => {
    setEditEndDate(val);
    setDateError(null);
    if (!val) return;

    const e = new Date(val);
    if (isNaN(e.getTime())) return;

    // Give max start date in the past (e - maxHours days)
    const targetStart = new Date(e.getTime() - maxHours * 24 * 60 * 60 * 1000);
    const yr = targetStart.getFullYear();
    const mo = String(targetStart.getMonth() + 1).padStart(2, '0');
    const da = String(targetStart.getDate()).padStart(2, '0');
    setEditStartDate(`${yr}-${mo}-${da}`);
  };

  let diffInDays: number | null = null;
  let derivedIssueDateStr: string | null = null;
  let isIssueDateInFuture = false;

  if (editEndDate) {
    const end = new Date(editEndDate);
    if (!isNaN(end.getTime())) {
      const dIssue = new Date(end.getFullYear(), end.getMonth(), end.getDate() + 2);
      const yr = dIssue.getFullYear();
      const mo = String(dIssue.getMonth() + 1).padStart(2, '0');
      const da = String(dIssue.getDate()).padStart(2, '0');
      derivedIssueDateStr = `${yr}/${mo}/${da}`;

      if (dIssue.getTime() > todayMidnight.getTime()) {
        isIssueDateInFuture = true;
      }
    }
  }

  if (editStartDate && editEndDate) {
    const s = new Date(editStartDate);
    const e = new Date(editEndDate);
    if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
      const sMid = new Date(s.getFullYear(), s.getMonth(), s.getDate());
      const eMid = new Date(e.getFullYear(), e.getMonth(), e.getDate());
      diffInDays = Math.round((eMid.getTime() - sMid.getTime()) / (1000 * 60 * 60 * 24));
    }
  }

  const handleSaveDates = async () => {
    if (!certificate || !editStartDate || !editEndDate) return;
    if (diffInDays !== null && (diffInDays < 1 || diffInDays > maxHours)) return;
    if (isIssueDateInFuture) return;

    setIsSubmittingDates(true);
    setDateError(null);
    const updated = await certificatesService.updateCertificateDates(certificate.id, {
      startDate: editStartDate,
      endDate: editEndDate,
    });

    if (updated) {
      toast({
        title: 'تم حفظ التواريخ بنجاح!',
        description:
          'تم تثبيت تواريخ وتاريخ إصدار الشهادة، ويمكنك الآن استعراضها وتحميلها بصيغة PDF.',
      });

      onSuccess(updated);
      onOpenChange(false);
    } else {
      setDateError('فشل حفظ التواريخ');
    }
    setIsSubmittingDates(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[95vw] sm:max-w-3xl md:max-w-4xl max-h-[92vh] overflow-y-auto bg-card border border-border p-6 sm:p-8 rounded-3xl text-right font-sans shadow-2xl space-y-6"
        dir="rtl"
      >
        <DialogHeader className="text-right pb-4 border-b border-border/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <DialogTitle className="text-xl sm:text-2xl font-heading font-bold text-foreground flex items-center gap-3 justify-start">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <CalendarIcon className="h-6 w-6" />
              </div>
              <span>تحديد تواريخ البرنامج التدريبي والشهادة</span>
            </DialogTitle>
            {certificate && (
              <div className="flex items-center gap-2 self-start sm:self-auto bg-muted/60 border border-border/80 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-foreground">
                <Clock className="h-4 w-4 text-primary" />
                <span>{certificate.hours} ساعات CPE معتمدة</span>
              </div>
            )}
          </div>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground text-right mt-2 font-medium">
            {certificate?.arabicTitle || certificate?.courseTitle || certificate?.englishTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Alert Box for Irreversibility */}
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 text-right shadow-sm">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-amber-500" />
            <div className="space-y-1">
              <span className="font-bold text-foreground text-sm sm:text-base block">
                تنبيه هام جداً: تحديد التواريخ نهائي ولا يمكن تغييره لاحقاً
              </span>
              <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                بمجرد تأكيد وحفظ التواريخ، سيتم إدراجها مباشرة على وثيقة الشهادة الرسمية والتحقق
                منها عبر رمز الاستجابة السريعة (QR Code)، ولا يمكن تعديلها أو التراجع عنها نهائياً
                لضمان مصداقية الاعتماد.
              </p>
            </div>
          </div>

          {/* Instructions and Rules Checklist Box */}
          <div className="bg-muted/40 border border-border/60 rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm sm:text-base text-foreground flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                قواعد وتعليمات تحديد التواريخ:
              </span>
              <span className="text-xs text-muted-foreground bg-background/80 px-2.5 py-1 rounded-lg border border-border/50">
                معايير الاعتماد الرسمية
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs sm:text-sm text-muted-foreground">
              <div className="bg-card/70 border border-border/60 rounded-xl p-3.5 space-y-1">
                <span className="font-bold text-foreground block text-xs">
                  1. تاريخ الإصدار التلقائي
                </span>
                <p className="leading-relaxed">
                  يتم احتسابه تلقائياً ليكون بعد يومين من تاريخ الانتهاء (تاريخ الانتهاء + 2 يوم).
                </p>
              </div>

              <div className="bg-card/70 border border-border/60 rounded-xl p-3.5 space-y-1">
                <span className="font-bold text-foreground block text-xs">
                  2. عدم التجاوز للمستقبل
                </span>
                <p className="leading-relaxed">
                  لا يمكن لتاريخ الإصدار أن يقع في المستقبل (أقصى تاريخ مسموح هو اليوم:{' '}
                  <span className="font-mono font-bold text-foreground">{todayFormatted}</span>).
                </p>
              </div>

              <div className="bg-card/70 border border-border/60 rounded-xl p-3.5 space-y-1">
                <span className="font-bold text-foreground block text-xs">3. المدة المسموحة</span>
                <p className="leading-relaxed">
                  الفارق بين البدء والانتهاء يبدأ من يوم واحد وحتى{' '}
                  <span className="font-bold text-foreground">{maxHours} أيام</span> كحد أقصى.
                </p>
              </div>
            </div>

            {/* Real-time Calculation & Preview Cards */}
            {(derivedIssueDateStr || diffInDays !== null) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-border/60">
                {derivedIssueDateStr && (
                  <div
                    className={cn(
                      'rounded-xl p-3.5 border flex items-center justify-between',
                      isIssueDateInFuture
                        ? 'bg-destructive/10 border-destructive/30 text-destructive'
                        : 'bg-primary/5 border-primary/20 text-foreground'
                    )}
                  >
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground block">
                        تاريخ الإصدار المحتسب تلقائياً:
                      </span>
                      <span className="font-mono font-bold text-sm sm:text-base mt-0.5 block">
                        {derivedIssueDateStr}
                      </span>
                    </div>
                    <div className="text-left font-bold text-xs">
                      {isIssueDateInFuture ? (
                        <span className="text-destructive bg-destructive/15 px-2.5 py-1 rounded-lg">
                          في المستقبل (غير مسموح)
                        </span>
                      ) : (
                        <span className="text-success bg-success/15 px-2.5 py-1 rounded-lg flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> سليم ومطابق
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {diffInDays !== null && (
                  <div
                    className={cn(
                      'rounded-xl p-3.5 border flex items-center justify-between',
                      diffInDays < 1 || diffInDays > maxHours
                        ? 'bg-destructive/10 border-destructive/30 text-destructive'
                        : 'bg-primary/5 border-primary/20 text-foreground'
                    )}
                  >
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground block">
                        المدة المحسوبة بين البدء والانتهاء:
                      </span>
                      <span className="font-mono font-bold text-sm sm:text-base mt-0.5 block">
                        {diffInDays} يوم
                      </span>
                    </div>
                    <div className="text-left font-bold text-xs">
                      {diffInDays < 1 ? (
                        <span className="text-destructive bg-destructive/15 px-2.5 py-1 rounded-lg">
                          أقل من يوم واحد
                        </span>
                      ) : diffInDays > maxHours ? (
                        <span className="text-destructive bg-destructive/15 px-2.5 py-1 rounded-lg">
                          يتجاوز {maxHours} أيام
                        </span>
                      ) : (
                        <span className="text-success bg-success/15 px-2.5 py-1 rounded-lg flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> مدة صحيحة
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Date pickers with fancy UI & explicit confirmation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            <CustomDatePicker
              label="تاريخ البدء (Start Date) *"
              value={editStartDate}
              onChange={handleStartDateChange}
              minDate={startDateMinBound}
              maxDate={startDateMaxBound}
              placeholder="اختر تاريخ بدء التدريب..."
              helperText={`اختيار تاريخ البدء يحدد تاريخ الانتهاء تلقائياً إلى أقصى حد (${maxHours} أيام).`}
            />

            <CustomDatePicker
              label="تاريخ الانتهاء (End Date) *"
              value={editEndDate}
              onChange={handleEndDateChange}
              minDate={endDateMinBound}
              maxDate={endDateMaxBound}
              placeholder="اختر تاريخ انتهاء التدريب..."
              helperText={`أقصى تاريخ انتهاء مسموح به هو (${maxEndDateStr.replace(/-/g, '/')}).`}
            />
          </div>

          {/* Quick Duration Preset Selector */}
          {editStartDate && (
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 sm:p-5 space-y-3 text-right">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs sm:text-sm">
                <span className="font-bold text-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>اختيار سريع لمدة التدريب:</span>
                </span>
                <span className="text-xs text-muted-foreground font-sans">
                  تحدد تاريخ الانتهاء تلقائياً بناءً على تاريخ البدء والساعات المعتمدة
                </span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {Array.from({ length: maxHours }).map((_, idx) => {
                  const days = idx + 1;
                  const [sy, sm, sd] = editStartDate.split('-').map(Number);
                  const sDate = new Date(sy, sm - 1, sd);
                  const targetEnd = new Date(sDate.getTime() + days * 24 * 60 * 60 * 1000);
                  const isPastMaxEnd = targetEnd.getTime() > maxEndDate.getTime();

                  return (
                    <button
                      key={days}
                      type="button"
                      disabled={isPastMaxEnd}
                      onClick={() => {
                        const yr = targetEnd.getFullYear();
                        const mo = String(targetEnd.getMonth() + 1).padStart(2, '0');
                        const da = String(targetEnd.getDate()).padStart(2, '0');
                        setEditEndDate(`${yr}-${mo}-${da}`);
                        setDateError(null);
                      }}
                      className={cn(
                        'px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all border font-sans',
                        diffInDays === days
                          ? 'gradient-primary text-primary-foreground border-transparent shadow-md scale-105'
                          : isPastMaxEnd
                            ? 'opacity-30 cursor-not-allowed border-border text-muted-foreground'
                            : 'bg-card border-border text-foreground hover:border-primary/50 hover:bg-primary/10'
                      )}
                    >
                      {days === 1 ? 'يوم واحد' : days === 2 ? 'يومان' : `${days} أيام`}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {dateError && (
            <p className="text-xs sm:text-sm text-destructive font-semibold text-right">
              {dateError}
            </p>
          )}
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:items-center gap-3 pt-5 border-t border-border/50 justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmittingDates}
            className="rounded-xl px-6 py-2.5 font-bold h-11 text-sm sm:text-base"
          >
            إلغاء
          </Button>
          <Button
            onClick={handleSaveDates}
            disabled={
              isSubmittingDates ||
              !editStartDate ||
              !editEndDate ||
              isIssueDateInFuture ||
              (diffInDays !== null && (diffInDays < 1 || diffInDays > maxHours))
            }
            className="gradient-primary border-0 text-primary-foreground font-heading font-bold rounded-xl px-8 py-2.5 h-11 text-sm sm:text-base shadow-md hover:shadow-lg transition-all"
          >
            {isSubmittingDates ? 'جاري الحفظ والتثبيت...' : 'تأكيد وتثبيت التواريخ نهائياً'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
