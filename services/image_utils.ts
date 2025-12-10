
/**
 * Utility service for image manipulation
 */

import { FilterState } from '../types';

/**
 * Takes a transparent image (as Uint8Array bytes, Blob, or Data URL string), 
 * composites it onto a white background,
 * and returns the result as a Base64 Data URL string suitable for an <img src="...">.
 */
export async function compositeOnWhite(imageInput: Uint8Array | Blob | string): Promise<string> {
  return new Promise((resolve, reject) => {
    let url: string;
    let isRevokable = false;

    if (typeof imageInput === 'string') {
        url = imageInput;
    } else {
        const blob = imageInput instanceof Blob 
            ? imageInput 
            : new Blob([imageInput], { type: 'image/png' });
        url = URL.createObjectURL(blob);
        isRevokable = true;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        if (isRevokable) URL.revokeObjectURL(url);
        resolve(dataUrl);
      } catch (err) {
        if (isRevokable) URL.revokeObjectURL(url);
        reject(err);
      }
    };

    img.onerror = () => {
      if (isRevokable) URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for composition'));
    };

    img.src = url;
  });
}

/**
 * Generates a passport photo sheet (4x6 inch) with multiple copies of the image.
 */
export async function createPassportCanvas(
  imageSrc: string,
  filters: FilterState,
  photoHeightInches: number = 1.8,
  addBorder: boolean = false,
  photoCount: number = 6,
  useGradientBg: boolean = false
): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        // 1. Create a temporary canvas to apply filters to the single image
        const filterCanvas = document.createElement('canvas');
        filterCanvas.width = img.width;
        filterCanvas.height = img.height;
        const fCtx = filterCanvas.getContext('2d');
        if (!fCtx) throw new Error("No context");

        // Apply CSS-like filters
        const filterString = `
          brightness(${filters.brightness}%) 
          contrast(${filters.contrast}%) 
          saturate(${filters.saturation}%) 
          sepia(${filters.sepia}%) 
          grayscale(${filters.grayscale}%) 
          blur(${filters.blur}px)
        `;
        fCtx.filter = filterString;
        fCtx.drawImage(img, 0, 0, filterCanvas.width, filterCanvas.height);

        // 2. Setup the 4x6 inch print canvas (300 DPI)
        const dpi = 300;
        const canvas = document.createElement('canvas');
        canvas.width = 4 * dpi; // 4 inches
        canvas.height = 6 * dpi; // 6 inches
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("No context");

        // Background
        if (useGradientBg) {
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#333333'); // Dark Gray
            gradient.addColorStop(1, '#000000'); // Black
            ctx.fillStyle = gradient;
        } else {
            ctx.fillStyle = 'white';
        }
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 3. Calculate dimensions
        // Standard passport aspect ratio
        const aspectRatio = 3.5 / 4.5; 
        
        // Grid Configuration based on Photo Count
        let cols = 2;
        let rows = 3;
        
        if (photoCount === 9) {
            cols = 3; // 3x3 grid for 9 photos
        } 
        // For 3 and 6, we use 2 columns (Standard width)
        
        const cellWidthPx = canvas.width / cols;
        const cellHeightPx = canvas.height / rows;

        // Determine Target Photo Size
        // If 9 photos (3 cols), width is limited by cell width (approx 1.33 inch).
        // If 6 photos (2 cols), width is wider (2 inch).
        // We calculate max possible size within the cell while keeping aspect ratio.
        
        let targetW, targetH;
        
        if (photoCount === 9) {
             // Fit to cell width minus margin
             targetW = cellWidthPx * 0.9; 
             targetH = targetW / aspectRatio;
        } else {
             // Standard logic using passed photoHeightInches, but capped at cell size
             targetH = photoHeightInches * dpi;
             targetW = targetH * aspectRatio;
             
             // Safety check if calculated width exceeds cell
             if (targetW > cellWidthPx) {
                 targetW = cellWidthPx * 0.9;
                 targetH = targetW / aspectRatio;
             }
        }
        
        const photoWidthPx = targetW;
        const photoHeightPx = targetH;

        const marginX = (cellWidthPx - photoWidthPx) / 2;
        const marginY = (cellHeightPx - photoHeightPx) / 2;

        // Crop/Fit logic (Cover) for the source image onto the target rect
        let sourceWidth, sourceHeight, sourceX, sourceY;
        const sourceRatio = filterCanvas.width / filterCanvas.height;

        if (sourceRatio > aspectRatio) {
          sourceHeight = filterCanvas.height;
          sourceWidth = sourceHeight * aspectRatio;
          sourceY = 0;
          sourceX = (filterCanvas.width - sourceWidth) / 2;
        } else {
          sourceWidth = filterCanvas.width;
          sourceHeight = sourceWidth / aspectRatio;
          sourceX = 0;
          sourceY = (filterCanvas.height - sourceHeight) / 2;
        }

        // 4. Draw the grid
        let count = 0;
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            if (count >= photoCount) break;

            const drawX = (c * cellWidthPx) + marginX;
            const drawY = (r * cellHeightPx) + marginY;

            ctx.drawImage(
              filterCanvas, 
              sourceX, sourceY, sourceWidth, sourceHeight, 
              drawX, drawY, photoWidthPx, photoHeightPx
            );

            if (addBorder) {
              ctx.strokeStyle = '#000000';
              ctx.lineWidth = 4;
              ctx.strokeRect(drawX, drawY, photoWidthPx, photoHeightPx);
            }
            
            count++;
          }
        }

        resolve(canvas);
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = (e) => reject(e);
    img.src = imageSrc;
  });
}
