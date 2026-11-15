import { Link, Route, Routes, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Header from './components/Header'
import Home from './pages/Home'
import Emergency from './pages/Emergency'
import Placeholder from './pages/Placeholder'
import Report from './pages/Report'

export default function App() {
  const { t } = useTranslation()
  const { pathname } = useLocation()

  return (
    <>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/emergency" element={<Emergency />} />
          <Route path="/report" element={<Report />} />
          <Route path="/updates" element={<Placeholder titleKey="placeholder.updates" />} />
          <Route path="/command" element={<Placeholder titleKey="placeholder.command" />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <footer className="site-footer">
        <div className="container">{t('footer')}</div>
      </footer>
      {pathname !== '/emergency' && (
        <Link to="/emergency" className="sos" aria-label={t('nav.emergency')}>
          {t('nav.emergency')}
        </Link>
      )}
    </>
  )
}
