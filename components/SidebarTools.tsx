
import React, { useRef } from 'react';
import { useAppState } from '../state/AppState';
import { removeBackground, processWithNanoBanana } from '../services/api_service';
import { compositeOnWhite } from '../services/image_utils';

interface SidebarToolsProps {
  onOpen?: () => void;
  onSave?: () => void;
  onPrint?: () => void;
  hasImage?: boolean;
}

const SidebarTools: React.FC<SidebarToolsProps> = ({ onOpen, onSave, onPrint }) => {
  const { selectedImage, setSelectedImage, setIsLoading, isLoading } = useAppState();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setSelectedImage(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveBg = async () => {
    if (!selectedImage) {
        alert("يرجى رفع صورة أولاً!");
        return;
    }
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(selectedImage);
      const blob = await response.blob();
      
      const onStatusUpdate = (msg: string) => console.log(msg);

      const transparentDataUrl = await removeBackground(blob, onStatusUpdate);
      const whiteBgDataUrl = await compositeOnWhite(transparentDataUrl);
      
      setSelectedImage(whiteBgDataUrl);
    } catch (error: any) {
       console.error("Failed to remove background:", error);
       alert(`فشل في إزالة الخلفية: ${error.message || ''}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNanoBanana = async () => {
    if (isLoading) return;
    const promptText = window.prompt(
      selectedImage 
        ? "اكتب تعديلاً للصورة (مثال: 'أضف قبعة حمراء'):"
        : "صف الصورة التي تريد إنشاءها (مثال: 'قطة فضائية'):"
    );

    if (!promptText || promptText.trim() === "") return;

    setIsLoading(true);
    try {
      const resultDataUrl = await processWithNanoBanana(
        promptText,
        selectedImage || undefined,
        (msg) => console.log(msg)
      );
      setSelectedImage(resultDataUrl);
    } catch (error: any) {
      console.error("Nano Banana Error:", error);
      alert(`حدث خطأ: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const buttonClass = `
    flex w-full items-center justify-center gap-3 rounded-lg 
    border-2 border-primary bg-black px-4 py-4 
    text-primary font-bold shadow-lg shadow-primary/10
    transition-all duration-200 
    hover:bg-primary hover:text-black hover:scale-[1.02] 
    active:scale-95
    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-black disabled:hover:text-primary
  `;

  return (
    <aside className="hidden md:flex flex-col bg-panel-bg w-20 lg:w-72 border-l border-primary/20 shrink-0 h-full overflow-y-auto z-20">
      <div className="p-6 flex flex-col gap-6 h-full">
        
        <div className="flex items-center gap-3 mb-4">
          <div className="relative shrink-0 w-12 h-12 rounded-full overflow-hidden border-2 border-primary shadow-lg shadow-primary/20">
             <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCjjzwuHOPboA4app88q3KJSzTK5ZRF8a5gEyFnhCO_YW7qYfFqfkKp2DgnI35mVBE78o0Iudl2MQiii-Ahdx4b6sDdmG-a1A9XaO3cdLZYXvLjIYMO1X1iYnmCDW6VfgXXz9u__Lm2YCgECsrMv0cRGPLFEeAZfrumNduAt-zj4FMBI72cSHcN4XhtCM92Mfynlh3kG1RGTUg9hlHm0cvspVmY4fXt1yFqYvzu9t98XVuPjLrMIIxNiTSRfvdcXqQ5Txp3dQ2t_PA" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <div className="hidden lg:flex flex-col">
            <h1 className="text-white text-lg font-bold leading-none tracking-wider font-grotesk">MATRX</h1>
            <p className="text-primary text-xs font-normal mt-1">Pixel Suite</p>
          </div>
        </div>

        <div className="w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent mb-2"></div>

        <div className="flex flex-col gap-4 w-full">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

            <button onClick={handleUploadClick} className={buttonClass}>
                <span className="material-symbols-outlined text-2xl">cloud_upload</span>
                <span className="hidden lg:block text-base">رفع صورة</span>
            </button>

            <button onClick={handleNanoBanana} disabled={isLoading} className={buttonClass}>
                <span className="material-symbols-outlined text-2xl">auto_awesome_motion</span>
                <span className="hidden lg:block text-base">Nano Banana (AI)</span>
            </button>

            <button onClick={handleRemoveBg} disabled={!selectedImage || isLoading} className={buttonClass}>
                {isLoading ? (
                   <span className="material-symbols-outlined animate-spin text-2xl">progress_activity</span>
                ) : (
                   <span className="material-symbols-outlined text-2xl">background_remove</span>
                )}
                <span className="hidden lg:block text-base">إزالة الخلفية</span>
            </button>

            <button onClick={onPrint} disabled={!selectedImage || isLoading} className={buttonClass}>
                <span className="material-symbols-outlined text-2xl">print</span>
                <span className="hidden lg:block text-base">طباعة / حفظ</span>
            </button>
        </div>

        <div className="mt-auto text-center">
            <p className="text-text-dim text-[10px]">v1.2.0 Passport & Print</p>
        </div>

      </div>
    </aside>
  );
};

export default SidebarTools;
