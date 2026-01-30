import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager, Alert, Platform } from 'react-native';
import * as Updates from 'expo-updates';

// Import translation files
import en from '../locales/en.json';
import ar from '../locales/ar.json';

export type Language = 'en' | 'ar';

const translations: Record<Language, any> = {
  en,
  ar,
};

const LANGUAGE_KEY = 'app-language';
const DEFAULT_LANGUAGE: Language = 'ar'; // Default to Arabic for Gaza context

// Create a context for global language state
type TranslationContextType = {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
  isLoaded: boolean;
  isRTL: boolean;
};

const TranslationContext = createContext<TranslationContextType | null>(null);

// Export the context for safe access in components
export { TranslationContext };

/**
 * Check if language is RTL (Right-to-Left)
 */
export const isRTL = (language: Language): boolean => {
  return language === 'ar';
};

/**
 * Enable/disable RTL based on language
 */
export const setRTLDirection = (language: Language) => {
  const rtl = isRTL(language);
  I18nManager.forceRTL(rtl);
};

/**
 * Get a translation value by dot-notation key
 * Example: t('setup.title') returns the setup title in current language
 * Supports parameter substitution: t('setup.infoText', { zone: 'Gaza City' })
 */
export function getTranslation(
  key: string,
  language: Language = DEFAULT_LANGUAGE,
  params?: Record<string, string | number>
): string {
  const keys = key.split('.');
  let value: any = translations[language];

  // Navigate through nested object
  for (const k of keys) {
    if (value && typeof value === 'object') {
      value = value[k];
    } else {
      console.warn(`Translation key not found: ${key} (${language})`);
      return key; // Return key as fallback
    }
  }

  // If value is not a string, return the key
  if (typeof value !== 'string') {
    console.warn(`Translation value is not a string: ${key} (${language})`);
    return key;
  }

  // Substitute parameters
  if (params) {
    let result = value;
    for (const [paramKey, paramValue] of Object.entries(params)) {
      result = result.replace(`{${paramKey}}`, String(paramValue));
    }
    return result;
  }

  return value;
}

/**
 * Provider component for translations
 */
export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
        const langToUse = (savedLanguage === 'en' || savedLanguage === 'ar') ? savedLanguage : DEFAULT_LANGUAGE;
        
        setLanguageState(langToUse);
        setRTLDirection(langToUse);
      } catch (error) {
        console.error('Failed to load language preference:', error);
        setLanguageState(DEFAULT_LANGUAGE);
        setRTLDirection(DEFAULT_LANGUAGE);
      } finally {
        setIsLoaded(true);
      }
    };

    loadLanguage();
  }, []);

  const t = (key: string, params?: Record<string, string | number>): string => {
    return getTranslation(key, language, params);
  };

  const setLanguage = async (newLanguage: Language) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, newLanguage);
      setLanguageState(newLanguage);
    } catch (error) {
      console.error('Failed to save language preference:', error);
    }
  };

  return (
    <TranslationContext.Provider value={{ language, setLanguage, t, isLoaded, isRTL: isRTL(language) }}>
      {children}
    </TranslationContext.Provider>
  );
}

/**
 * Hook for using translations in components
 */
export function useTranslation() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within TranslationProvider');
  }
  return context;
}

/**
 * Get available languages
 */
export function getAvailableLanguages(): Array<{ code: Language; name: string }> {
  return [
    { code: 'ar', name: 'العربية' },
    { code: 'en', name: 'English' },
  ];
}
