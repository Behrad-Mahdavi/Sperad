import { z } from 'zod';

export const BodyMetricsSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  recordedAt: z.string().datetime(),
  weightKg: z.number().positive().max(300),
  waistCm: z.number().positive().max(200).nullable().default(null),
  chestCm: z.number().positive().max(250).nullable().default(null),
  armsCm: z.number().positive().max(100).nullable().default(null),
  thighsCm: z.number().positive().max(120).nullable().default(null),
  calvesCm: z.number().positive().max(80).nullable().default(null),
  photoStoragePath: z.string().nullable().default(null),
  notes: z.string().max(500).optional()
});

export type BodyMetrics = z.infer<typeof BodyMetricsSchema>;
