import { z } from 'zod';

export const SetSchema = z.object({
  id: z.string().uuid().optional(),
  clientUuid: z.string().uuid(),
  sessionId: z.string().uuid(),
  exerciseId: z.string().min(1),
  setNumber: z.number().int().min(1),
  loadKg: z.number().min(0),
  reps: z.number().int().min(1).max(100),
  rir: z.number().min(0).max(10).nullable().default(null),
  restSeconds: z.number().int().min(0).default(90),
  isWarmup: z.boolean().default(false),
  supersededBy: z.string().uuid().nullable().default(null),
  performedAt: z.string().datetime(),
  notes: z.string().max(500).optional()
});

export type Set = z.infer<typeof SetSchema>;

export const CreateSetInputSchema = SetSchema.omit({
  id: true,
  supersededBy: true
});

export type CreateSetInput = z.infer<typeof CreateSetInputSchema>;
