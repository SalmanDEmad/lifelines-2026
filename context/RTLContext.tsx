import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { I18nManager } from 'react-native';

interface RTLContextType {
  isRTL: boolean;
  updateRTL: (rtl: boolean) => void;
}

const RTLContext = createContext<RTLContextType | undefined>(undefined);

export const RTLProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isRTL, setIsRTL] = useState(I18nManager.isRTL);

  const updateRTL = useCallback((rtl: boolean) => {
    I18nManager.forceRTL(rtl);
    setIsRTL(rtl);
    
    // Trigger a re-render of all components
    // This ensures text alignment and layout changes apply immediately
    if (rtl !== isRTL) {
      setIsRTL(rtl);
    }
  }, [isRTL]);

  return (
    <RTLContext.Provider value={{ isRTL, updateRTL }}>
      {children}
    </RTLContext.Provider>
  );
};

export const useRTL = () => {
  const context = useContext(RTLContext);
  if (!context) {
    throw new Error('useRTL must be used within RTLProvider');
  }
  return context;
};
