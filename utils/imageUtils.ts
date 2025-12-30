/**
 * @typedef {Object} Dimensions
 * @property {number} width - The width of the image.
 * @property {number} height - The height of the image.
 */

/**
 * Loads an image from a URL and returns an HTMLImageElement.
 * @param {string} url - The URL of the image.
 * @returns {Promise<HTMLImageElement>} - A promise that resolves with the loaded image.
 */
export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous'); // Needed for cross-origin images
    image.src = url;
  });

/**
 * Returns the rotation angle in radians for a given degree value.
 * @param {number} degree - The rotation angle in degrees.
 * @returns {number} - The rotation angle in radians.
 */
const getRadianAngle = (degree: number) => {
  return degree * Math.PI / 180;
};

/**
 * Calculates the bounding box for a rotated rectangle.
 * @param {number} width - The width of the original rectangle.
 * @param {number} height - The height of the original rectangle.
 * @param {number} rotation - The rotation angle in degrees.
 * @returns {Dimensions} - The width and height of the bounding box.
 */
export const getRotatedImageSize = (width: number, height: number, rotation: number): { width: number, height: number } => {
  const rotRad = getRadianAngle(rotation);

  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
};

/**
 * Performs image cropping on a canvas.
 * @param {HTMLImageElement} image - The HTMLImageElement to crop.
 * @param {Object} crop - The crop area details {x, y, width, height}.
 * @param {number} rotation - The rotation angle in degrees.
 * @param {number} scale - The scale factor.
 * @param {string} mimeType - The desired output MIME type (e.g., 'image/jpeg', 'image/png').
 * @returns {Promise<File>} - A promise that resolves with the cropped image as a File object.
 */
export async function getCroppedImg(
  image: HTMLImageElement,
  crop: { x: number, y: number, width: number, height: number },
  rotation: number,
  scale: number,
  mimeType: string = 'image/png'
): Promise<File> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2D context available for canvas');
  }

  const { width: rotatedWidth, height: rotatedHeight } = getRotatedImageSize(image.width, image.height, rotation);

  // Set canvas size to the bounding box of the rotated image
  canvas.width = rotatedWidth;
  canvas.height = rotatedHeight;

  ctx.translate(rotatedWidth / 2, rotatedHeight / 2);
  ctx.rotate(getRadianAngle(rotation));
  ctx.scale(scale, scale); // Apply scaling
  ctx.drawImage(image, -image.width / 2, -image.height / 2);

  // Get the data from the canvas for the crop region
  const data = ctx.getImageData(crop.x, crop.y, crop.width, crop.height);

  // Create a new canvas for the final cropped image
  const croppedCanvas = document.createElement('canvas');
  const croppedCtx = croppedCanvas.getContext('2d');

  if (!croppedCtx) {
    throw new Error('No 2D context available for cropped canvas');
  }

  croppedCanvas.width = crop.width;
  croppedCanvas.height = crop.height;

  croppedCtx.putImageData(data, 0, 0);

  return new Promise((resolve, reject) => {
    croppedCanvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas is empty'));
        return;
      }
      const file = new File([blob], 'cropped-image.png', { type: mimeType });
      resolve(file);
    }, mimeType);
  });
}
