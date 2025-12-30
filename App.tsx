import React, { useState, useCallback, useEffect } from 'react';
import { Language, MathSolution, ApiResponse } from './types';
import { UI_TEXT, GEMINI_MODEL_IMAGE } from './constants';
import { solveMathProblem } from './services/geminiService';
import LanguageSwitcher from './components/LanguageSwitcher';
import FileUpload from './components/FileUpload';

// Helper component for displaying solution details
interface SolutionDetailsProps {
  title: string;
  solution: string;
  steps: string[];
}

const SolutionDetails: React.FC<SolutionDetailsProps> = ({ title, solution, steps }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-700">{title}</h3>
      <p className="text-lg text-gray-900 leading-relaxed">{solution}</p>
      <h4 className="text-lg font-medium text-gray-700 mt-6">Langkah-langkah:</h4>
      <ol className="list-decimal list-inside space-y-2 text-gray-800">
        {steps.map((step, index) => (
          <li key={index} className="pl-2 leading-relaxed">{step}</li>
        ))}
      </ol>
    </div>
  );
};

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [solution, setSolution] = useState<MathSolution | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>(Language.EN);
  const [activeTab, setActiveTab] = useState<Language>(Language.EN);

  const text = UI_TEXT[language];

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    setSolution(null);
    setError(null);
  }, []);

  const handleClear = useCallback(() => {
    setSelectedFile(null);
    setSolution(null);
    setError(null);
    setLoading(false);
  }, []);

  const handleLanguageChange = useCallback((lang: Language) => {
    setLanguage(lang);
    setActiveTab(lang); // Keep active tab in sync with overall language
  }, []);

  // Effect to solve math problem when a file is selected
  useEffect(() => {
    const fetchSolution = async () => {
      if (!selectedFile) return;

      setLoading(true);
      setError(null);
      setSolution(null);

      try {
        const response: ApiResponse = await solveMathProblem(selectedFile, GEMINI_MODEL_IMAGE);
        if (response?.solution) {
          setSolution(response.solution);
        } else {
          setError(text.modelError);
        }
      } catch (err: any) {
        console.error('Error solving math problem:', err);
        if (err.message.includes('API_KEY is not defined')) {
          setError(text.apiError);
        } else if (err.message.includes('Failed to parse model response')) {
          setError(text.modelError + ' ' + err.message);
        } else {
          setError(text.error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSolution();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFile, text]); // Re-run if selectedFile changes or if text (derived from language) changes for error messages.

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-blue-100 to-purple-100 p-4 sm:p-6 lg:p-8">
      <header className="w-full max-w-3xl text-center py-6">
        <h1 className="text-4xl md:text-5xl font-extrabold text-blue-800 tracking-tight mb-2">{text.appTitle}</h1>
        <p className="text-xl md:text-2xl text-purple-700 font-medium">{text.appSubtitle}</p>
        <div className="mt-4 flex justify-center">
          <LanguageSwitcher currentLanguage={language} onLanguageChange={handleLanguageChange} />
        </div>
      </header>

      <main className="flex-grow w-full max-w-3xl bg-white rounded-xl shadow-xl p-6 sm:p-8 lg:p-10 mb-8 flex flex-col">
        <FileUpload
          onFileSelect={handleFileSelect}
          currentLanguage={language}
          selectedFile={selectedFile}
          onClear={handleClear}
        />

        {loading && (
          <div className="flex flex-col items-center justify-center py-8 text-blue-600">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
            <p className="text-lg font-medium">{text.processing}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative mt-6" role="alert">
            <strong className="font-bold">Oops!</strong>
            <span className="block sm:inline ml-2">{error}</span>
          </div>
        )}

        {solution && (
          <div className="mt-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b-2 border-blue-200 pb-2">{text.solutionTitle}</h2>

            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab(Language.EN)}
                className={`py-2 px-4 text-sm md:text-base font-medium transition-colors duration-200
                  ${activeTab === Language.EN
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                {text.englishTab}
              </button>
              <button
                onClick={() => setActiveTab(Language.MS)}
                className={`py-2 px-4 text-sm md:text-base font-medium transition-colors duration-200
                  ${activeTab === Language.MS
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                {text.bahasaMelayuTab}
              </button>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg shadow-inner max-h-96 overflow-y-auto">
              {activeTab === Language.EN && (
                <SolutionDetails
                  title={solution.titleEn}
                  solution={solution.solutionEn}
                  steps={solution.stepsEn}
                />
              )}
              {activeTab === Language.MS && (
                <SolutionDetails
                  title={solution.titleMs}
                  solution={solution.solutionMs}
                  steps={solution.stepsMs}
                />
              )}
            </div>
          </div>
        )}

        {!selectedFile && !loading && !error && !solution && (
          <div className="flex-grow flex items-center justify-center text-gray-500 text-xl font-light py-12 text-center">
            <p>{text.noSolution}</p>
          </div>
        )}
      </main>

      <footer className="w-full max-w-3xl text-center py-4 text-gray-600 text-sm">
        &copy; {new Date().getFullYear()} MathSolver MY. All rights reserved.
      </footer>
    </div>
  );
}

export default App;