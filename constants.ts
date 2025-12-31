import { Language } from './types';

export const UI_TEXT = {
  [Language.EN]: {
    appTitle: 'MathSolver MY',
    appSubtitle: 'Solve Math Problems Instantly!',
    uploadButton: 'Upload Question Image',
    uploadPrompt: 'Tap here to upload a math question image or take a photo.',
    processing: 'Solving your problem...',
    error: 'Error: Failed to solve the problem. Please try again.',
    solutionTitle: 'Solution',
    steps: 'Steps',
    englishTab: 'English',
    bahasaMelayuTab: 'Bahasa Melayu',
    noSolution: 'No solution available yet. Please upload an image to start.',
    selectLanguage: 'Select Language',
    modelError: 'Failed to get solution from model. Please ensure the image is clear and contains a solvable math problem.',
    apiError: 'API Error: Please check your network connection or API key.',
    clear: 'Clear',
    cropImage: 'Crop Image',
    zoom: 'Zoom',
    rotate: 'Rotate',
    cropButton: 'Crop',
    cancelButton: 'Cancel',
    loadingImage: 'Loading image...',
    imageLoadError: 'Failed to load image for cropping.',
    apiKeyRequiredTitle: 'API Key Required',
    apiKeyRequiredMessage: 'To use advanced Gemini models for image solving, you need to select an API key linked to a paid Google Cloud Project.',
    selectApiKeyButton: 'Select API Key',
    billingInfo: 'View billing information',
  },
  [Language.MS]: {
    appTitle: 'Penyelesai Matematik MY',
    appSubtitle: 'Selesaikan Masalah Matematik Serta-Merta!',
    uploadButton: 'Muat Naik Gambar Soalan',
    uploadPrompt: 'Ketuk di sini untuk memuat naik gambar soalan matematik atau ambil foto.',
    processing: 'Menyelesaikan masalah anda...',
    error: 'Ralat: Gagal menyelesaikan masalah. Sila cuba lagi.',
    solutionTitle: 'Penyelesaian',
    steps: 'Langkah-langkah',
    englishTab: 'Inggeris',
    bahasaMelayuTab: 'Bahasa Melayu',
    noSolution: 'Tiada penyelesaian tersedia lagi. Sila muat naik imej untuk bermula.',
    selectLanguage: 'Pilih Bahasa',
    modelError: 'Gagal mendapatkan penyelesaian daripada model. Sila pastikan imej jelas dan mengandungi masalah matematik yang boleh diselesaikan.',
    apiError: 'Ralat API: Sila semak sambungan rangkaian atau kunci API anda.',
    clear: 'Padam',
    cropImage: 'Pangkas Imej',
    zoom: 'Zum',
    rotate: 'Putar',
    cropButton: 'Pangkas',
    cancelButton: 'Batal',
    loadingImage: 'Memuatkan imej...',
    imageLoadError: 'Gagal memuatkan imej untuk pemangkasan.',
    apiKeyRequiredTitle: 'Kunci API Diperlukan',
    apiKeyRequiredMessage: 'Untuk menggunakan model Gemini lanjutan bagi penyelesaian imej, anda perlu memilih kunci API yang disambungkan kepada Projek Google Cloud berbayar.',
    selectApiKeyButton: 'Pilih Kunci API',
    billingInfo: 'Lihat maklumat pengebilan',
  },
};

export const GEMINI_MODEL_IMAGE = 'gemini-3-pro-image-preview';
// export const GEMINI_MODEL_IMAGE = 'gemini-2.5-flash-image'; // Alternative faster model

export const MATH_PROBLEM_PROMPT_TEMPLATE = `
You are a highly skilled math tutor for Malaysian students. Your task is to solve the given math problem from the image.
Provide a clear, step-by-step solution in both Bahasa Melayu and English, suitable for students from primary, secondary, SPM, and IGCSE levels.

Rules for response:
1.  **Format**: Respond with a JSON object strictly adhering to the 'ApiResponse' interface provided below.
    \`\`\`typescript
    interface ApiResponse {
      solution: {
        titleEn: string;
        titleMs: string;
        solutionEn: string;
        solutionMs: string;
        stepsEn: string[];
        stepsMs: string[];
      };
    }
    \`\`\`
2.  **Mathematical Symbols**: Use standard mathematical symbols (e.g., +, -, ×, ÷, =, <, >, ≤, ≥, ≠, √, π, ^, %, fractions like 1/2, a/b, or proper fraction notation when possible, e.g., ½) instead of writing out words (e.g., use '÷' not 'divided by', use '½' not 'one half').
3.  **Clarity**: Keep the language simple and direct.
4.  **Steps**: Each step in 'stepsEn' and 'stepsMs' should be a concise string explaining a single logical progression. Ensure steps are numbered correctly.
5.  **Language Consistency**: Ensure the English solution is fully in English and the Bahasa Melayu solution is fully in Bahasa Melayu.

Example Structure for a simple problem:
{
  "solution": {
    "titleEn": "Solving for X",
    "titleMs": "Mencari nilai X",
    "solutionEn": "The value of X is 5.",
    "solutionMs": "Nilai X ialah 5.",
    "stepsEn": [
      "1. Given the equation: X + 3 = 8",
      "2. Subtract 3 from both sides: X + 3 - 3 = 8 - 3",
      "3. Simplify: X = 5"
    ],
    "stepsMs": [
      "1. Diberi persamaan: X + 3 = 8",
      "2. Tolak 3 dari kedua-dua belah: X + 3 - 3 = 8 - 3",
      "3. Permudahkan: X = 5"
    ]
  }
}

Now, solve the math problem in the image.
`;

export const BILLING_DOCS_URL = 'https://ai.google.dev/gemini-api/docs/billing';