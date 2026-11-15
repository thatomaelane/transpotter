import { useTranslation } from 'react-i18next'

export default function Placeholder({ titleKey }: { titleKey: string }) {
  const { t } = useTranslation()
  return (
    <section className="container section">
      <h1>{t(titleKey)}</h1>
      <p className="lead-dark">{t('placeholder.soon')}</p>
    </section>
  )
}
