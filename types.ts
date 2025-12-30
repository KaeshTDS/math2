export enum Language {
  EN = 'en',
  MS = 'ms',
}

export interface MathSolution {
  titleEn: string;
  titleMs: string;
  solutionEn: string;
  solutionMs: string;
  stepsEn: string[];
  stepsMs: string[];
}

export interface ApiResponse {
  solution: MathSolution;
}