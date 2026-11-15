import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const MODES = ['road', 'rail', 'aviation', 'marine'] as const

export default function Home() {
  const { t } = useTranslation()
  return (
    <>
      <section className="hero">
        <div className="container">
          <p className="eyebrow">{t('home.eyebrow')}</p>
          <h1>{t('home.title')}</h1>
          <p className="lead">{t('home.lead')}</p>
          <div className="cta-row">
            <Link to="/report" className="btn btn-gold">
              {t('home.reportCta')}
            </Link>
            <Link to="/emergency" className="btn btn-danger">
              {t('home.emergencyCta')}
            </Link>
            <Link to="/updates" className="btn btn-ghost">
              {t('home.updatesCta')}
            </Link>
          </div>
          <p className="tagline">{t('tagline')}</p>
        </div>
      </section>

      <section className="container section">
        <h2>{t('home.modesTitle')}</h2>
        <div className="grid-4">
          {MODES.map((m) => (
            <article key={m} className="card">
              <h3>{t(`modes.${m}.name`)}</h3>
              <p>{t(`modes.${m}.text`)}</p>
            </article>
          ))}
        </div>
        <p className="notice">{t('home.notice')}</p>
      </section>
    </>
  )
}
