
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AppStateContextType {
  selectedImage: string | null; // The displayable image (Data URL)
  processedImageBytes: Uint8Array | null; // The raw bytes returned from API
  isLoading: boolean;
  
  setSelectedImage: (image: string | null) => void;
  setProcessedImageBytes: (bytes: Uint8Array | null) => void;
  setIsLoading: (loading: boolean) => void;
  
  // History Management
  pushHistory: () => void;
  undo: () => void;
  canUndo: boolean;
}

const AppContext = createContext<AppStateContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [processedImageBytes, setProcessedImageBytes] = useState<Uint8Array | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // History Stack (Last-In-First-Out)
  const [history, setHistory] = useState<string[]>([]);

  const pushHistory = () => {
    if (selectedImage) {
      setHistory(prev => [...prev, selectedImage]);
    }
  };

  const undo = () => {
    if (history.length === 0) return;
    
    const previousImage = history[history.length - 1];
    const newHistory = history.slice(0, -1);
    
    setHistory(newHistory);
    setSelectedImage(previousImage);
  };

  const canUndo = history.length > 0;

  return (
    <AppContext.Provider value={{
      selectedImage,
      processedImageBytes,
      isLoading,
      setSelectedImage,
      setProcessedImageBytes,
      setIsLoading,
      pushHistory,
      undo,
      canUndo
    }}>
      {children}
    </AppContext.Provider>
  );
};

/**
 * Hook to access the global app state
 */
export const useAppState = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppProvider');
  }
  return context;
};
