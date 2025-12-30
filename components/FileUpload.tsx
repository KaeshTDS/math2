import React, { useState, useCallback, useRef } from 'react';
import { UI_TEXT } from '../constants';
import { Language } from '../types';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  currentLanguage: Language;
  selectedFile: File | null;
  onClear: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, currentLanguage, selectedFile, onClear }) => {
  const text = UI_TEXT[currentLanguage];
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [selectedFile]);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const handleClear = useCallback(() => {
    onClear();
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Clear the input value
    }
  }, [onClear]);

  return (
    <div className="w-full flex flex-col items-center justify-center p-4">
      <label
        htmlFor="file-upload"
        className="relative flex flex-col items-center justify-center w-full max-w-md h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          {previewUrl ? (
            <img src={previewUrl} alt="Question preview" className="max-h-36 max-w-full object-contain rounded-md" />
          ) : (
            <>
              <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.56 5.56 0 0 0 5.354 5.212C3.243 5.077 1.25 6.787 1.25 8.743A3.75 3.75 0 0 0 5 12.5h1.5" />
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5L15 9M15 9L11 13M15 9H1" />
              </svg>
              <p className="mb-2 text-sm text-gray-500 text-center font-semibold">{text.uploadButton}</p>
              <p className="text-xs text-gray-500 text-center">{text.uploadPrompt}</p>
            </>
          )}
        </div>
        <input
          id="file-upload"
          type="file"
          className="hidden"
          accept="image/*"
          capture="environment" // Prioritize rear camera for "environment"
          onChange={handleFileChange}
          ref={fileInputRef}
        />
      </label>
      {selectedFile && (
        <button
          onClick={handleClear}
          className="mt-4 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          {text.clear}
        </button>
      )}
    </div>
  );
};

export default FileUpload;