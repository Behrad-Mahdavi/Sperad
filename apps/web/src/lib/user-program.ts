/**
 * Sperad User Definitive 4-Week Re-entry Program
 * 
 * Configured specifically based on user review & judgment:
 * - Layoff > 7-10 months
 * - Biomechanical safety: Right shoulder protection (no barbell bench/OHP), Knee & Achilles protection (no barbell back squat, mid-to-high leg press)
 * - 4-Week Volume ramp: Weeks 1 -> 2 -> 3 -> 4
 * - 6-Day Routine: Pull A, Push A, Legs+Arms A, Rest, Pull B, Push B, Legs+Arms B
 */

export interface ProgramExerciseDef {
  exerciseId: string;
  nameFa: string;
  repsRange: string; // e.g. "8 تا 12"
  setsByWeek: [number, number, number, number]; // [W1, W2, W3, W4]
  notesFa: string;
  muscleGroup: 'back' | 'chest' | 'biceps' | 'triceps' | 'shoulders' | 'legs' | 'abs';
  isCompound: boolean;
}

export interface ProgramDayDef {
  id: string; // e.g. "pull_a"
  dayNumber: number; // 1 to 7
  titleFa: string; // e.g. "روز ۱: Pull A"
  warmupFa?: string;
  exercises: ProgramExerciseDef[];
}

export interface WeekVolumeTarget {
  back: number;
  chest: number;
  biceps: number;
  triceps: number;
  shoulders: number;
  quads: number;
  hamstrings: number;
  calves: number;
  abs: number;
  targetRirCompound: string;
  targetRirIsolation: string;
  generalRirFa: string;
}

export const USER_PROGRAM_VOLUMES: Record<number, WeekVolumeTarget> = {
  1: {
    back: 8,
    chest: 6,
    biceps: 6,
    triceps: 6,
    shoulders: 6,
    quads: 3,
    hamstrings: 3,
    calves: 3,
    abs: 2,
    targetRirCompound: '۳ تا ۴',
    targetRirIsolation: '۳ تا ۴',
    generalRirFa: 'RIR ۳ تا ۴ (۳ تا ۴ تکرار ذخیره در تمام حرکات)'
  },
  2: {
    back: 12,
    chest: 10,
    biceps: 8,
    triceps: 8,
    shoulders: 8,
    quads: 4,
    hamstrings: 4,
    calves: 4,
    abs: 3,
    targetRirCompound: '۲ تا ۳',
    targetRirIsolation: '۲ تا ۳',
    generalRirFa: 'RIR ۲ تا ۳ (صعود تدریجی شدت)'
  },
  3: {
    back: 16,
    chest: 14,
    biceps: 12,
    triceps: 10,
    shoulders: 12,
    quads: 6,
    hamstrings: 6,
    calves: 6,
    abs: 4,
    targetRirCompound: '۲',
    targetRirIsolation: '۱ تا ۲',
    generalRirFa: 'مرکب‌ها RIR ۲، ایزوله‌ها RIR ۱ تا ۲'
  },
  4: {
    back: 16,
    chest: 14,
    biceps: 12,
    triceps: 10,
    shoulders: 12,
    quads: 6,
    hamstrings: 6,
    calves: 6,
    abs: 4,
    targetRirCompound: '۲',
    targetRirIsolation: '۱',
    generalRirFa: 'مرکب‌ها RIR ۲، ایزوله‌ها RIR ۱ (آخرین ست ایزوله اختیاری ۰ تا ۱)'
  }
};

