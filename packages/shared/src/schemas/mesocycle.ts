import { z } from 'zod';

export const MesocyclePhaseEnum = z.enum([
  'accumulation',
  'intensification',
  'peaking',
  'deload',
  're_entry'
]);

export type MesocyclePhase = z.infer<typeof MesocyclePhaseEnum>;

export const MesocycleGoalEnum = z.enum([
  'hypertrophy',
  'strength',
  'maintenance',
  'recomp',
  'fat_loss'
]);

export type MesocycleGoal = z.infer<typeof MesocycleGoalEnum>;

export const MesocycleStatusEnum = z.enum([
  'draft',
  'active',
  'completed',
  'aborted'
]);

export type MesocycleStatus = z.infer<typeof MesocycleStatusEnum>;

export const MesocycleSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  name: z.string().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weeksCount: z.number().int().min(1).max(12).default(4),
  phase: MesocyclePhaseEnum.default('accumulation'),
  goal: MesocycleGoalEnum.default('hypertrophy'),
  status: MesocycleStatusEnum.default('draft'),
  modelVersion: z.string().default('engine@0.1.0'),
  createdAt: z.string().datetime().optional()
});

export type Mesocycle = z.infer<typeof MesocycleSchema>;
