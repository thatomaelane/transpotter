import { useTranslation } from 'react-i18next'
import { LANGUAGES, saveLanguage } from '../i18n'

export default function LanguagePicker() {
  const { t, i18n } = useTranslation()

  function onChange(code: string) {
    void i18n.changeLanguage(code)
    saveLanguage(code)
    document.documentElement.lang = code
  }

  return (
    <label className="lang">
      <span className="sr-only">{t('language.label')}</span>
      <select
        value={i18n.language}
        onChange={(e) => onChange(e.target.value)}
        aria-label={t('language.label')}
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.name}
          </option>
        ))}
      </select>
    </label>
  )
}
