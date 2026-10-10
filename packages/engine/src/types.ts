export interface RepMaxModel {
  name: 'epley' | 'brzycki' | string;
  percent: (repsToFailure: number) => number;
}

export const epleyModel: RepMaxModel = {
  name: 'epley',
  percent: (n: number) => {
    if (n <= 0) return 1.0;
    return 1.0 / (1.0 + 0.0333 * n);
  }
};

export const brzyckiModel: RepMaxModel = {
  name: 'brzycki',
  percent: (n: number) => {
    if (n <= 1) return 1.0;
    if (n >= 37) return 0.25; // numerical safeguard
    return (37 - n) / 36;
  }
};
