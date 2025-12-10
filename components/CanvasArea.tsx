
import React, { useEffect, useState } from 'react';
import { FilterState } from '../types';
import { createPassportCanvas } from '../services/image_utils';

interface CanvasAreaProps {
  image: string | null;
  filters: FilterState;
  zoom: number;
  onSelectImage: () => void;
  isPassportMode?: boolean;
  passportSize?: number;
  showBorder?: boolean;
  passportCount?: number;
  useGradientBg?: boolean;
}

const CanvasArea: React.FC<CanvasAreaProps> = ({ 
  image, filters, zoom, onSelectImage, 
  isPassportMode = false, passportSize = 1.8, showBorder = false,
  passportCount = 6, useGradientBg = false
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Effect to generate passport preview dynamically
  useEffect(() => {
    let active = true;
    if (isPassportMode && image) {
      createPassportCanvas(image, filters, passportSize, showBorder, passportCount, useGradientBg).then(canvas => {
        if (active) {
          setPreviewUrl(canvas.toDataURL('image/jpeg', 0.8));
        }
      });
    } else {
      setPreviewUrl(null);
    }
    return () => { active = false; };
  }, [image, isPassportMode, passportSize, showBorder, passportCount, useGradientBg, filters]); // Re-render when these change

  // Calculate sharpness kernel
  const s = filters.sharpness / 100;
  const center = 1 + 4 * s;
  const side = -s;
  // Kernel matrix for feConvolveMatrix: 3x3
  // 0 -s 0
  // -s 1+4s -s
  // 0 -s 0
  const kernel = `0 ${side} 0 ${side} ${center} ${side} 0 ${side} 0`;

  // CSS Filter for normal mode
  const filterStyle = {
    filter: `
      brightness(${filters.brightness}%) 
      contrast(${filters.contrast}%) 
      saturate(${filters.saturation}%) 
      grayscale(${filters.grayscale}%) 
      sepia(${filters.sepia}%) 
      blur(${filters.blur}px)
      ${filters.sharpness > 0 ? 'url(#sharpness-filter)' : ''}
    `,
    transform: `scale(${zoom / 100})`,
    boxShadow: filters.vignette > 0 ? `inset 0 0 ${filters.vignette * 2}px ${filters.vignette}px rgba(0,0,0,0.8)` : 'none'
  };

  return (
    <div className="flex-1 overflow-auto bg-editor-bg relative flex items-center justify-center p-8 custom-scrollbar">
      
      {/* SVG Filter Definition for Sharpness */}
      <svg width="0" height="0" style={{ position: 'absolute', pointerEvents: 'none' }}>
        <defs>
            <filter id="sharpness-filter">
                <feConvolveMatrix 
                    order="3" 
                    preserveAlpha="true" 
                    kernelMatrix={kernel} 
                />
            </filter>
        </defs>
      </svg>

      <div 
        className="absolute inset-0 opacity-10 pointer-events-none" 
        style={{
          backgroundImage: 'radial-gradient(#333 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}
      ></div>

      {image ? (
        <div 
            className="relative shadow-2xl shadow-black transition-transform duration-200 ease-out origin-center"
            style={{ transform: filterStyle.transform }}
        >
          {isPassportMode && previewUrl ? (
             // Passport Preview (Already has filters baked in)
             <img 
                src={previewUrl} 
                alt="Passport Preview" 
                className="max-w-none block border-8 border-white shadow-xl"
                style={{ maxHeight: '80vh', maxWidth: '80vw' }} 
             />
          ) : (
             // Normal Mode
             <>
                <img 
                  src={image} 
                  alt="Editing" 
                  className="max-w-none transition-[filter] duration-100 ease-linear block"
                  style={{ 
                      filter: filterStyle.filter,
                      maxHeight: '80vh',
                      maxWidth: '80vw'
                  }} 
                />
                {filters.vignette > 0 && (
                  <div className="absolute inset-0 pointer-events-none mix-blend-multiply" style={{ boxShadow: filterStyle.boxShadow }}></div>
                )}
             </>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6 animate-pulse z-10">
          <div className="flex items-center justify-center text-text-dim p-8 rounded-full bg-white/5 border border-white/10">
            <span className="material-symbols-outlined !text-6xl md:!text-8xl">add_photo_alternate</span>
          </div>
          <button 
            onClick={onSelectImage}
            className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-6 bg-primary text-background-dark text-sm font-bold tracking-wide hover:bg-primary/80 transition-all duration-200 hover:scale-105 shadow-lg shadow-primary/10"
          >
            <span>اختر صورة</span>
            <span className="material-symbols-outlined mr-2 !text-lg">upload</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default CanvasArea;