export const USER_PROGRAM_DAYS: ProgramDayDef[] = [
  {
    id: 'pull_a',
    dayNumber: 1,
    titleFa: 'روز ۱: Pull A (زیربغل و کششی A)',
    exercises: [
      {
        exerciseId: 'tbar_machine_chest_supported_row',
        nameFa: 'روئینگ تی‌بار یا ماشین سینه‌تکیه',
        repsRange: '۸ تا ۱۲',
        setsByWeek: [2, 3, 3, 3],
        notesFa: 'بدون فشار روی کمر؛ کشش کامل',
        muscleGroup: 'back',
        isCompound: true
      },
      {
        exerciseId: 'semi_neutral_lat_pulldown',
        nameFa: 'لت پولداون، گریپ نیمه‌خنثی',
        repsRange: '۸ تا ۱۲',
        setsByWeek: [2, 2, 3, 3],
        notesFa: 'آرنج به سمت جیب؛ کشش کامل بالا',
        muscleGroup: 'back',
        isCompound: true
      },
      {
        exerciseId: 'straight_arm_pulldown',
        nameFa: 'استریت‌آرم پولداون',
        repsRange: '۱۲ تا ۱۵',
        setsByWeek: [0, 1, 2, 2],
        notesFa: 'بازو صاف، بدون چرخش',
        muscleGroup: 'back',
        isCompound: false
      },
      {
        exerciseId: 'face_pull_external_rotation',
        nameFa: 'فیس‌پول با چرخش خارجی',
        repsRange: '۱۲ تا ۲۰',
        setsByWeek: [1, 1, 2, 2],
        notesFa: 'سلامت شانه راست',
        muscleGroup: 'shoulders',
        isCompound: false
      },
      {
        exerciseId: 'incline_dumbbell_curl_45',
        nameFa: 'جلوبازو اینکلاین دمبل ۴۵°',
        repsRange: '۱۰ تا ۱۴',
        setsByWeek: [2, 2, 3, 3],
        notesFa: 'آرنج پشت تنه',
        muscleGroup: 'biceps',
        isCompound: false
      }
    ]
  },
  {
    id: 'push_a',
    dayNumber: 2,
    titleFa: 'روز ۲: Push A (سینه، سرشانه و پشت‌بازو A)',
    warmupFa: 'قبل از شروع: چرخش خارجی کابل ۲ ست ۱۵ تکرار (Prehab شانه راست)',
    exercises: [
      {
        exerciseId: 'incline_db_press_30_neutral',
        nameFa: 'پرس بالاسینه دمبل ۳۰°، گریپ نیمه‌خنثی',
        repsRange: '۶ تا ۱۰',
        setsByWeek: [2, 3, 3, 3],
        notesFa: 'کنترل کشش پایین، آرنج‌ها زاویه ۴۵ تا ۶۰ درجه',
        muscleGroup: 'chest',
        isCompound: true
      },
      {
        exerciseId: 'converging_chest_press_machine',
        nameFa: 'پرس سینه ماشین همگرا',
        repsRange: '۸ تا ۱۲',
        setsByWeek: [1, 1, 2, 2],
        notesFa: 'مسیر طبیعی مفصل شانه بدون تنش نامتقارن',
        muscleGroup: 'chest',
        isCompound: true
      },
      {
        exerciseId: 'low_to_high_cable_fly',
        nameFa: 'فلای کابل از پایین به بالا',
        repsRange: '۱۲ تا ۱۵',
        setsByWeek: [0, 1, 2, 2],
        notesFa: 'کشش بدون ناراحتی شانه',
        muscleGroup: 'chest',
        isCompound: false
      },
      {
        exerciseId: 'cable_lateral_raise',
        nameFa: 'نشر جانب کابل (کمی کج به بیرون)',
        repsRange: '۱۲ تا ۲۰',
        setsByWeek: [2, 2, 3, 3],
        notesFa: 'دست در صفحه اسکپولار (کمی جلوتر از تنه)',
        muscleGroup: 'shoulders',
        isCompound: false
      },
      {
        exerciseId: 'cable_overhead_triceps_rope',
        nameFa: 'پشت‌بازو اورهد کابل با طناب',
        repsRange: '۱۰ تا ۱۵',
        setsByWeek: [2, 3, 3, 3],
        notesFa: 'کشش سر بلند پشت‌بازو',
        muscleGroup: 'triceps',
        isCompound: false
      }
    ]
  },
  {
    id: 'legs_arms_a',
    dayNumber: 3,
    titleFa: 'روز ۳: Legs + Arms A (پا و بازو A)',
    exercises: [
      {
        exerciseId: 'leg_press_mid_high_feet',
        nameFa: 'لگ‌پرس، پاها وسط تا کمی بالا',
        repsRange: '۱۰ تا ۱۵',
        setsByWeek: [2, 2, 3, 3],
        notesFa: 'پاشنه‌ها کامل روی صفحه؛ ROM بدون درد برای زانو',
        muscleGroup: 'legs',
        isCompound: true
      },
      {
        exerciseId: 'seated_leg_curl',
        nameFa: 'لگ‌کرل نشسته',
        repsRange: '۱۰ تا ۱۵',
        setsByWeek: [2, 2, 3, 3],
        notesFa: 'کشش کامل همسترینگ با تکیه‌گاه محکم',
        muscleGroup: 'legs',
        isCompound: false
      },
      {
        exerciseId: 'seated_calf_raise_pause',
        nameFa: 'ساق نشسته',
        repsRange: '۱۲ تا ۱۵',
        setsByWeek: [2, 2, 3, 3],
        notesFa: 'مکث ۲ ثانیه در پایین (محافظت و بارگذاری ایمن آشیل)',
        muscleGroup: 'legs',
        isCompound: false
      },
      {
        exerciseId: 'cable_biceps_curl',
        nameFa: 'جلوبازو کابل',
        repsRange: '۱۰ تا ۱۵',
        setsByWeek: [1, 2, 3, 3],
        notesFa: 'تنش ممتد روی عضله دوسر',
        muscleGroup: 'biceps',
        isCompound: false
      },
      {
        exerciseId: 'single_arm_overhead_cable_triceps',
        nameFa: 'پشت‌بازو تک‌دست اورهد کابل',
        repsRange: '۱۰ تا ۱۵',
        setsByWeek: [1, 1, 2, 2],
        notesFa: 'کشش عمیق بدون فشار آرنج',
        muscleGroup: 'triceps',
        isCompound: false
      },
      {
        exerciseId: 'cable_crunch',
        nameFa: 'کرانچ کابل',
        repsRange: '۱۲ تا ۱۵',
        setsByWeek: [2, 2, 2, 2],
        notesFa: 'تمرکز بر فلکشن ستون فقرات بدون درگیری مفصل ران',
        muscleGroup: 'abs',
        isCompound: false
      }
    ]
  },
  {
    id: 'pull_b',
    dayNumber: 5,
    titleFa: 'روز ۵: Pull B (زیربغل و کششی B)',
    exercises: [
      {
        exerciseId: 'single_arm_cable_lat_pulldown',
        nameFa: 'لت پولداون تک‌دست کابل',
        repsRange: '۱۰ تا ۱۲',
        setsByWeek: [2, 2, 3, 3],
        notesFa: 'مسیر جانبی برای درگیری حداکثر فیبرهای لاتیسیموس',
        muscleGroup: 'back',
        isCompound: true
      },
      {
        exerciseId: 'seated_cable_row_neutral',
        nameFa: 'روئینگ کابل نشسته، گریپ خنثی',
        repsRange: '۱۰ تا ۱۲',
        setsByWeek: [2, 3, 3, 3],
        notesFa: 'کشش کامل جلو، بدون خم‌شدن بیش‌ازحد کمر',
        muscleGroup: 'back',
        isCompound: true
      },
      {
        exerciseId: 'chest_supported_single_arm_db_row',
        nameFa: 'روئینگ تک‌دست دمبل با تکیه‌گاه سینه',
        repsRange: '۱۰ تا ۱۲',
        setsByWeek: [0, 1, 2, 2],
        notesFa: 'تکیه‌گاه کامل روی میز شیب‌دار بدون لود فیله',
        muscleGroup: 'back',
        isCompound: false
      },
      {
        exerciseId: 'reverse_pec_deck',
        nameFa: 'ریورس پک‌دک',
        repsRange: '۱۲ تا ۲۰',
        setsByWeek: [1, 2, 2, 2],
        notesFa: 'تمرکز بر دلتوئید خلفی و سلامت کمربند شانه',
        muscleGroup: 'shoulders',
        isCompound: false
      },
      {
        exerciseId: 'bayesian_cable_curl',
        nameFa: 'بیزین کرل کابل یا پریچر',
        repsRange: '۱۰ تا ۱۴',
        setsByWeek: [2, 2, 3, 3],
        notesFa: 'کشش در موقعیت کشیده (Stretch-mediated hypertrophy)',
        muscleGroup: 'biceps',
        isCompound: false
      }
    ]
  },
  {
    id: 'push_b',
    dayNumber: 6,
    titleFa: 'روز ۶: Push B (سینه، سرشانه و پشت‌بازو B)',
    warmupFa: 'قبل از شروع: چرخش خارجی کابل ۲ ست ۱۵ تکرار (Prehab شانه راست)',
    exercises: [
      {
        exerciseId: 'smith_incline_press_15_30',
        nameFa: 'پرس بالاسینه اسمیت یا ماشین ۱۵ تا ۳۰°',
        repsRange: '۸ تا ۱۰',
        setsByWeek: [2, 3, 3, 3],
        notesFa: 'مسیر ثابت هدایت‌شده برای ایمنی شانه',
        muscleGroup: 'chest',
        isCompound: true
      },
      {
        exerciseId: 'flat_machine_chest_press',
        nameFa: 'پرس سینه ماشین تخت',
        repsRange: '۸ تا ۱۲',
        setsByWeek: [1, 1, 2, 2],
        notesFa: 'تنظیم ارتفاع صندلی تا دستگیره‌ها هم‌تراز میانه سینه باشند',
        muscleGroup: 'chest',
        isCompound: true
      },
      {
        exerciseId: 'high_to_low_cable_crossover',
        nameFa: 'کراس‌اوور کابل بالا به پایین یا پک‌دک',
        repsRange: '۱۲ تا ۱۵',
        setsByWeek: [0, 1, 2, 2],
        notesFa: 'انقباض پیک در پایین سینه',
        muscleGroup: 'chest',
        isCompound: false
      },
      {
        exerciseId: 'dumbbell_machine_lateral_raise',
        nameFa: 'نشر جانب دمبل یا ماشین',
        repsRange: '۱۲ تا ۲۰',
        setsByWeek: [2, 2, 3, 3],
        notesFa: 'کف دست‌ها کمی رو به پایین، بدون بالا انداختن کول',
        muscleGroup: 'shoulders',
        isCompound: false
      },
      {
        exerciseId: 'single_arm_triceps_pushdown',
        nameFa: 'پشت‌بازو پرس‌داون تک‌دست',
        repsRange: '۱۰ تا ۱۵',
        setsByWeek: [1, 2, 2, 2],
        notesFa: 'آرنج چسبیده به پهلو با کنترل کامل فاز منفی',
        muscleGroup: 'triceps',
        isCompound: false
      }
    ]
  },
  {
    id: 'legs_arms_b',
    dayNumber: 7,
    titleFa: 'روز ۷: Legs + Arms B (پا و بازو B)',
    exercises: [
      {
        exerciseId: 'leg_extension_safe_rom',
        nameFa: 'لگ اکستنشن',
        repsRange: '۱۲ تا ۲۰',
        setsByWeek: [1, 2, 3, 3],
        notesFa: 'دامنه حرکتی (ROM) کاملاً بدون درد برای کشکک زانو',
        muscleGroup: 'legs',
        isCompound: false
      },
      {
        exerciseId: 'light_db_rdl',
        nameFa: 'رومانیایی دمبل سبک',
        repsRange: '۸ تا ۱۲',
        setsByWeek: [1, 2, 3, 3],
        notesFa: 'فقط لولای لگن؛ بدون گرد شدن کمر و بدون بار اضافی',
        muscleGroup: 'legs',
        isCompound: true
      },
      {
        exerciseId: 'standing_calf_raise_slow_eccentric',
        nameFa: 'ساق ایستاده، فاز منفی کند',
        repsRange: '۱۰ تا ۱۵',
        setsByWeek: [0, 2, 3, 3], // از هفته ۲
        notesFa: 'از هفته ۲، فقط اگر تاندون آشیل بدون درد اجازه داد',
        muscleGroup: 'legs',
        isCompound: false
      },
      {
        exerciseId: 'incline_hammer_curl',
        nameFa: 'جلوبازو چکشی اینکلاین',
        repsRange: '۱۰ تا ۱۴',
        setsByWeek: [1, 2, 3, 3],
        notesFa: 'تقویت براکیالیس و ساعد با مچ خنثی',
        muscleGroup: 'biceps',
        isCompound: false
      },
      {
        exerciseId: 'jm_press_smith_db',
        nameFa: 'JM پرس (اسمیت یا دمبل)',
        repsRange: '۸ تا ۱۲',
        setsByWeek: [2, 2, 3, 3],
        notesFa: 'اگر آرنج یا شانه اذیت شد، بلافاصله با پرس‌داون جایگزین شود',
        muscleGroup: 'triceps',
        isCompound: true
      },
      {
        exerciseId: 'cable_lateral_raise_b',
        nameFa: 'نشر جانب کابل',
        repsRange: '۱۵ تا ۲۰',
        setsByWeek: [0, 1, 2, 2],
        notesFa: 'تکمیل حجم دلتوئید میانی در انتهای هفته',
        muscleGroup: 'shoulders',
        isCompound: false
      },
      {
        exerciseId: 'cable_crunch_b',
        nameFa: 'کرانچ کابل',
        repsRange: '۱۲ تا ۱۵',
        setsByWeek: [0, 1, 2, 2],
        notesFa: 'تثبیت عضلات میان‌تنه',
        muscleGroup: 'abs',
        isCompound: false
      }
    ]
  }
];

