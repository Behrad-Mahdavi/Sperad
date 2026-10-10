export interface RepMaxModel {
  name: 'epley' | 'brzycki' | string;
  percent: (repsToFailure: number) => number;
}
