import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { MATH_PROBLEM_PROMPT_TEMPLATE } from '../constants';
import { ApiResponse } from '../types';

/**
 * Converts a File object to a base64 encoded string.
 * @param file The File object to convert.
 * @returns A promise that resolves with the base64 string or rejects with an error.
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const base64String = reader.result.split(',')[1]; // Extract base64 part
        resolve(base64String);
      } else {
        reject(new Error('Failed to read file as data URL.'));
      }
    };
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Solves a math problem using the Gemini API by providing an image and a prompt.
 * @param imageFile The image file containing the math question.
 * @param modelName The Gemini model to use (e.g., 'gemini-3-pro-image-preview').
 * @returns A promise that resolves with the structured MathSolution or rejects with an error.
 */
export async function solveMathProblem(imageFile: File, modelName: string): Promise<ApiResponse> {
  // The API_KEY is expected to be available via process.env.API_KEY,
  // which is handled by window.aistudio.openSelectKey in App.tsx.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const base64ImageData = await fileToBase64(imageFile);

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: modelName,
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: imageFile.type,
            data: base64ImageData,
          },
        },
        {
          text: MATH_PROBLEM_PROMPT_TEMPLATE,
        },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          solution: {
            type: Type.OBJECT,
            properties: {
              titleEn: { type: Type.STRING },
              titleMs: { type: Type.STRING },
              solutionEn: { type: Type.STRING },
              solutionMs: { type: Type.STRING },
              stepsEn: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              stepsMs: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['titleEn', 'titleMs', 'solutionEn', 'solutionMs', 'stepsEn', 'stepsMs'],
          },
        },
        required: ['solution'],
      },
    },
  });

  const jsonStr = response.text?.trim();

  if (!jsonStr) {
    throw new Error('Model returned an empty response or invalid JSON.');
  }

  try {
    const parsedResponse: ApiResponse = JSON.parse(jsonStr);
    return parsedResponse;
  } catch (parseError) {
    console.error('Failed to parse JSON response:', jsonStr, parseError);
    throw new Error('Failed to parse model response as JSON. Received: ' + jsonStr);
  }
}