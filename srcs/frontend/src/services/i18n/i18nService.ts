import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enTranslation from '../../locales/en/translation.json';
import arTranslation from '../../locales/ar/translation.json';
import ruTranslation from '../../locales/ru/translation.json';

// Language configuration
export const SUPPORTED_LANGUAGES = {
  en: { name: 'English', nativeName: 'English', dir: 'ltr' },
  ar: { name: 'Arabic', nativeName: 'العربية', dir: 'rtl' },
  ru: { name: 'Russian', nativeName: 'Русский', dir: 'ltr' }
};

export const DEFAULT_LANGUAGE = 'en';

// Initialize i18next
i18next
  .use(LanguageDetector)
  .init({
    resources: {
      en: { translation: enTranslation },
      ar: { translation: arTranslation },
      ru: { translation: ruTranslation }
    },
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: Object.keys(SUPPORTED_LANGUAGES),
    debug: false,
    interpolation: {
      escapeValue: false // React already escapes values
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng'
    }
  });

// Function to change language
export const changeLanguage = (lang: string) => {
  if (SUPPORTED_LANGUAGES[lang as keyof typeof SUPPORTED_LANGUAGES]) {
    i18next.changeLanguage(lang);
    localStorage.setItem('i18nextLng', lang);
    
    // Update document direction for RTL languages
    const direction = SUPPORTED_LANGUAGES[lang as keyof typeof SUPPORTED_LANGUAGES].dir;
    document.documentElement.dir = direction;
    document.documentElement.lang = lang;
    
    // Trigger custom event for components to re-render
    window.dispatchEvent(new Event('languageChanged'));
  }
};

// Get current language
export const getCurrentLanguage = () => {
  return i18next.language || DEFAULT_LANGUAGE;
};

// Translation function
export const t = (key: string, options?: any) => {
  return i18next.t(key, options);
};

// Initialize direction on load
const currentLang = getCurrentLanguage();
const direction = SUPPORTED_LANGUAGES[currentLang as keyof typeof SUPPORTED_LANGUAGES]?.dir || 'ltr';
document.documentElement.dir = direction;
document.documentElement.lang = currentLang;

export default i18next;