/**
 * Algorithm 5-D: Structured Explainability & Decisions Logger
 * Formats every engine decision into a machine-reproducible structured object
 * with bilingual human-readable rationales and counterfactuals.
 */

export interface StructuredDecisionPayload {
  decision:
    | 'load_recommendation'
    | 'add_set'
    | 'maintain_volume'
    | 'reduce_volume'
    | 'swap_exercise'
    | 'suggest_deload'
    | 're_entry_transition'
    | 'plateau_detected';
  scope: Record<string, any>;
  inputs: string[];
  estimates: Record<string, any>;
  rulesFired: string[];
  counterfactual?: string;
  confidence: 'low' | 'medium' | 'high';
  explanationEn: string;
  explanationFa: string;
  modelVersion?: string;
}

export function createDecisionLog(
  payload: StructuredDecisionPayload
): StructuredDecisionPayload & { timestamp: string; modelVersion: string } {
  return {
    ...payload,
    timestamp: new Date().toISOString(),
    modelVersion: payload.modelVersion || 'engine@0.1.0'
  };
}
