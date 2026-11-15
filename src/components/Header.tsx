import { Link, NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LanguagePicker from './LanguagePicker'

export default function Header() {
  const { t } = useTranslation()
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link to="/" className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <span className="brand-name">{t('brand')}</span>
        </Link>
        <nav className="nav" aria-label="Main">
          <NavLink to="/report">{t('nav.report')}</NavLink>
          <NavLink to="/updates">{t('nav.updates')}</NavLink>
          <NavLink to="/command">{t('nav.command')}</NavLink>
        </nav>
        <LanguagePicker />
      </div>
    </header>
  )
}
