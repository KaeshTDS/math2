import React from 'react';
import { Language } from '../types';
import { UI_TEXT } from '../constants';

interface LanguageSwitcherProps {
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ currentLanguage, onLanguageChange }) => {
  const text = UI_TEXT[currentLanguage];

  const getButtonClass = (lang: Language) => `
    px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200
    ${currentLanguage === lang
      ? 'bg-blue-600 text-white shadow-md'
      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
    }
  `;

  return (
    <div className="flex items-center space-x-2 p-2">
      <span className="text-gray-700 text-sm md:text-base">{text.selectLanguage}:</span>
      <button
        onClick={() => onLanguageChange(Language.EN)}
        className={getButtonClass(Language.EN)}
      >
        English
      </button>
      <button
        onClick={() => onLanguageChange(Language.MS)}
        className={getButtonClass(Language.MS)}
      >
        Bahasa Melayu
      </button>
    </div>
  );
};

export default LanguageSwitcher;