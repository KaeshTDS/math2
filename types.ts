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
// Removed 'export' as AIStudio is only used within this file for the global declaration.
interface AIStudio {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
}

// Extend Window interface for aistudio object
declare global {
  interface Window {
    aistudio?: AIStudio;
  }
}