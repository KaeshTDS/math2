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

// Define the AIStudio interface as per the coding guidelines for window.aistudio
// Exported AIStudio to resolve "Subsequent property declarations" TypeScript error
export interface AIStudio {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
}

// Extend Window interface for aistudio object
declare global {
  interface Window {
    aistudio?: AIStudio;
  }
}