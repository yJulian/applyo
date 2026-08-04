import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import de from './locales/de.json';
import en from './locales/en.json';

const STORAGE_KEY = 'applyo_language';
const DETECTED_COUNTRY_KEY = 'applyo_detected_country';

export type LanguagePref = 'auto' | 'de' | 'en';
export type LanguagePreference = LanguagePref;

export function getLanguagePreference(): LanguagePref {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'de' || saved === 'en') return saved;
  return 'auto';
}

export function getStoredDetectedCountry(): string | null {
  return localStorage.getItem(DETECTED_COUNTRY_KEY);
}

export function resolveLanguage(pref: LanguagePref): 'de' | 'en' {
  if (pref === 'de' || pref === 'en') return pref;
  const browserLang = navigator.language || (navigator.languages && navigator.languages[0]) || 'de';
  if (browserLang.toLowerCase().startsWith('de')) return 'de';
  return 'en';
}

const initialPref = getLanguagePreference();

i18n
  .use(initReactI18next)
  .init({
    resources: {
      de: { translation: de },
      en: { translation: en },
    },
    lng: resolveLanguage(initialPref),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export async function detectLanguageViaGeoIP(): Promise<{ countryCode: string; language: 'de' | 'en' } | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const country = data.country_code || data.country;
      if (country) {
        const countryCode = String(country).toUpperCase();
        localStorage.setItem(DETECTED_COUNTRY_KEY, countryCode);
        const deCountries = ['DE', 'AT', 'CH', 'LI', 'LU'];
        const detectedLang: 'de' | 'en' = deCountries.includes(countryCode) ? 'de' : 'en';
        return { countryCode, language: detectedLang };
      }
    }
  } catch (_e) {
    // Secondary fallback service if ipapi is blocked
    try {
      const res2 = await fetch('https://ipwho.is/');
      if (res2.ok) {
        const data2 = await res2.json();
        const country = data2.country_code;
        if (country) {
          const countryCode = String(country).toUpperCase();
          localStorage.setItem(DETECTED_COUNTRY_KEY, countryCode);
          const deCountries = ['DE', 'AT', 'CH', 'LI', 'LU'];
          const detectedLang: 'de' | 'en' = deCountries.includes(countryCode) ? 'de' : 'en';
          return { countryCode, language: detectedLang };
        }
      }
    } catch (_) {}
  }
  return null;
}

export function setApplicationLanguage(langPreference: LanguagePref) {
  localStorage.setItem(STORAGE_KEY, langPreference);
  if (langPreference === 'auto') {
    detectLanguageViaGeoIP().then((result) => {
      const targetLang = result ? result.language : resolveLanguage('auto');
      i18n.changeLanguage(targetLang);
    }).catch(() => {
      i18n.changeLanguage(resolveLanguage('auto'));
    });
  } else {
    i18n.changeLanguage(langPreference);
  }
}

// Background GeoIP check on startup if preference is 'auto'
if (initialPref === 'auto') {
  detectLanguageViaGeoIP().then((result) => {
    if (result) {
      i18n.changeLanguage(result.language);
    }
  });
}

export default i18n;
