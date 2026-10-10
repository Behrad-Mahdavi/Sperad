import { describe, it, expect } from 'vitest';
import { run52WeekSimulation } from '@sperad/engine';

describe('Simulator Runner Package', () => {
  it('runs synthetic user trajectory successfully', () => {
    const report = run52WeekSimulation();
    expect(report.weeksSimulated).toBe(52);
    expect(report.safetyViolations).toBe(0);
    expect(report.invariantsPassed.loadJumpCapped).toBe(true);
  });
});
