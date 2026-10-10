import { z } from 'zod';

export const DailyCheckinSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  checkinDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  sleepHours: z.number().min(0).max(24),
  sleepQuality: z.number().int().min(1).max(5), // 1 to 5
  stressLevel: z.number().int().min(1).max(5),  // 1 to 5 (1 lowest, 5 highest)
  motivation: z.number().int().min(1).max(5),   // 1 to 5
  // Soreness per muscle: 0 (none) to 4 (severe)
  muscleSoreness: z.record(z.string(), z.number().int().min(0).max(4)).default({}),
  restingHeartRate: z.number().int().min(30).max(220).nullable().default(null),
  hrvMs: z.number().min(0).max(300).nullable().default(null),
  notes: z.string().max(500).optional(),
  createdAt: z.string().datetime().optional()
});

export type DailyCheckin = z.infer<typeof DailyCheckinSchema>;
