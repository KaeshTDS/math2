import React, { useState, useCallback, useRef, useEffect } from 'react';
import { UI_TEXT } from '../constants';
import { Language } from '../types';
import { createImage, getCroppedImg } from '../utils/imageUtils';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  currentLanguage: Language;
  selectedFile: File | null; // This will now hold the *original* file before cropping
  onClear: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, currentLanguage, selectedFile, onClear }) => {
  const text = UI_TEXT[currentLanguage];
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cropping state
  const [imageToCropUrl, setImageToCropUrl] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState<boolean>(false);
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [imageLoading, setImageLoading] = useState<boolean>(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const imageRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null); // Ref for the crop container

  // Manage URL for preview or cropping
  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url); // For initial upload preview
      setImageToCropUrl(url); // For cropping interface
      setIsCropping(true); // Automatically open crop interface
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
      setImageToCropUrl(null);
      setIsCropping(false);
      setZoom(1);
      setRotation(0);
      setCrop({ x: 0, y: 0 });
      setCroppedAreaPixels(null);
      setImageLoading(false);
      setImageError(null);
    }
  }, [selectedFile]);

  // Handle file input change
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Instead of directly calling onFileSelect, we prepare for cropping
      onFileSelect(file); // Pass the original file, App.tsx will then re-render and FileUpload will pick it up for cropping
    }
  }, [onFileSelect]);

  const handleClear = useCallback(() => {
    onClear();
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Clear the input value
    }
    // Also reset cropping state if any
    setIsCropping(false);
    setImageToCropUrl(null);
    setZoom(1);
    setRotation(0);
    setCrop({ x: 0, y: 0 });
    setCroppedAreaPixels(null);
    setImageLoading(false);
    setImageError(null);
  }, [onClear]);

  // Cropping logic (simplified to pan, zoom, rotate around a fixed square crop area)
  // This is a simplified approach, a full-featured cropping library would manage these interactions.
  // Here, we calculate the `croppedAreaPixels` from the visible part of the canvas after transforms.
  const calculateCroppedAreaPixels = useCallback(() => {
    if (!imageRef.current || !canvasRef.current || !containerRef.current) return;

    const image = imageRef.current;
    const canvas = canvasRef.current;
    const container = containerRef.current;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // The crop area is fixed to the center of the canvas / container.
    // Let's assume a square crop of 256x256 pixels for simplicity.
    const cropSize = 256; // Fixed size for the cropped output
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Calculate position of the fixed crop square relative to the transformed image.
    // This is a simplified logic. A real cropping library would manage image-to-canvas and canvas-to-image coordinates.
    // For this simplified example, we'll effectively take the center 'cropSize' area after drawing.
    // The getCroppedImg function expects absolute pixels on the source image.
    // This part is the most complex without a library, so we will pass the full transformed canvas
    // to getCroppedImg and let it extract the center portion.

    // The `getCroppedImg` function from `imageUtils.ts` handles the heavy lifting
    // by drawing the *transformed* image onto an intermediate canvas and then
    // extracting a specific region from *that* canvas.
    // For `croppedAreaPixels`, we essentially want the central part of the *transformed* image.
    // However, `getCroppedImg` takes the `crop` dimensions relative to the *transformed* image.
    // Let's pass a fixed crop area for the *output canvas* (e.g., center 256x256).

    // Instead of complex calculations here, we'll let `getCroppedImg` extract a fixed size from the transformed canvas.
    // The `crop` parameter in `getCroppedImg` refers to the target rectangle on the *rendered* canvas.
    // So, we want the center portion of the rendered image.
    setCroppedAreaPixels({
      x: (canvasWidth - cropSize) / 2,
      y: (canvasHeight - cropSize) / 2,
      width: cropSize,
      height: cropSize,
    });

  }, [crop, zoom, rotation]); // Recalculate if these change


  // Drawing the image on canvas for display
  const drawImageOnCanvas = useCallback(() => {
    if (!imageRef.current || !canvasRef.current || !imageToCropUrl) return;

    const image = imageRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate effective image dimensions after zoom
    const effectiveWidth = image.naturalWidth * zoom;
    const effectiveHeight = image.naturalHeight * zoom;

    // Center the image within the canvas, and then apply pan from `crop.x`, `crop.y`
    const initialX = (canvas.width - effectiveWidth) / 2 + crop.x;
    const initialY = (canvas.height - effectiveHeight) / 2 + crop.y;

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(rotation * Math.PI / 180);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    ctx.drawImage(
      image,
      initialX,
      initialY,
      effectiveWidth,
      effectiveHeight
    );
    ctx.restore();

    // Optionally draw a fixed crop frame
    const cropFrameSize = Math.min(canvas.width, canvas.height) * 0.7; // Example: 70% of smaller dimension
    const cropFrameX = (canvas.width - cropFrameSize) / 2;
    const cropFrameY = (canvas.height - cropFrameSize) / 2;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(cropFrameX, cropFrameY, cropFrameSize, cropFrameSize);
    ctx.setLineDash([]); // Reset line dash

    // Store the actual pixel area on the source image that corresponds to the cropFrame
    // This part is tricky and would typically be handled by a library like react-easy-crop
    // which gives back `croppedAreaPixels`.
    // For this simple implementation, we'll pass the full transformed canvas state to getCroppedImg
    // and extract a fixed-size center portion from its *output*.
    // So `croppedAreaPixels` here isn't true to its name for the final cropped output.
    // Instead, it's the target crop area *on the transformed canvas*.
    setCroppedAreaPixels({
      x: cropFrameX,
      y: cropFrameY,
      width: cropFrameSize,
      height: cropFrameSize,
    });


  }, [imageToCropUrl, crop, zoom, rotation]);

  useEffect(() => {
    drawImageOnCanvas();
  }, [drawImageOnCanvas]);

  // Handle image loading for cropping
  useEffect(() => {
    if (imageToCropUrl) {
      setImageLoading(true);
      setImageError(null);
      createImage(imageToCropUrl)
        .then((img) => {
          imageRef.current = img;
          if (canvasRef.current) {
            // Set canvas dimensions based on image aspect ratio for better display
            const aspectRatio = img.naturalWidth / img.naturalHeight;
            const maxWidth = containerRef.current?.offsetWidth || window.innerWidth * 0.8;
            const maxHeight = containerRef.current?.offsetHeight || window.innerHeight * 0.8;

            let canvasWidth = maxWidth;
            let canvasHeight = maxWidth / aspectRatio;

            if (canvasHeight > maxHeight) {
              canvasHeight = maxHeight;
              canvasWidth = maxHeight * aspectRatio;
            }
            canvasRef.current.width = canvasWidth;
            canvasRef.current.height = canvasHeight;
          }
          setImageLoading(false);
          // Initial draw
          drawImageOnCanvas();
        })
        .catch((err) => {
          console.error("Image loading error:", err);
          setImageError(text.imageLoadError);
          setImageLoading(false);
        });
    }
  }, [imageToCropUrl, drawImageOnCanvas, text.imageLoadError]);


  // Mouse/Touch event handlers for panning
  const [isDragging, setIsDragging] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setStartPoint({ x: clientX - crop.x, y: clientY - crop.y });
  }, [crop.x, crop.y]);

  const handleMouseMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setCrop({ x: clientX - startPoint.x, y: clientY - startPoint.y });
  }, [isDragging, startPoint]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleRotate = useCallback(() => {
    setRotation((prevRotation) => (prevRotation + 90) % 360);
  }, []);

  const handleCropConfirm = useCallback(async () => {
    if (imageRef.current && croppedAreaPixels) {
      try {
        const croppedFile = await getCroppedImg(
          imageRef.current,
          croppedAreaPixels,
          rotation,
          zoom,
          selectedFile?.type || 'image/png'
        );
        onFileSelect(croppedFile); // Pass the cropped file to App.tsx
        setIsCropping(false); // Close cropping interface
        setImageToCropUrl(null); // Clear image to crop
      } catch (e) {
        console.error('Error during cropping:', e);
        setImageError('Failed to crop image.'); // Local error for cropping process
      }
    }
  }, [imageRef, croppedAreaPixels, rotation, zoom, onFileSelect, selectedFile?.type]);

  const handleCropCancel = useCallback(() => {
    handleClear(); // Clear everything and return to initial state
  }, [handleClear]);

  // Render the cropping interface if in cropping mode
  if (isCropping && imageToCropUrl) {
    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="bg-white rounded-xl shadow-2xl p-4 sm:p-6 lg:p-8 max-w-full max-h-full flex flex-col items-center relative" ref={containerRef}>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{text.cropImage}</h2>

          {imageLoading && (
            <div className="flex flex-col items-center justify-center py-8 text-blue-600">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent mb-2"></div>
              <p className="text-lg font-medium">{text.loadingImage}</p>
            </div>
          )}

          {imageError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative my-4" role="alert">
              <strong className="font-bold">Error!</strong>
              <span className="block sm:inline ml-2">{imageError}</span>
            </div>
          )}

          {!imageLoading && !imageError && (
            <div
              className="relative overflow-hidden cursor-grab active:cursor-grabbing border-2 border-blue-300 rounded-md"
              style={{ width: 'min(90vw, 500px)', height: 'min(90vw, 500px)', touchAction: 'none' }} // Fixed crop window size
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp} // Stop dragging if mouse leaves
              onTouchStart={handleMouseDown}
              onTouchMove={handleMouseMove}
              onTouchEnd={handleMouseUp}
            >
              <canvas
                ref={canvasRef}
                className="block"
                style={{
                  transform: `translate(${crop.x}px, ${crop.y}px) rotate(${rotation}deg) scale(${zoom})`,
                  transformOrigin: 'center center',
                  maxWidth: '100%',
                  maxHeight: '100%',
                }}
              ></canvas>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center mt-6 w-full max-w-md space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-2 w-full sm:w-1/2">
              <span className="text-gray-700 text-sm">{text.zoom}:</span>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <button
              onClick={handleRotate}
              className="flex items-center justify-center px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 w-full sm:w-auto"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004 12V8m5.418-4H20v5.582m0 0a8.001 8.001 0 01-15.356 2M4 12l2-2m-2 2l-2 2"></path></svg>
              {text.rotate}
            </button>
          </div>

          <div className="flex justify-end space-x-4 mt-8 w-full">
            <button
              onClick={handleCropCancel}
              className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              {text.cancelButton}
            </button>
            <button
              onClick={handleCropConfirm}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {text.cropButton}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Original file upload UI
  return (
    <div className="w-full flex flex-col items-center justify-center p-4">
      <label
        htmlFor="file-upload"
        className="relative flex flex-col items-center justify-center w-full max-w-md h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          {previewUrl && !isCropping ? ( // Only show preview when not in cropping mode
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
      {selectedFile && !isCropping && ( // Show clear button only if a file is selected and not cropping
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