import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { en } from './en'

// Add a language here only after a native speaker has proofread it.
export const LANGUAGES: { code: string; name: string }[] = [
  { code: 'en', name: 'English' },
]

const STORAGE_KEY = 'transpotter.lang'

function readSaved(): string | undefined {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved && LANGUAGES.some((l) => l.code === saved) ? saved : undefined
  } catch {
    return undefined
  }
}

export function saveLanguage(code: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, code)
  } catch {
    // Storage can be unavailable (private mode). The choice then lasts for this visit only.
  }
}

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en } },
  lng: readSaved() ?? 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export default i18n
