import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { AuthUtils } from '../../utils/authUtils.js';
import { apiServices } from '../ApiServices.js';

//translation files
import enTranslation from '../../locales/en/translation.json';
import arTranslation from '../../locales/sp/translation.json';
import ruTranslation from '../../locales/ru/translation.json';

// Language configuration
export const SUPPORTED_LANGUAGES = {
  en: { name: 'English', nativeName: 'English', dir: 'ltr' },
  sp: { name: 'Spanish', nativeName: 'Español', dir: 'ltr' },
  ru: { name: 'Russian', nativeName: 'Русский', dir: 'ltr' }
};

/* 
  en >> English
  sp >> Spanish
  ru >> Russian 
*/

export const DEFAULT_LANGUAGE = 'en'; //Used as a fallback when no valid language is detected or available.

// i18next Initialization
export const i18nReady = i18next.use(LanguageDetector).init({
    resources: { //Loaded translation JSON files
      en: { translation: enTranslation },
      sp: { translation: arTranslation },
      ru: { translation: ruTranslation }
    },
    fallbackLng: DEFAULT_LANGUAGE, //Language used if a translation is missing
    supportedLngs: Object.keys(SUPPORTED_LANGUAGES), //Restricts available languages
    debug: false,
    interpolation: {
      escapeValue: false 
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng'
    }
  });

// Function to change language
export const changeLanguage = async (lang: string, persistToBackend: boolean = true) => {
  if (SUPPORTED_LANGUAGES[lang as keyof typeof SUPPORTED_LANGUAGES]) {
    i18next.changeLanguage(lang);
    localStorage.setItem('i18nextLng', lang);
    
    // Update document direction
    const direction = SUPPORTED_LANGUAGES[lang as keyof typeof SUPPORTED_LANGUAGES]?.dir || 'ltr';
    document.documentElement.dir = direction;
    document.documentElement.lang = lang;
    
    // Trigger custom event for components to re-render
    window.dispatchEvent(new Event('languageChanged'));
    
    // Persist to backend if requested and user is logged in
    if (persistToBackend) {
      try {
        // Avoid calling backend for anonymous users (prevents 401 spam)
        if (AuthUtils.isLoggedIn()) {
          await updateLanguageOnBackend(lang);
        }
      } catch (error) {
        console.error('Failed to update language on backend:', error);
      }
    }
  }
};

// Function to update language on backend
const updateLanguageOnBackend = async (language: string) => {
  try {
    const response = await fetch('/api/profileServ/user/language', {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ language })
    });
    
    if (!response.ok) {
      throw new Error('Failed to update language');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating language on backend:', error);
    throw error;
  }
};

// Function to initialize language from backend
export const initializeLanguageFromBackend = async (): Promise<string> => {
  try {
    // First check if user is logged in
    const loginStatusResponse = await apiServices.auth.getLoginStatus();
    
    if (loginStatusResponse.success && loginStatusResponse.data?.loggedIn === true) {
      // If user is logged in, get their language preference from userInfo
      const userInfoRes = await apiServices.profile.getCurrentUser();

      if (userInfoRes.success && userInfoRes.data) {
        const backendLanguage = userInfoRes.data.defaultLanguage || userInfoRes.data.language;

        // Validate language is supported
        if (SUPPORTED_LANGUAGES[backendLanguage as keyof typeof SUPPORTED_LANGUAGES]) {
          await changeLanguage(backendLanguage, false); 
          return backendLanguage;
        }
      }
    }
    
    // For non-logged-in users or if backend calls fail, use stored language or default
    const storedLanguage = localStorage.getItem('i18nextLng') || DEFAULT_LANGUAGE;
    if (SUPPORTED_LANGUAGES[storedLanguage as keyof typeof SUPPORTED_LANGUAGES]) {
      await changeLanguage(storedLanguage, false); 
      return storedLanguage;
    }
    
    // Final fallback to default language (English for non-logged-in users)
    await changeLanguage(DEFAULT_LANGUAGE, false); 
    return DEFAULT_LANGUAGE;
    
  } catch (error) {
    console.error('Error initializing language from backend:', error);
    
    // Fallback to stored language or default
    const storedLanguage = localStorage.getItem('i18nextLng') || DEFAULT_LANGUAGE;
    if (SUPPORTED_LANGUAGES[storedLanguage as keyof typeof SUPPORTED_LANGUAGES]) {
      await changeLanguage(storedLanguage, false); 
      return storedLanguage;
    }
    
    await changeLanguage(DEFAULT_LANGUAGE, false); 
    return DEFAULT_LANGUAGE;
  }
};

// Get current language
export const getCurrentLanguage = () => {
  return i18next.language || DEFAULT_LANGUAGE;
};

// Translation function
export const t = (key: string, options?: any): string => {
  const result = i18next.t(key, options);
  return typeof result === "string"? result : String(result);
};

// Translation for error messages
// Function takes API error response and translates it based on error code
type ApiErrorLike = {
  code?: string;
  message?: string;
};

export function translateApiError(
  response: ApiErrorLike,
  fallbackKey = "errors.GENERIC"
): string {
  if (response?.code) {
    const translated = t(`errors.${response.code}`);
    if (translated) return translated as string;
  }

  return t(fallbackKey) as string; // if there is no error code or translation, show generic message
}

// Initialize direction on load
const currentLang = getCurrentLanguage();
const direction = SUPPORTED_LANGUAGES[currentLang as keyof typeof SUPPORTED_LANGUAGES]?.dir || 'ltr';
document.documentElement.dir = direction;
document.documentElement.lang = currentLang;

export default i18next;