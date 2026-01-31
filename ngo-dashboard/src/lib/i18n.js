import { useState, useEffect } from 'react';
import en from '../locales/en.json';
import ar from '../locales/ar.json';

const translations = { en, ar };

export const useTranslation = () => {
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    // Load language from localStorage
    const savedLanguage = localStorage.getItem('dashboard_language') || 'en';
    setLanguage(savedLanguage);
  }, []);

  const t = (key, params = {}) => {
    const keys = key.split('.');
    let value = translations[language];

    for (const k of keys) {
      value = value?.[k];
    }

    if (!value) {
      console.warn(`Missing translation key: ${key}`);
      return key;
    }

    if (typeof value !== 'string') {
      return value;
    }

    // Replace parameters
    let result = value;
    Object.entries(params).forEach(([param, val]) => {
      result = result.replace(`{${param}}`, val);
    });

    return result;
  };

  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('dashboard_language', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  };

  return { t, language, changeLanguage };
};