export const SAFETY_AND_PREHAB_RULES = {
  rightShoulder: {
    titleFa: 'پروتکل شانه راست',
    bannedExercisesFa: ['پرس سینه هالتر', 'پرس سرشانه بالای سر (OHP)', 'نشر بالاتر از سطح شانه', 'بارفیکس وزنه‌دار'],
    prehabRoutineFa: 'قبل از هر جلسه Push: ۲ ست ۱۵ تکرار چرخش خارجی با کابل (Cable External Rotation)',
    painRuleFa: 'درد تا ۳ از ۱۰ قابل قبول است به شرطی که تا ۲۴ ساعت رفع شود. درد ۴ یا بالاتر یا تیرکشیدن = تعویض فوری حرکت.'
  },
  kneeAndAchilles: {
    titleFa: 'پروتکل زانو و تاندون آشیل',
    bannedExercisesFa: ['اسکوات آزاد هالتر', 'لانج (Lunge)', 'پرش و حرکات پلایومتریک'],
    safeFootPlacementFa: 'در لگ‌پرس: پاها وسط تا کمی بالا، پاشنه‌ها محکم روی صفحه، بدون قفل‌کردن زانو در بالا.',
    dorsiflexionStretchFa: 'کشش روزانه زانو به دیوار (Dorsiflexion): ۲ ست ۳۰ تا ۴۵ ثانیه برای هر پا.',
    calfProgressionFa: 'ساق نشسته با ۲ ثانیه مکث در پایین؛ ساق ایستاده فقط از هفته ۲ در صورت آمادگی آشیل.'
  },
  nutritionTargets: {
    maintenanceKcal: '۲۸۰۰ تا ۳۱۰۰ کیلوکالری',
    surplusTargetKcal: '۳۱۰۰ تا ۳۳۰۰ کیلوکالری (+۲۵۰ تا +۳۵۰ کالری)',
    targetWeightGainRate: '+۰.۲۵ تا +۰.۵۰ کیلوگرم در هفته',
    proteinGramsPerKg: '۱.۶ تا ۲.۲ گرم بر کیلوگرم (حدود ۱۲۰ تا ۱۶۰ گرم)',
    fatsMinimum: 'حداقل ۰.۷ گرم بر کیلوگرم (بقیه کربوهیدرات)',
    creatineDaily: '۳ تا ۵ گرم روزانه بدون فاز بارگیری'
  },
  autoregulation: {
    ruleFa: 'پیش از شروع جلسه، آمادگی از ۱ تا ۱۰ سنجیده می‌شود. اگر آمادگی زیر ۶ باشد، یک ست از تمام حرکات آن جلسه کسر می‌شود.'
  },
  deloadTriggers: {
    ruleFa: 'هفته ۴ ادامه هفته ۳ است، مگر اینکه حداقل دو مورد از موارد زیر رخ دهد که در این صورت فاز دیلود فعال می‌شود:',
    triggersFa: [
      'افت عملکرد در یک حرکت در دو جلسه متوالی',
      'چند شب متوالی خواب ضعیف',
      'درد مفصل رو به افزایش',
      'خستگی یا بی‌انگیزگی مداوم'
    ],
    deloadActionFa: 'در دیلود: ست‌ها به نصف کاهش می‌یابد، وزنه در حدود ۸۵ تا ۹۰٪ حفظ می‌شود و RIR روی ۴ تنظیم می‌گردد.'
  }
};
