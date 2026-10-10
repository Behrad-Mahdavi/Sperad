import { z } from 'zod';

export const DecisionTypeEnum = z.enum([
  'load_recommendation',
  'add_set',
  'maintain_volume',
  'reduce_volume',
  'swap_exercise',
  'suggest_deload',
  're_entry_transition',
  'plateau_detected'
]);

export type DecisionType = z.infer<typeof DecisionTypeEnum>;

export const DecisionConfidenceEnum = z.enum(['low', 'medium', 'high']);
export type DecisionConfidence = z.infer<typeof DecisionConfidenceEnum>;

export const DecisionLogSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  timestamp: z.string().datetime(),
  decisionType: DecisionTypeEnum,
  scope: z.record(z.string(), z.any()),
  inputs: z.array(z.string()),
  estimates: z.record(z.string(), z.any()).default({}),
  rulesFired: z.array(z.string()).default([]),
  counterfactual: z.string().optional(),
  confidence: DecisionConfidenceEnum.default('medium'),
  explanationEn: z.string(),
  explanationFa: z.string(),
  modelVersion: z.string().default('engine@0.1.0')
});

export type DecisionLog = z.infer<typeof DecisionLogSchema>;
