import { z } from 'zod';

export const MuscleGroupEnum = z.enum([
  'chest',
  'back',
  'shoulders',
  'arms',
  'legs',
  'core'
]);

export type MuscleGroup = z.infer<typeof MuscleGroupEnum>;

export const MuscleSchema = z.object({
  id: z.string().min(1),
  nameEn: z.string().min(1),
  nameFa: z.string().min(1),
  group: MuscleGroupEnum,
  maxSetsPerSession: z.number().int().min(1).default(10),
  defaultMev: z.number().min(0).default(8),
  defaultMrv: z.number().min(0).default(20),
  description: z.string().optional()
});

export type Muscle = z.infer<typeof MuscleSchema>;
