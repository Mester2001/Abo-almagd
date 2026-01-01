import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language } from './types';
import { TRANSLATIONS } from './constants';

interface LanguageContextType {
  lang: Language;
  toggleLang: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('abu_almagd_lang');
    return (saved as Language) || 'ar';
  });

  const toggleLang = () => {
    setLang(prev => {
      const next = prev === 'en' ? 'ar' : 'en';
      localStorage.setItem('abu_almagd_lang', next);
      return next;
    });
  };

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  const t = (key: string): string => {
    return (TRANSLATIONS[lang] as any)[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t }}>
      <div className={lang === 'ar' ? 'font-cairo' : 'font-montserrat'}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};