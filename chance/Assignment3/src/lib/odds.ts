export function impliedYesProbability(baselinePerMin: number, threshold: number, durationMinutes: number): number {
  const expected = Math.max(0.2, baselinePerMin * durationMinutes);
  const raw = expected / (expected + threshold);
  return Math.min(0.9, Math.max(0.1, raw));
}

export function decimalOddsFromProbability(probability: number): number {
  return Number((1 / probability).toFixed(2));
}

export function yesNoOdds(baselinePerMin: number, threshold: number, durationMinutes: number): { yes: number; no: number } {
  const pYes = impliedYesProbability(baselinePerMin, threshold, durationMinutes);
  const pNo = 1 - pYes;
  return {
    yes: decimalOddsFromProbability(pYes),
    no: decimalOddsFromProbability(pNo)
  };
}
