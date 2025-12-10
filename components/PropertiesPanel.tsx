
import React from 'react';
import { FilterState } from '../types';

interface PropertiesPanelProps {
  filters: FilterState;
  onChange: (key: keyof FilterState, value: number) => void;
  hasImage: boolean;
  onProcessAI: (action: string) => void;
  // Passport Props
  isPassportMode: boolean;
  setIsPassportMode: (v: boolean) => void;
  passportSize: number;
  setPassportSize: (v: number) => void;
  showBorder: boolean;
  setShowBorder: (v: boolean) => void;
  passportCount: number;
  setPassportCount: (v: number) => void;
  useGradientBg: boolean;
  setUseGradientBg: (v: boolean) => void;
}

interface SliderControlProps {
  item: { key: string; label: string; min: number; max: number; default: number };
  val: number;
  hasImage: boolean;
  onChange: (key: keyof FilterState, value: number) => void;
}

interface QuickActionProps {
    label: string;
    action: string;
    hasImage: boolean;
    onProcessAI: (action: string) => void;
}

const QuickAction: React.FC<QuickActionProps> = ({ label, action, hasImage, onProcessAI }) => (
    <button 
        onClick={() => onProcessAI(action)}
        disabled={!hasImage && action !== 'Nano Banana'}
        className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-black text-primary border border-primary/50 text-sm font-bold hover:bg-primary hover:text-black disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-[1.02]"
    >
        <span className="truncate">{label}</span>
    </button>
);

const SliderControl: React.FC<SliderControlProps> = ({ item, val, hasImage, onChange }) => (
    <div className="flex flex-col gap-2">
        <div className="flex justify-between">
            <label className="text-xs text-text-dim">{item.label}</label>
            <span className="text-xs text-primary font-mono">{val}</span>
        </div>
        <input 
            type="range" 
            min={item.min} 
            max={item.max} 
            value={val}
            disabled={!hasImage}
            onChange={(e) => onChange(item.key as keyof FilterState, parseInt(e.target.value))}
            className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-primary hover:accent-yellow-400 disabled:opacity-30"
        />
    </div>
);

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ 
    filters, onChange, hasImage, onProcessAI,
    isPassportMode, setIsPassportMode, passportSize, setPassportSize, showBorder, setShowBorder,
    passportCount, setPassportCount, useGradientBg, setUseGradientBg
}) => {
  
  const sliders = [
    { key: 'brightness', label: 'السطوع', min: 0, max: 200, default: 100 },
    { key: 'contrast', label: 'التباين', min: 0, max: 200, default: 100 },
    { key: 'saturation', label: 'التشبع', min: 0, max: 200, default: 100 },
    { key: 'sharpness', label: 'الحدة', min: 0, max: 100, default: 0 },
  ];

  return (
    <aside className="w-72 md:w-80 h-full bg-panel-bg flex flex-col border-r border-primary/20 shrink-0 overflow-y-auto">
      <div className="p-4 flex flex-col gap-6">
        
        {/* Passport Mode Toggle */}
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
             <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-primary">وضع جواز السفر</span>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={isPassportMode} onChange={e => setIsPassportMode(e.target.checked)} disabled={!hasImage} />
                    <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                </label>
             </div>
             
             {isPassportMode && (
                 <div className="flex flex-col gap-3 mt-3 animate-fade-in">
                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between">
                            <span className="text-[10px] text-text-dim">حجم الصورة (بوصة)</span>
                            <span className="text-[10px] text-primary">{passportSize}</span>
                        </div>
                        <input 
                            type="range" min="1.2" max="2.2" step="0.1" 
                            value={passportSize} 
                            onChange={e => setPassportSize(parseFloat(e.target.value))}
                            className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                    </div>
                    
                    <div className="flex justify-between items-center">
                         <span className="text-xs text-text-dim">عدد الصور</span>
                         <div className="flex gap-1">
                             {[3, 6, 9].map(num => (
                                 <button 
                                     key={num}
                                     onClick={() => setPassportCount(num)}
                                     className={`w-6 h-6 text-[10px] font-bold rounded flex items-center justify-center transition-all ${passportCount === num ? 'bg-primary text-black scale-110' : 'bg-black text-text-dim border border-gray-600'}`}
                                 >
                                     {num}
                                 </button>
                             ))}
                         </div>
                    </div>

                    <div className="flex items-center gap-2">
                         <input type="checkbox" id="border" className="accent-primary w-4 h-4" checked={showBorder} onChange={e => setShowBorder(e.target.checked)} />
                         <label htmlFor="border" className="text-xs text-text-light cursor-pointer select-none">إضافة إطار أسود</label>
                    </div>

                    <div className="flex items-center gap-2">
                         <input type="checkbox" id="gradient" className="accent-secondary w-4 h-4" checked={useGradientBg} onChange={e => setUseGradientBg(e.target.checked)} />
                         <label htmlFor="gradient" className="text-xs text-text-light cursor-pointer select-none">تدرج خلفية داكن</label>
                    </div>
                 </div>
             )}
        </div>

        {/* Quick Actions */}
        <div>
            <h2 className="text-text-light text-base font-bold mb-4">الخيارات الذكية</h2>
            <div className="flex flex-col gap-3">
                <QuickAction label="إزالة الخلفية" action="Remove BG" hasImage={hasImage} onProcessAI={onProcessAI} />
                <QuickAction label="بدلة رسمية (Nano)" action="Formal Suit" hasImage={hasImage} onProcessAI={onProcessAI} />
                <QuickAction label="حجاب إسلامي (Nano)" action="Hijab" hasImage={hasImage} onProcessAI={onProcessAI} />
                <QuickAction label="تعديل ذكي (Nano)" action="Nano Banana" hasImage={hasImage || true} onProcessAI={onProcessAI} />
            </div>
        </div>

        <div className="border-t border-white/10"></div>

        {/* Adjustments */}
        <div className={isPassportMode ? 'opacity-50 pointer-events-none' : ''}>
            <h3 className="text-sm font-semibold text-primary mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">tune</span>
                التعديلات
            </h3>
            <div className="flex flex-col gap-5">
                {sliders.map(s => (
                    <SliderControl 
                      key={s.key} 
                      item={s} 
                      val={filters[s.key as keyof FilterState]} 
                      hasImage={hasImage}
                      onChange={onChange}
                    />
                ))}
            </div>
        </div>

      </div>
    </aside>
  );
};

export default PropertiesPanel;
