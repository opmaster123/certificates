import { driver, Driver, DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';

export interface TourOptions {
  onComplete?: () => void;
  onExit?: () => void;
}

let activeDriver: Driver | null = null;

export const BIG_TOUR_STORAGE_KEYS = {
  ACTIVE: 'khutta_big_tour_active',
  STAGE: 'khutta_big_tour_stage',
};

export const isBigTourActive = (): boolean => {
  try {
    return sessionStorage.getItem(BIG_TOUR_STORAGE_KEYS.ACTIVE) === 'true';
  } catch {
    return false;
  }
};

export const getBigTourStage = (): string | null => {
  try {
    return sessionStorage.getItem(BIG_TOUR_STORAGE_KEYS.STAGE);
  } catch {
    return null;
  }
};

export const cancelBigTour = (): void => {
  try {
    sessionStorage.removeItem(BIG_TOUR_STORAGE_KEYS.ACTIVE);
    sessionStorage.removeItem(BIG_TOUR_STORAGE_KEYS.STAGE);
    if (activeDriver) {
      activeDriver.destroy();
      activeDriver = null;
    }
    // Clean up DOM artifacts
    document.body.classList.remove('driver-active', 'driver-fade', 'driver-simple', 'driver-no-scroll');
    const popover = document.querySelector('.driver-popover');
    if (popover) popover.remove();
    const overlay = document.querySelector('.driver-overlay');
    if (overlay) overlay.remove();
  } catch {
    // ignore
  }
};

// ============================================================================
// Driver Instance Factory
// ============================================================================

export const createTour = (steps: DriveStep[], options?: TourOptions): Driver => {
  if (activeDriver) {
    try {
      activeDriver.destroy();
    } catch {
      // ignore
    }
  }

  const inst = driver({
    animate: true,
    overlayColor: '#0f172a',
    overlayOpacity: 0.65,
    smoothScroll: true,
    allowClose: true,
    stagePadding: 6,
    stageRadius: 12,
    popoverClass: 'khutta-driver-popover',
    showProgress: true,
    progressText: '{{current}} من {{total}}',
    nextBtnText: 'التالي ←',
    prevBtnText: '→ السابق',
    doneBtnText: 'إنهاء الجولة ✓',
    closeBtnLabel: 'إغلاق',
    steps,
    onDoneClick: (_element, _step, opts) => {
      try {
        opts.driver.destroy();
      } catch {
        // ignore
      }
      cancelBigTour();
      options?.onComplete?.();
    },
    onCloseClick: (_element, _step, opts) => {
      try {
        opts.driver.destroy();
      } catch {
        // ignore
      }
      cancelBigTour();
      options?.onExit?.();
    },
    onDestroyed: () => {
      activeDriver = null;
      try {
        document.body.classList.remove('driver-active', 'driver-fade', 'driver-simple', 'driver-no-scroll');
        const popover = document.querySelector('.driver-popover');
        if (popover) popover.remove();
        const overlay = document.querySelector('.driver-overlay');
        if (overlay) overlay.remove();
      } catch {
        // ignore
      }
    },
  });

  activeDriver = inst;
  return inst;
};

// ============================================================================
// Multi-Page "A to Z" Walkthrough Steps (Simple Clear Explanations)
// ============================================================================

// Leg 1: On /tests (Stage: 'tests')
export const createBigTourTestsSteps = (navigate: (path: string) => void): DriveStep[] => [
  {
    element: '[data-tour="filter-chips"]',
    popover: {
      title: '🔍 1. فلاتر التخصصات والشهادات المهنية',
      description: 'تتيح لك تصفية قائمة الاختبارات فورياً بحسب شهادتك المستهدفة: CIA، CMA، CPA، CFE، أو CISA لتصل للاختبارات التي تناسب مسارك المهني بسهولة.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="test-cards-first-three"], [data-tour="test-card-first"]',
    popover: {
      title: '📝 2. بطاقات الاختبارات وساعات الـ CPE',
      description: 'توضح بطاقات الاختبارات تفاصيل ساعات التعليم المهني المستمر (CPE)، ومدة الاختبار، ونسبة النجاح. بالضغط على أي اختبار يمكنك استعراض باقاته وإضافته للسلة.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '[data-tour="cart-trigger"]',
    popover: {
      title: '🛒 3. سلة الباقات والخصومات التلقائية',
      description: 'تجمع اختباراتك المختارة مع تطبيق خصم فوري وتلقائي للباقات التراكمية بحسب عدد الساعات. اضغط (التالي) للاطلاع على صفحة أداء الاختبار!',
      side: 'bottom',
      align: 'end',
      onNextClick: () => {
        try {
          sessionStorage.setItem(BIG_TOUR_STORAGE_KEYS.ACTIVE, 'true');
          sessionStorage.setItem(BIG_TOUR_STORAGE_KEYS.STAGE, 'testTaking');
        } catch {
          // ignore
        }
        if (activeDriver) activeDriver.destroy();
        navigate('/test/demo');
      },
    },
  },
];

// Leg 2: On /test/demo (Stage: 'testTaking')
export const createBigTourTestTakingSteps = (navigate: (path: string) => void): DriveStep[] => [
  {
    element: '[data-tour="honor-code"]',
    popover: {
      title: '📜 4. تعهد الأمانة المهنية والتعليمات',
      description: 'في صفحة الاختبار، تجد التعليمات وعدد الأسئلة والوقت المتاح. يجب قراءة والموافقة على إقرار الأمانة العلمية والمهنية لتفعيل زر البدء.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '[data-tour="start-test-btn"]',
    popover: {
      title: '⏱️ 5. خوض التقييم وإصدار النتيجة',
      description: 'عند الضغط على (بدء الاختبار)، تفتح شاشة التقييم بأسئلة اختيار من متعدد مع مؤقت زمني، وتظهر النتيجة فورياً فور التسليم. اضغط (التالي) للاطلاع على صفحة الدفع!',
      side: 'bottom',
      align: 'center',
      onNextClick: () => {
        try {
          sessionStorage.setItem(BIG_TOUR_STORAGE_KEYS.ACTIVE, 'true');
          sessionStorage.setItem(BIG_TOUR_STORAGE_KEYS.STAGE, 'payment');
        } catch {
          // ignore
        }
        if (activeDriver) activeDriver.destroy();
        navigate('/payment');
      },
    },
  },
];

// Leg 3: On /payment (Stage: 'payment')
export const createBigTourPaymentSteps = (navigate: (path: string) => void): DriveStep[] => [
  {
    element: '[data-tour="payment-summary"]',
    popover: {
      title: '📋 6. ملخص الفاتورة والساعات المعتمدة',
      description: 'بعد إكمال الاختبارات بنجاح، تتوجه إلى صفحة الدفع لمراجعة إجمالي ساعات الـ CPE المكتسبة، نسبة خصم الباقة، والمبلغ المستحق.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="payment-form"]',
    popover: {
      title: '💳 7. الدفع الآمن والاعتماد الفوري',
      description: 'بوابة دفع إلكترونية آمنة وسريعة. بمجرد إتمام الدفع يتم فوراً اعتماد وإصدار الشهادات في حسابك. اضغط (التالي) للاطلاع على مكتبة الشهادات!',
      side: 'left',
      align: 'center',
      onNextClick: () => {
        try {
          sessionStorage.setItem(BIG_TOUR_STORAGE_KEYS.ACTIVE, 'true');
          sessionStorage.setItem(BIG_TOUR_STORAGE_KEYS.STAGE, 'certificates');
        } catch {
          // ignore
        }
        if (activeDriver) activeDriver.destroy();
        navigate('/certificates');
      },
    },
  },
];

// Leg 4: On /certificates (Stage: 'certificates')
export const createBigTourCertificatesSteps = (navigate: (path: string) => void): DriveStep[] => [
  {
    element: '[data-tour="certificates-header"]',
    popover: {
      title: '🎓 8. مكتبة الشهادات المعتمدة',
      description: 'انتقلنا إلى مكتبة شهاداتك! هنا يتم حفظ جميع شهادات الـ CPE الصادرة لك، وكل شهادة مزودة برمز QR دولي ذكي للتحقق الفوري.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="cert-dates-btn"], [data-tour="cert-card-first"], [data-tour="certificates-header"]',
    popover: {
      title: '📅 9. ميزة تحديد وتثبيت التواريخ',
      description: 'ميزة خاصة تمكنك من تحديد تواريخ بدء وانتهاء التدريب وتاريخ الإصدار بما يطابق فترات التجديد المطلوبة لهيئتك المهنية قبل التثبيت النهائي.',
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '[data-tour="cert-actions-group"], [data-tour="cert-card-first"], [data-tour="certificates-header"]',
    popover: {
      title: '📥 10. استعراض وتحميل الـ PDF',
      description: 'يمكنك استعراض الشهادة في أي وقت أو تحميلها كملف PDF عالي الدقة جاهز للطباعة والتقديم لجهات العمل والاعتماد. اضغط (التالي) لإنهاء الجولة!',
      side: 'top',
      align: 'center',
      onNextClick: () => {
        try {
          sessionStorage.setItem(BIG_TOUR_STORAGE_KEYS.ACTIVE, 'true');
          sessionStorage.setItem(BIG_TOUR_STORAGE_KEYS.STAGE, 'final');
        } catch {
          // ignore
        }
        if (activeDriver) activeDriver.destroy();
        navigate('/tests');
      },
    },
  },
];

// Leg 5: Final Step on /tests (Stage: 'final')
export const bigTourFinalSteps: DriveStep[] = [
  {
    element: '[data-tour="filter-chips"], [data-tour="cart-trigger"]',
    popover: {
      title: '🎉 اكتملت الجولة الإرشادية بنجاح!',
      description: 'أنت الآن على دراية تامة بجميع خطوات واستخدامات المنصة (تصفح الاختبارات، حجز الباقات، أداء التقييم، الدفع، وتخصيص وتحميل الشهادات). نتمنى لك رحلة مهنية مميزة ومليئة بالإنجازات!',
      side: 'bottom',
      align: 'start',
    },
  },
];

// LocalStorage Keys
export const TOUR_STORAGE_KEYS = {
  TESTS: 'khutta_tour_seen_tests',
};

export const hasSeenTour = (key: string): boolean => {
  try {
    return localStorage.getItem(key) === 'true';
  } catch {
    return false;
  }
};

export const markTourSeen = (key: string): void => {
  try {
    localStorage.setItem(key, 'true');
  } catch {
    // ignore
  }
};

export const resetAllTours = (): void => {
  try {
    Object.values(TOUR_STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
    cancelBigTour();
  } catch {
    // ignore
  }
};

// ============================================================================
// Multi-Page Tour Controllers
// ============================================================================

export const startFullBigTour = (navigate: (path: string) => void) => {
  try {
    sessionStorage.setItem(BIG_TOUR_STORAGE_KEYS.ACTIVE, 'true');
    sessionStorage.setItem(BIG_TOUR_STORAGE_KEYS.STAGE, 'tests');
  } catch {
    // ignore
  }

  const steps = createBigTourTestsSteps(navigate);
  const inst = createTour(steps, {
    onComplete: () => {
      // Transition handled in step onNextClick
    },
    onExit: () => {
      cancelBigTour();
    },
  });
  inst.drive();
  return inst;
};

export const runBigTourTestTaking = (navigate: (path: string) => void) => {
  const steps = createBigTourTestTakingSteps(navigate);
  const inst = createTour(steps, {
    onComplete: () => {
      // Transition handled in step onNextClick
    },
    onExit: () => {
      cancelBigTour();
    },
  });
  inst.drive();
  return inst;
};

export const runBigTourPayment = (navigate: (path: string) => void) => {
  const steps = createBigTourPaymentSteps(navigate);
  const inst = createTour(steps, {
    onComplete: () => {
      // Transition handled in step onNextClick
    },
    onExit: () => {
      cancelBigTour();
    },
  });
  inst.drive();
  return inst;
};

export const runBigTourCertificates = (navigate: (path: string) => void) => {
  const steps = createBigTourCertificatesSteps(navigate);
  const inst = createTour(steps, {
    onComplete: () => {
      // Transition handled in step onNextClick
    },
    onExit: () => {
      cancelBigTour();
    },
  });
  inst.drive();
  return inst;
};

export const runBigTourFinal = () => {
  const inst = createTour(bigTourFinalSteps, {
    onComplete: () => {
      markTourSeen(TOUR_STORAGE_KEYS.TESTS);
      cancelBigTour();
    },
    onExit: () => {
      cancelBigTour();
    },
  });
  inst.drive();
  return inst;
};
