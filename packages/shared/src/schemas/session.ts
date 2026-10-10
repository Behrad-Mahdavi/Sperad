import { z } from 'zod';

export const WorkoutSessionSchema = z.object({
  id: z.string().uuid().optional(),
  clientUuid: z.string().uuid(),
  userId: z.string().uuid().optional(),
  mesocycleId: z.string().uuid().nullable().default(null),
  plannedSessionId: z.string().uuid().nullable().default(null),
  name: z.string().min(1).default('تمرین باشگاه'),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable().default(null),
  readinessScore: z.number().min(0).max(1).nullable().default(null),
  srpe: z.number().min(1).max(10).nullable().default(null),
  notes: z.string().max(1000).optional()
});

export type WorkoutSession = z.infer<typeof WorkoutSessionSchema>;
