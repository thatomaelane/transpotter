import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase, supabaseConfigured } from '../lib/supabase'

type Stage = 'idle' | 'confirm' | 'sending' | 'sent' | 'error'
type ErrorKind = 'location' | 'send' | 'config'

function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('unsupported'))
      return
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0,
    })
  })
}

export default function Emergency() {
  const { t } = useTranslation()
  const [stage, setStage] = useState<Stage>('idle')
  const [errorKind, setErrorKind] = useState<ErrorKind>('send')
  const [note, setNote] = useState('')
  const [reference, setReference] = useState('')

  async function sendAlert() {
    if (!supabaseConfigured) {
      setErrorKind('config')
      setStage('error')
      return
    }
    setStage('sending')

    let position: GeolocationPosition
    try {
      position = await getPosition()
    } catch {
      setErrorKind('location')
      setStage('error')
      return
    }

    try {
      const { data, error } = await supabase.rpc('submit_report', {
        p_id: crypto.randomUUID(),
        p_mode: 'other',
        p_hazard_type: 'emergency_alert',
        p_description: note,
        p_lat: position.coords.latitude,
        p_lng: position.coords.longitude,
        p_accuracy_m: position.coords.accuracy,
        p_observed_at: new Date().toISOString(),
        p_people_in_danger: 'yes',
        p_privacy: 'anonymous',
        p_is_emergency: true,
        p_photo_path: null,
        p_name: null,
        p_phone: null,
        p_email: null,
      })
      if (error) throw error
      setReference(String(data))
      setStage('sent')
    } catch {
      setErrorKind('send')
      setStage('error')
    }
  }

  const errorText =
    errorKind === 'location'
      ? t('emergency.errorLocation')
      : errorKind === 'config'
        ? t('emergency.errorConfig')
        : t('emergency.errorSend')

  return (
    <section className="container section emergency">
      <h1>{t('emergency.title')}</h1>
      <p className="lead-dark">{t('emergency.lead')}</p>

      <div className="call-grid">
        <a className="call-card" href="tel:10111">
          <span className="call-number">10111</span>
          <span>{t('emergency.police')}</span>
          <span className="call-action">{t('emergency.call')}</span>
        </a>
        <a className="call-card" href="tel:10177">
          <span className="call-number">10177</span>
          <span>{t('emergency.ambulance')}</span>
          <span className="call-action">{t('emergency.call')}</span>
        </a>
        <a className="call-card" href="tel:112">
          <span className="call-number">112</span>
          <span>{t('emergency.general')}</span>
          <span className="call-action">{t('emergency.call')}</span>
        </a>
      </div>

      <div className="panel">
        <h2>{t('emergency.alertTitle')}</h2>
        <p>{t('emergency.alertText')}</p>

        {stage === 'idle' && (
          <>
            <label className="field">
              <span>{t('emergency.noteLabel')}</span>
              <textarea
                rows={3}
                maxLength={500}
                value={note}
                placeholder={t('emergency.notePlaceholder')}
                onChange={(e) => setNote(e.target.value)}
              />
            </label>
            <button className="btn btn-danger btn-block" onClick={() => setStage('confirm')}>
              {t('emergency.sendButton')}
            </button>
          </>
        )}

        {stage === 'confirm' && (
          <div className="confirm" role="alertdialog" aria-labelledby="confirm-title">
            <h3 id="confirm-title">{t('emergency.confirmTitle')}</h3>
            <p>{t('emergency.confirmText')}</p>
            <div className="cta-row">
              <button className="btn btn-danger" onClick={() => void sendAlert()}>
                {t('emergency.confirmYes')}
              </button>
              <button className="btn btn-ghost-dark" onClick={() => setStage('idle')}>
                {t('emergency.cancel')}
              </button>
            </div>
          </div>
        )}

        {stage === 'sending' && (
          <p className="status" role="status">
            {t('emergency.sending')}
          </p>
        )}

        {stage === 'sent' && (
          <div className="success" role="status">
            <h3>{t('emergency.sentTitle')}</h3>
            <p>{t('emergency.sentText')}</p>
            <p className="ref-label">{t('emergency.reference')}</p>
            <p className="ref">{reference}</p>
            <Link to="/" className="btn btn-ghost-dark">
              {t('emergency.back')}
            </Link>
          </div>
        )}

        {stage === 'error' && (
          <div className="error" role="alert">
            <p>{errorText}</p>
            <button className="btn btn-danger" onClick={() => setStage('idle')}>
              {t('emergency.retry')}
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
