
import React, { useState, useRef, useEffect } from 'react';
import { FilterState } from '../types';
import SidebarTools from './SidebarTools';
import PropertiesPanel from './PropertiesPanel';
import CanvasArea from './CanvasArea';
import { useAppState } from '../state/AppState';
import { removeBackground, enhancePhoto, processWithNanoBanana, addFormalSuit, addHijab } from '../services/api_service';
import { compositeOnWhite, createPassportCanvas } from '../services/image_utils';

interface EditorScreenProps {
  onBack: () => void;
}

const DEFAULT_FILTERS: FilterState = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  sepia: 0,
  grayscale: 0,
  blur: 0,
  sharpness: 0,
  vignette: 0
};

const EditorScreen: React.FC<EditorScreenProps> = ({ onBack }) => {
  const { selectedImage, setSelectedImage, isLoading, setIsLoading, undo, canUndo, pushHistory } = useAppState();
  
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [zoom, setZoom] = useState<number>(100);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Passport Mode State
  const [isPassportMode, setIsPassportMode] = useState(false);
  const [passportSize, setPassportSize] = useState(1.8); // inches
  const [showBorder, setShowBorder] = useState(false);
  const [passportCount, setPassportCount] = useState(6);
  const [useGradientBg, setUseGradientBg] = useState(false);

  // Reset filters on new image
  useEffect(() => {
    if (selectedImage) {
      // setFilters(DEFAULT_FILTERS); 
    }
  }, [selectedImage]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          // Push current to history if replacing, or just set if new
          // Here we assume new upload clears history or starts fresh? 
          // Let's just set it.
          setSelectedImage(e.target.result as string);
          setFilters(DEFAULT_FILTERS); 
          setIsPassportMode(false); // Reset mode
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleExport = async () => {
    if (!selectedImage) return;
    
    let finalUrl = '';

    if (isPassportMode) {
      // Generate passport sheet
      const canvas = await createPassportCanvas(selectedImage, filters, passportSize, showBorder, passportCount, useGradientBg);
      finalUrl = canvas.toDataURL('image/jpeg', 0.95);
    } else {
      // Normal filtered export
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.src = selectedImage;
      
      await new Promise<void>((resolve) => {
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          if (ctx) {
            const filterString = `
              brightness(${filters.brightness}%) 
              contrast(${filters.contrast}%) 
              saturate(${filters.saturation}%) 
              sepia(${filters.sepia}%) 
              grayscale(${filters.grayscale}%) 
              blur(${filters.blur}px)
            `;
            ctx.filter = filterString;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          }
          resolve();
        };
      });
      finalUrl = canvas.toDataURL('image/png');
    }

    const link = document.createElement('a');
    link.download = `matrx-edit-${Date.now()}.jpg`;
    link.href = finalUrl;
    link.click();
  };

  const handlePrint = async () => {
    if (!selectedImage) return;
    setIsLoading(true);
    try {
      let printUrl = '';
      if (isPassportMode) {
         const canvas = await createPassportCanvas(selectedImage, filters, passportSize, showBorder, passportCount, useGradientBg);
         printUrl = canvas.toDataURL('image/jpeg', 0.95);
      } else {
         // For simple print, just use the current image (filters might not apply in native print unless we burn them in)
         // Let's burn filters in for printing too
         const canvas = document.createElement('canvas');
         const ctx = canvas.getContext('2d');
         const img = new Image();
         img.src = selectedImage;
         await new Promise<void>(resolve => {
            img.onload = () => {
               canvas.width = img.width;
               canvas.height = img.height;
               if (ctx) {
                  const filterString = `
                    brightness(${filters.brightness}%) 
                    contrast(${filters.contrast}%) 
                    saturate(${filters.saturation}%) 
                    sepia(${filters.sepia}%) 
                    grayscale(${filters.grayscale}%) 
                    blur(${filters.blur}px)
                  `;
                  ctx.filter = filterString;
                  ctx.drawImage(img, 0, 0);
               }
               resolve();
            }
         });
         printUrl = canvas.toDataURL('image/png');
      }

      // Open print window
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Print Photo</title>
              <style>
                body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; }
                img { max-width: 100%; max-height: 100%; }
                @media print {
                  @page { margin: 0; }
                  body { margin: 0; }
                }
              </style>
            </head>
            <body>
              <img src="${printUrl}" onload="window.print();setTimeout(window.close, 500)" />
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    } catch (e) {
      console.error(e);
      alert("فشل في الطباعة");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key: keyof FilterState, value: number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleUndo = () => {
      if (canUndo) {
          undo();
      } else {
          setFilters(DEFAULT_FILTERS);
      }
  };

  const handleProcessAI = async (action: string) => {
    if (isLoading) return;
    
    if ((action === 'Remove BG' || action === 'Formal Suit' || action === 'Hijab') && !selectedImage) {
        alert("يرجى رفع صورة أولاً!");
        return;
    }
    
    setIsLoading(true);
    try {
      const onStatusUpdate = (msg: string) => {
         console.log(msg);
      };

      // Save state before AI modification
      pushHistory();

      if (action === 'Nano Banana') {
        const prompt = window.prompt("أدخل وصف التعديل الذي تريده (Nano AI):", "أضف خلفية فضائية...");
        if (!prompt) {
            setIsLoading(false);
            return;
        }
        const result = await processWithNanoBanana(prompt, selectedImage || undefined, onStatusUpdate);
        setSelectedImage(result);
        return;
      }

      if (action === 'Formal Suit') {
        if (!selectedImage) return;
        const result = await addFormalSuit(selectedImage, onStatusUpdate);
        setSelectedImage(result);
        return;
      }

      if (action === 'Hijab') {
        if (!selectedImage) return;
        const result = await addHijab(selectedImage, onStatusUpdate);
        setSelectedImage(result);
        return;
      }

      if (!selectedImage) {
        setIsLoading(false); 
        return;
      }

      const response = await fetch(selectedImage);
      const blob = await response.blob();
      
      let resultBlob: Blob;

      if (action === 'Remove BG') {
        const transparentDataUrl = await removeBackground(blob, onStatusUpdate);
        const whiteBgUrl = await compositeOnWhite(transparentDataUrl);
        setSelectedImage(whiteBgUrl);
        return;
      } else if (action === 'Enhance') {
        resultBlob = await enhancePhoto(blob, onStatusUpdate);
        const newImageUrl = URL.createObjectURL(resultBlob);
        setSelectedImage(newImageUrl);
      } else {
        alert(`الميزة ${action} غير متوفرة بعد.`);
        setIsLoading(false);
        return;
      }

    } catch (error: any) {
      const errorMsg = error.message || '';
      console.error('AI Processing Error:', error);
      alert(`حدث خطأ: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full w-full bg-editor-bg text-text-light overflow-hidden">
        <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            accept="image/*" 
            className="hidden" 
        />

      <SidebarTools 
        onOpen={triggerUpload} 
        onSave={handleExport} 
        onPrint={handlePrint}
        hasImage={!!selectedImage}
      />

      <main className="flex flex-1 flex-col h-full relative">
        {/* Top Bar */}
        <div className="flex justify-between items-center gap-2 px-4 py-2 bg-panel-bg border-b border-primary/20 shrink-0 z-10 h-14">
          <div className="flex gap-2">
            <button 
                onClick={handleUndo} 
                disabled={!canUndo}
                className={`p-2 rounded-md transition-colors ${canUndo ? 'text-text-light hover:text-primary hover:bg-white/5' : 'text-gray-600 cursor-not-allowed'}`} 
                title="تراجع خطوة للخلف"
            >
              <span className="material-symbols-outlined">undo</span>
            </button>
          </div>
          
          <div className="flex-1 text-center font-bold text-lg text-primary hidden md:block">
            {isPassportMode ? 'وضع جواز السفر (4x6)' : 'بكسل سويت'}
          </div>

          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 p-2 text-text-light hover:text-primary rounded-md">
              <span className="material-symbols-outlined text-[20px]">language</span>
              <span className="text-xs font-bold">AR</span>
            </button>
            <div className="w-px h-6 bg-white/10 mx-1"></div>
            <button onClick={() => setZoom(z => Math.min(z + 10, 200))} className="p-2 text-text-light hover:text-primary rounded-md hover:bg-white/5">
              <span className="material-symbols-outlined">zoom_in</span>
            </button>
            <span className="text-xs w-12 text-center text-text-dim">{zoom}%</span>
            <button onClick={() => setZoom(z => Math.max(z - 10, 10))} className="p-2 text-text-light hover:text-primary rounded-md hover:bg-white/5">
              <span className="material-symbols-outlined">zoom_out</span>
            </button>
            
            <button onClick={onBack} className="p-2 ml-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-md" title="خروج">
                <span className="material-symbols-outlined">logout</span>
            </button>
          </div>
        </div>

        {/* Canvas Workspace */}
        <CanvasArea 
            image={selectedImage} 
            filters={filters} 
            zoom={zoom}
            onSelectImage={triggerUpload}
            isPassportMode={isPassportMode}
            passportSize={passportSize}
            showBorder={showBorder}
            passportCount={passportCount}
            useGradientBg={useGradientBg}
        />

        <footer className="flex items-center justify-between px-4 py-1 bg-panel-bg text-text-dim text-xs border-t border-primary/20 h-8 shrink-0">
          <div>
            <span>{selectedImage ? (isLoading ? 'جارٍ المعالجة...' : (isPassportMode ? `وضع جواز السفر (${passportCount} صور)` : 'جاهز للتحرير')) : 'في انتظار الصورة'}</span>
          </div>
          <div className="flex items-center gap-4">
            <span>{isPassportMode ? '4x6 بوصة' : 'الأبعاد: متغيرة'}</span>
            <span>التكبير: {zoom}%</span>
          </div>
        </footer>
      </main>

      <PropertiesPanel 
        filters={filters} 
        onChange={handleFilterChange} 
        hasImage={!!selectedImage}
        onProcessAI={handleProcessAI}
        isPassportMode={isPassportMode}
        setIsPassportMode={setIsPassportMode}
        passportSize={passportSize}
        setPassportSize={setPassportSize}
        showBorder={showBorder}
        setShowBorder={setShowBorder}
        passportCount={passportCount}
        setPassportCount={setPassportCount}
        useGradientBg={useGradientBg}
        setUseGradientBg={setUseGradientBg}
      />
    </div>
  );
};

export default EditorScreen;
