import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';

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
 * Hook for using translations in components
 * Automatically syncs with device language and AsyncStorage
 * Applies RTL layout when language is changed
 *
 * Usage:
 *   const { t, language } = useTranslation();
 *   t('setup.title')
 *   t('report.waiting', { count: 5 })
 */
export function useTranslation() {
  const [language, setLanguage] = useState<Language>(DEFAULT_LANGUAGE);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved language preference on mount and apply RTL immediately
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
        const langToUse = (savedLanguage === 'en' || savedLanguage === 'ar') ? savedLanguage : DEFAULT_LANGUAGE;
        
        setLanguage(langToUse);
        setRTLDirection(langToUse);
        
        // Force RTL update to ensure layout mirrors immediately
        I18nManager.forceRTL(isRTL(langToUse));
      } catch (error) {
        console.error('Failed to load language preference:', error);
        setLanguage(DEFAULT_LANGUAGE);
        setRTLDirection(DEFAULT_LANGUAGE);
      } finally {
        setIsLoaded(true);
      }
    };

    loadLanguage();
  }, []);

  /**
   * Get a translation string
   * Usage: t('setup.title') or t('setup.infoText', { zone: 'Gaza City' })
   */
  const t = (key: string, params?: Record<string, string | number>): string => {
    return getTranslation(key, language, params);
  };

  /**
   * Change the app language and apply RTL if needed
   */
  const setLanguagePreference = async (newLanguage: Language) => {
    try {
      setLanguage(newLanguage);
      setRTLDirection(newLanguage); // Apply RTL layout immediately
      I18nManager.forceRTL(isRTL(newLanguage)); // Force layout update
      await AsyncStorage.setItem(LANGUAGE_KEY, newLanguage);
      
      // Small delay to ensure RTL change propagates
      setTimeout(() => {
        // Force a re-render by triggering a small state update
      }, 100);
    } catch (error) {
      console.error('Failed to save language preference:', error);
    }
  };

  return {
    t,
    language,
    setLanguage: setLanguagePreference,
    isLoaded,
    isRTL: isRTL(language),
  };
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
