import { z } from 'zod';

export const MovementPatternEnum = z.enum([
  'horizontal_push',
  'vertical_push',
  'horizontal_pull',
  'vertical_pull',
  'squat',
  'hinge',
  'lunge',
  'isolation_arms',
  'isolation_delts',
  'isolation_chest',
  'isolation_back',
  'isolation_legs',
  'isolation_calves',
  'isolation_core'
]);

export type MovementPattern = z.infer<typeof MovementPatternEnum>;

export const EquipmentTypeEnum = z.enum([
  'barbell',
  'dumbbell',
  'cable',
  'machine',
  'bodyweight',
  'smith_machine'
]);

export type EquipmentType = z.infer<typeof EquipmentTypeEnum>;

export const JointFatigueVectorSchema = z.object({
  shoulder: z.number().min(0).max(1).default(0),
  elbow: z.number().min(0).max(1).default(0),
  knee: z.number().min(0).max(1).default(0),
  lowerBack: z.number().min(0).max(1).default(0),
  wrist: z.number().min(0).max(1).default(0)
});

export type JointFatigueVector = z.infer<typeof JointFatigueVectorSchema>;

export const MuscleParticipationSchema = z.object({
  muscleId: z.string().min(1),
  weight: z.number().min(0.01).max(1.0)
});

export type MuscleParticipation = z.infer<typeof MuscleParticipationSchema>;

export const ExerciseSchema = z.object({
  id: z.string().min(1),
  nameEn: z.string().min(1),
  nameFa: z.string().min(1),
  movementPattern: MovementPatternEnum,
  equipment: EquipmentTypeEnum,
  primaryMuscles: z.array(MuscleParticipationSchema).min(1),
  secondaryMuscles: z.array(MuscleParticipationSchema).default([]),
  sfrPrior: z.number().min(0).max(1).default(0.8),
  jointFatigue: JointFatigueVectorSchema.default({}),
  systemicFatigue: z.number().min(0).max(1).default(0.5),
  lengthBias: z.number().min(0).max(1).default(0.5),
  estimatedTimeSec: z.number().int().min(30).default(150),
  defaultLoadIncrementKg: z.number().positive().default(2.5),
  e1rmConversionFactor: z.number().positive().default(1.0),
  source: z.enum(['prior', 'fitted']).default('prior'),
  isActive: z.boolean().default(true)
});

export type Exercise = z.infer<typeof ExerciseSchema>;
