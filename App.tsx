import React, { useState, useCallback, useEffect } from 'react';
import { Language, MathSolution, ApiResponse } from './types';
import { UI_TEXT, GEMINI_MODEL_IMAGE, BILLING_DOCS_URL, STRIPE_PUBLIC_KEY, PREMIUM_PRODUCT_NAME, PREMIUM_PRODUCT_PRICE, STRIPE_PAYMENT_LINK } from './constants';
import { solveMathProblem } from './services/geminiService';
import LanguageSwitcher from './components/LanguageSwitcher';
import FileUpload from './components/FileUpload';
import { loadStripe } from '@stripe/stripe-js';

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

// Removed mock createStripeCheckoutSession as we are now using a direct payment link

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [solution, setSolution] = useState<MathSolution | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>(Language.EN);
  const [activeTab, setActiveTab] = useState<Language>(Language.EN);
  const [hasSelectedApiKey, setHasSelectedApiKey] = useState<boolean>(false); // New state for API key selection
  const [isPremiumUser, setIsPremiumUser] = useState<boolean>(false); // New state for premium access
  const [purchaseLoading, setPurchaseLoading] = useState<boolean>(false);
  const [proceedWithApiKey, setProceedWithApiKey] = useState<boolean>(false); // New state to control API key access

  const text = UI_TEXT[language];

  // Check API key and Premium status on mount
  useEffect(() => {
    const checkStatus = async () => {
      // Check premium status from localStorage first
      const storedPremium = localStorage.getItem('isPremiumUser');
      if (storedPremium === 'true') {
        setIsPremiumUser(true);
        // Premium users automatically bypass API key checks, so set hasSelectedApiKey to true conceptually
        setHasSelectedApiKey(true);
        return;
      }

      // If not premium, check user's own API key for display on the selection screen
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        const keySelected = await window.aistudio.hasSelectedApiKey();
        setHasSelectedApiKey(keySelected);
      } else {
        // Fallback for environments without window.aistudio, assume key is present via env var
        setHasSelectedApiKey(!!process.env.API_KEY);
      }
    };
    checkStatus();
  }, []);

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
    // If not premium, always return to the entry screen after clearing
    if (!isPremiumUser) {
      setProceedWithApiKey(false);
    }
  }, [isPremiumUser]);

  const handleLanguageChange = useCallback((lang: Language) => {
    setLanguage(lang);
    setActiveTab(lang); // Keep active tab in sync with overall language
  }, []);

  // Function to handle API key selection (on the entry screen)
  const handleSelectApiKey = useCallback(async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      await window.aistudio.openSelectKey();
      // Assume success and update hasSelectedApiKey. User still needs to click 'Continue'
      setHasSelectedApiKey(true);
      setError(null); // Clear any previous API key related errors
    } else {
      setError("window.aistudio is not available for API key selection. Ensure you're in an AI Studio environment or using a configured API_KEY env var.");
    }
  }, []);

  // Function to handle continuing with an existing API key
  const handleProceedWithApiKey = useCallback(() => {
    setProceedWithApiKey(true);
    setError(null); // Clear any previous errors
  }, []);

  // Function to handle Premium purchase
  const handlePurchasePremium = useCallback(async () => {
    setPurchaseLoading(true);
    setError(null);
    try {
      // Open the Stripe Payment Link in a new tab
      window.open(STRIPE_PAYMENT_LINK, '_blank');

      // For this frontend-only demo, we'll simulate a successful payment after a delay
      // In a real application, you'd use webhooks or check a return URL
      await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate time for user to complete payment

      // After simulated successful payment/redirection
      setIsPremiumUser(true);
      setHasSelectedApiKey(true); // Premium user status covers API key need
      localStorage.setItem('isPremiumUser', 'true');
      console.log(text.purchaseSuccess);
      setError(null); // Clear any payment-related error
      setProceedWithApiKey(true); // Also allow proceeding since they are premium

    } catch (e: any) {
      console.error('Purchase error:', e);
      setError(text.purchaseError + (e.message ? `: ${e.message}` : ''));
      setIsPremiumUser(false);
      localStorage.setItem('isPremiumUser', 'false');
    } finally {
      setPurchaseLoading(false);
    }
  }, [text.purchaseError, text.purchaseSuccess]);


  // Effect to solve math problem when a file is selected
  useEffect(() => {
    const fetchSolution = async () => {
      // Only proceed if file is selected AND (premium user OR user chose to proceed with API key)
      if (!selectedFile || (!isPremiumUser && !proceedWithApiKey)) return;

      setLoading(true);
      setError(null);
      setSolution(null);

      try {
        // Create a new GoogleGenAI instance right before making an API call
        // to ensure it always uses the most up-to-date API key from the dialog.
        const response: ApiResponse = await solveMathProblem(selectedFile, GEMINI_MODEL_IMAGE);
        if (response?.solution) {
          setSolution(response.solution);
        } else {
          setError(text.modelError);
        }
      } catch (err: any) {
        console.error('Error solving math problem:', err);
        // Handle specific error for API key issue if not a premium user
        if (!isPremiumUser && err.message.includes('Requested entity was not found.')) {
          setError(text.apiKeyRequiredMessage); // Provide user-friendly message
          setHasSelectedApiKey(false); // Reset API key state to prompt re-selection
          setProceedWithApiKey(false); // Force user back to selection screen
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
  }, [selectedFile, text, isPremiumUser, proceedWithApiKey]); // Re-run if selectedFile changes or if premium/proceed status changes

  // Determine if the full app (FileUpload + Solution) should be rendered
  // Only render full app if premium OR user explicitly decided to proceed with API key
  const showFullApp = isPremiumUser || proceedWithApiKey;

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
        {!showFullApp ? (
          <div className="flex flex-col items-center justify-center p-8 text-center bg-blue-50 rounded-lg border-2 border-blue-200">
            <h2 className="text-2xl font-bold text-blue-800 mb-4">{text.apiKeyRequiredTitle}</h2>
            <p className="text-lg text-gray-700 mb-6 max-w-prose">
              {text.apiKeyRequiredMessage}
            </p>

            <div className="flex flex-col items-center space-y-4 w-full max-w-sm">
              {hasSelectedApiKey ? (
                // If API key is already selected, show 'Continue' button
                <button
                  onClick={handleProceedWithApiKey}
                  className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 w-full"
                  disabled={purchaseLoading}
                >
                  {text.continueWithApiKeyButton || 'Continue with My API Key'}
                </button>
              ) : (
                // Otherwise, show 'Select API Key' button
                <button
                  onClick={handleSelectApiKey}
                  className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 w-full"
                  disabled={purchaseLoading}
                >
                  {text.selectApiKeyButton}
                </button>
              )}
              <a
                href={BILLING_DOCS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm"
              >
                {text.billingInfo}
              </a>

              <div className="relative w-full my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-blue-50 px-2 text-gray-500">OR</span>
                </div>
              </div>

              <h3 className="text-xl font-bold text-purple-700 mb-2">{text.premiumAccessTitle}</h3>
              <p className="text-md text-gray-600 mb-4">{text.premiumAccessMessage}</p>

              <button
                onClick={handlePurchasePremium}
                className="px-8 py-3 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 w-full"
                disabled={purchaseLoading}
              >
                {purchaseLoading ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                    {text.purchasing}
                  </span>
                ) : (
                  text.purchasePremiumButton
                )}
              </button>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative mt-4" role="alert">
                <strong className="font-bold">Error!</strong>
                <span className="block sm:inline ml-2">{error}</span>
              </div>
            )}
            {isPremiumUser && !error && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md relative mt-4" role="alert">
                <strong className="font-bold">Success!</strong>
                <span className="block sm:inline ml-2">{text.purchaseSuccess}</span>
              </div>
            )}
          </div>
        ) : (
          <>
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
          </>
        )}
      </main>

      <footer className="w-full max-w-3xl text-center py-4 text-gray-600 text-sm">
        &copy; {new Date().getFullYear()} MathSolver MY. All rights reserved.
      </footer>
    </div>
  );
}

export default App;